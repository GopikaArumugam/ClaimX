from sqlalchemy import inspect
from app.db.models import User, RoleEnum


def test_health_endpoints(client):
    """Verify /api/health and /api/v1/health return healthy status and metadata."""
    for path in ["/api/health", "/api/v1/health"]:
        resp = client.get(path)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"
        assert data["version"] == "1.0.0"
        assert "experiment_version" in data


def test_database_tables_created(test_db_session):
    """Verify all Section 20 relational tables exist in the database schema."""
    inspector = inspect(test_db_session.get_bind())
    table_names = set(inspector.get_table_names())
    expected_tables = {
        "users",
        "policies",
        "claims",
        "documents",
        "images",
        "agent_executions",
        "fraud_assessments",
        "cost_estimates",
        "decisions",
        "human_reviews",
        "audit_events",
        "final_reports",
    }
    assert expected_tables.issubset(table_names)


def test_register_and_login_customer(client, test_db_session):
    """Verify customer registration, bcrypt hashing, and duplicate email rejection."""
    reg_payload = {
        "full_name": "Priya Sharma",
        "email": "priya.sharma@example.com",
        "password": "SecurePassword2026!",
        "policy_number": "POL-992310",
        "phone": "+91 91234 56789",
    }
    resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert resp.status_code == 201
    body = resp.json()
    assert body["success"] is True
    assert "access_token" in body
    assert body["user"]["email"] == "priya.sharma@example.com"
    assert body["user"]["role"] == "CUSTOMER"

    # Verify password is stored as a bcrypt hash in the database, never plaintext
    db_user = test_db_session.query(User).filter(User.email == "priya.sharma@example.com").first()
    assert db_user is not None
    assert db_user.hashed_password != "SecurePassword2026!"
    assert db_user.hashed_password.startswith("$2b$")

    # Duplicate email registration must return 409 Conflict
    dup_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_resp.status_code == 409
    assert dup_resp.json()["error_code"] == "USER_ALREADY_EXISTS"


def test_seeded_personas_login_and_profile(client):
    """Verify login for seeded CUSTOMER and CLAIM_HANDLER accounts and /auth/me."""
    # 1. Login as Customer (Arun Kumar)
    cust_login = client.post(
        "/api/v1/auth/login",
        json={"email": "arun.kumar@gmail.com", "password": "••••••••••••"},
    )
    assert cust_login.status_code == 200
    cust_token = cust_login.json()["access_token"]
    assert cust_login.json()["user"]["role"] == RoleEnum.CUSTOMER.value

    me_resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["full_name"] == "Arun Kumar"

    # 2. Login as Claim Handler (Anand Officer)
    handler_login = client.post(
        "/api/v1/auth/login",
        json={"email": "anand.officer@aiclaims.internal", "password": "password123"},
    )
    assert handler_login.status_code == 200
    assert handler_login.json()["user"]["role"] == RoleEnum.CLAIM_HANDLER.value


def test_rbac_protection_on_confidence_thresholds(client):
    """Verify RBAC prevents CUSTOMER from modifying confidence thresholds while allowing CLAIM_HANDLER."""
    cust_token = client.post(
        "/api/v1/auth/login",
        json={"email": "arun.kumar@gmail.com", "password": "password123"},
    ).json()["access_token"]

    handler_token = client.post(
        "/api/v1/auth/login",
        json={"email": "anand.officer@aiclaims.internal", "password": "password123"},
    ).json()["access_token"]

    # Customer can read thresholds
    get_resp = client.get(
        "/api/v1/config/thresholds",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert get_resp.status_code == 200
    assert "vision_confidence_threshold" in get_resp.json()["thresholds"]

    # Customer CANNOT update thresholds -> 403 Forbidden
    forbidden_resp = client.put(
        "/api/v1/config/thresholds",
        headers={"Authorization": f"Bearer {cust_token}"},
        json={"vision_confidence_threshold": 0.50},
    )
    assert forbidden_resp.status_code == 403
    assert forbidden_resp.json()["error_code"] == "AUTH_FORBIDDEN"

    # Claim Handler CAN update thresholds -> 200 OK
    allowed_resp = client.put(
        "/api/v1/config/thresholds",
        headers={"Authorization": f"Bearer {handler_token}"},
        json={"vision_confidence_threshold": 0.82, "max_auto_approval_amount_inr": 60000.0},
    )
    assert allowed_resp.status_code == 200
    updated = allowed_resp.json()["thresholds"]
    assert updated["vision_confidence_threshold"] == 0.82
    assert updated["max_auto_approval_amount_inr"] == 60000.0
