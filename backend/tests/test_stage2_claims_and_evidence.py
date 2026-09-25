import io


def test_list_claims_and_kpis(client):
    """Verify seeded claims and KPI aggregation."""
    resp = client.get("/api/v1/claims")
    assert resp.status_code == 200
    body = resp.json()
    assert body["success"] is True
    assert body["count"] >= 3

    kpis = client.get("/api/v1/claims/kpis")
    assert kpis.status_code == 200
    assert kpis.json()["data"]["totalClaims"] >= 3


def test_customer_rbac_claim_isolation(client):
    """Verify CUSTOMER can only access their own claims, while CLAIM_HANDLER accesses all."""
    cust_token = client.post(
        "/api/v1/auth/login",
        json={"email": "arun.kumar@gmail.com", "password": "password123"},
    ).json()["access_token"]

    handler_token = client.post(
        "/api/v1/auth/login",
        json={"email": "anand.officer@aiclaims.internal", "password": "password123"},
    ).json()["access_token"]

    # Arun Kumar accessing his own claim -> 200 OK
    own_resp = client.get(
        "/api/v1/claims/CLM-2026-01842",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert own_resp.status_code == 200

    # Arun Kumar attempting to access Priya Sharma's claim -> 403 Forbidden
    other_resp = client.get(
        "/api/v1/claims/CLM-2026-01903",
        headers={"Authorization": f"Bearer {cust_token}"},
    )
    assert other_resp.status_code == 403
    assert other_resp.json()["error_code"] == "AUTH_FORBIDDEN"

    # Claim Handler accessing Priya Sharma's claim -> 200 OK
    handler_resp = client.get(
        "/api/v1/claims/CLM-2026-01903",
        headers={"Authorization": f"Bearer {handler_token}"},
    )
    assert handler_resp.status_code == 200


def test_create_claim_and_evidence_upload(client):
    """Verify claim creation, document & image upload to Object Storage, and file validation."""
    create_payload = {
        "claimId": "CLM-2026-99001",
        "customer": {
            "name": "Arun Kumar",
            "email": "arun.kumar@gmail.com",
            "phone": "+91 98452 11984",
            "address": "Chennai, TN",
        },
        "policyNumber": "POL-983742",
        "vehicleNumber": "TN 45 AB 1234",
        "vehicleModel": "2023 Hyundai Creta SX (O)",
        "accidentDate": "2026-09-20",
        "accidentLocation": "Guindy Kathipara Flyover, Chennai",
        "claimType": "Vehicle Collision",
        "incidentDescription": "Rear bumper impact at signal stop.",
        "claimedAmount": 38000.0,
    }
    resp = client.post("/api/v1/claims", json=create_payload)
    assert resp.status_code == 201
    created = resp.json()["data"]
    assert created["claimId"] == "CLM-2026-99001"
    assert created["status"] == "SUBMITTED"
    assert len(created["activityFeed"]) >= 1

    # Upload valid PDF document
    pdf_bytes = b"%PDF-1.4 Fake Insurance Policy Schedule Content POL-983742"
    doc_resp = client.post(
        "/api/v1/claims/CLM-2026-99001/documents",
        files={"file": ("Policy_Schedule.pdf", io.BytesIO(pdf_bytes), "application/pdf")},
        data={"doc_type": "Policy"},
    )
    assert doc_resp.status_code == 201
    assert doc_resp.json()["document"]["storageUri"].startswith("bucket://CLM-2026-99001/documents/")

    # Reject invalid file format (.exe)
    bad_resp = client.post(
        "/api/v1/claims/CLM-2026-99001/documents",
        files={"file": ("malware.exe", io.BytesIO(b"MZ9000"), "application/octet-stream")},
        data={"doc_type": "Policy"},
    )
    assert bad_resp.status_code == 400
    assert bad_resp.json()["error_code"] == "UNSUPPORTED_FILE_FORMAT"

    # Upload valid vehicle image
    img_bytes = b"\x89PNG\r\n\x1a\nFakeImageHeaderAndPixels"
    img_resp = client.post(
        "/api/v1/claims/CLM-2026-99001/images",
        files={"file": ("front_bumper.png", io.BytesIO(img_bytes), "image/png")},
        data={"angle": "Front View"},
    )
    assert img_resp.status_code == 201
    assert img_resp.json()["image"]["storageUri"].startswith("bucket://CLM-2026-99001/images/")
