import time
from datetime import datetime
from typing import Dict, Any, List, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity

from app.agents.base_agent import BaseClaimAgent
from app.agents.contract import (
    AgentContractOutput,
    AgentStatusEnum,
    RecommendedActionEnum,
)


POLICY_CLAUSE_KNOWLEDGE_BASE: List[Dict[str, Any]] = [
    {
        "clause_id": "CLAUSE-SEC1-01",
        "title": "Accidental External Impact Coverage",
        "text": "The company will indemnify the insured against loss or damage to the vehicle caused by accidental external means including frontal collision, rear-end impact, bumper cracking, headlamp shattering, and panel dents.",
        "coverage_status": "COVERED",
        "depreciation_pct": 0.0,
    },
    {
        "clause_id": "CLAUSE-ADDON-ZD",
        "title": "Zero Depreciation Bumper-to-Bumper Endorsement",
        "text": "Under Zero Depreciation Gold coverage, 100 percent of OEM replacement costs for plastic bumpers, LED headlamps, fiberglass, and sheet metal parts are payable without standard age depreciation.",
        "coverage_status": "COVERED",
        "depreciation_pct": 0.0,
    },
    {
        "clause_id": "CLAUSE-SEC1-UNDERCARRIAGE",
        "title": "Undercarriage, Suspension & Tie-Rod Impact Condition",
        "text": "High-speed undercarriage, control arm, and suspension impact claims exceeding INR 50,000 or exhibiting pre-existing corrosion require physical forensic surveyor verification to distinguish consequential wear from fresh impact.",
        "coverage_status": "AMBIGUOUS_REQUIRES_SURVEYOR",
        "depreciation_pct": 15.0,
    },
    {
        "clause_id": "CLAUSE-EXCL-EXPIRED",
        "title": "Policy Expiration & Lapse Exclusion",
        "text": "No coverage or indemnity applies if the motor insurance policy status is Expired or Lapsed on the date and time of the reported accident.",
        "coverage_status": "EXCLUDED",
        "depreciation_pct": 100.0,
    },
    {
        "clause_id": "CLAUSE-DED-01",
        "title": "Compulsory & Voluntary Deductible Schedule",
        "text": "Every approved claim settlement is subject to the compulsory policy deductible specified in the policy schedule (INR 5,000 for private cars; INR 10,000 for luxury/high-IDV vehicles).",
        "coverage_status": "DEDUCTIBLE_RULE",
        "depreciation_pct": 0.0,
    },
]


class PolicyAgent(BaseClaimAgent):
    """
    Section 8: Policy Intelligence & Retrieval Agent
    Explicitly separates:
    1. DETERMINISTIC RULES (policy validity dates, active status, numerical limits, compulsory deductibles)
    2. SEMANTIC / RAG CLAUSE RETRIEVAL & INTERPRETATION (vector search over chunked policy clauses).
    """

    agent_name = "policy"
    display_name = "Policy Agent"
    model_version = "hybrid-deterministic-lsa-rag-v1.0"

    def __init__(self):
        super().__init__()
        self.clauses = POLICY_CLAUSE_KNOWLEDGE_BASE
        self.tfidf = TfidfVectorizer(ngram_range=(1, 2), stop_words="english")
        self.svd = TruncatedSVD(n_components=4, random_state=42)
        self.sparse_matrix = None
        self.dense_embeddings = None
        self.retrieval_benchmarks: Dict[str, Dict[str, Any]] = {}
        self._build_and_benchmark_vector_index()

    def _build_and_benchmark_vector_index(self) -> None:
        """
        Builds vector index over chunked policy clauses and benchmarks:
        1. Lexical TF-IDF Cosine Retrieval
        2. Dense LSA/SVD Semantic Embedding Retrieval
        3. Hybrid (0.6 Dense + 0.4 Lexical) Retrieval
        Evaluates Recall@1, MRR@3, and query latency (ms) on ground-truth query-clause pairs.
        """
        corpus = [f"{c['title']} {c['text']}" for c in self.clauses]
        self.sparse_matrix = self.tfidf.fit_transform(corpus)
        self.dense_embeddings = self.svd.fit_transform(self.sparse_matrix)

        eval_queries = [
            ("frontal collision cracked front bumper and shattered LED headlamp", "CLAUSE-SEC1-01"),
            ("zero depreciation plastic bumper OEM replacement without deduction", "CLAUSE-ADDON-ZD"),
            ("undercarriage suspension lower arm divider impact over 50000", "CLAUSE-SEC1-UNDERCARRIAGE"),
            ("accident occurred after policy expired or lapsed", "CLAUSE-EXCL-EXPIRED"),
            ("compulsory deductible subtracted from final claim settlement", "CLAUSE-DED-01"),
        ]

        methods = ["Lexical_TFIDF", "Dense_Semantic_SVD", "Hybrid_Dense_Lexical"]
        for method in methods:
            t0 = time.perf_counter()
            hits_at_1 = 0
            reciprocal_ranks = []
            for q_text, expected_id in eval_queries:
                ranked = self._rank_clauses(q_text, mode=method)
                ranked_ids = [r["clause_id"] for r in ranked]
                if ranked_ids[0] == expected_id:
                    hits_at_1 += 1
                rank_pos = ranked_ids.index(expected_id) + 1 if expected_id in ranked_ids else 10
                reciprocal_ranks.append(1.0 / rank_pos)

            latency_ms = round((time.perf_counter() - t0) * 1000.0, 3)
            self.retrieval_benchmarks[method] = {
                "recall_at_1": round(hits_at_1 / len(eval_queries), 4),
                "mrr_at_3": round(float(np.mean(reciprocal_ranks)), 4),
                "latency_ms": latency_ms,
            }

    def _rank_clauses(self, query: str, mode: str = "Hybrid_Dense_Lexical", top_k: int = 3) -> List[Dict[str, Any]]:
        q_sparse = self.tfidf.transform([query])
        lex_scores = cosine_similarity(q_sparse, self.sparse_matrix)[0]

        q_dense = self.svd.transform(q_sparse)
        dense_scores = cosine_similarity(q_dense, self.dense_embeddings)[0]

        if mode == "Lexical_TFIDF":
            scores = lex_scores
        elif mode == "Dense_Semantic_SVD":
            scores = dense_scores
        else:
            scores = 0.6 * dense_scores + 0.4 * lex_scores

        ranked_indices = np.argsort(scores)[::-1][:top_k]
        results = []
        for idx in ranked_indices:
            c = dict(self.clauses[int(idx)])
            c["similarity_score"] = round(float(scores[int(idx)]), 4)
            results.append(c)
        return results

    def evaluate_deterministic_rules(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Part 1: DETERMINISTIC RULES ENGINE
        Evaluates policy status, dates, coverage ceiling, and deductible without LLM hallucination risk.
        """
        policy_status = str(context.get("policyStatus", "Active")).strip()
        policy_limit = float(context.get("policyLimit", 500000.0))
        claimed_amount = float(context.get("claimedAmount", 0.0))
        deductible = float(context.get("deductible", 5000.0))
        accident_date_str = str(context.get("accidentDate", "2026-09-10"))
        valid_from_str = str(context.get("valid_from", "2025-03-16"))
        valid_until_str = str(context.get("valid_until", "2027-03-15"))

        is_expired = policy_status.lower() in ("expired", "lapsed")
        try:
            acc_dt = datetime.strptime(accident_date_str[:10], "%Y-%m-%d")
            from_dt = datetime.strptime(valid_from_str[:10], "%Y-%m-%d")
            until_dt = datetime.strptime(valid_until_str[:10], "%Y-%m-%d")
            date_within_bounds = from_dt <= acc_dt <= until_dt
        except Exception:
            date_within_bounds = not is_expired

        if is_expired or not date_within_bounds:
            return {
                "deterministic_passed": False,
                "policy_active": False,
                "within_coverage_limit": claimed_amount <= policy_limit,
                "deductible_inr": deductible,
                "coverage_limit_inr": policy_limit,
                "termination_reason": f"Policy status is '{policy_status}' or accident date '{accident_date_str}' falls outside validity window.",
            }

        return {
            "deterministic_passed": True,
            "policy_active": True,
            "within_coverage_limit": claimed_amount <= policy_limit,
            "deductible_inr": deductible,
            "coverage_limit_inr": policy_limit,
            "termination_reason": None,
        }

    def _process(self, claim_id: str, context: Dict[str, Any]) -> AgentContractOutput:
        det = self.evaluate_deterministic_rules(context)
        policy_number = str(context.get("policyNumber", "POL-983742"))

        # Short-circuit immediately if deterministic rules prove policy is Expired/Lapsed (Dynamic Pruning)
        if not det["deterministic_passed"]:
            return AgentContractOutput(
                claim_id=claim_id,
                agent=self.agent_name,
                status=AgentStatusEnum.FAILED,
                result={
                    "deterministic_rules": det,
                    "retrieved_clauses": [self.clauses[3]],
                    "coverage_assessment": "EXCLUDED_EXPIRED_POLICY",
                    "retrieval_benchmarks": self.retrieval_benchmarks,
                },
                confidence=0.99,
                evidence=[f"Policy {policy_number} status={context.get('policyStatus')}", "CLAUSE-EXCL-EXPIRED"],
                issues=[det["termination_reason"]],
                recommended_action=RecommendedActionEnum.STOP,
            )

        # Part 2: SEMANTIC / RAG CLAUSE RETRIEVAL & INTERPRETATION
        incident_query = f"{context.get('claimType', '')} {context.get('incidentDescription', '')} {context.get('policyCoverage', '')}"
        retrieved_clauses = self._rank_clauses(incident_query, mode="Hybrid_Dense_Lexical", top_k=2)

        # Check for ambiguous coverage conditions (e.g. high-value undercarriage impact or multi-vehicle commercial pileup)
        has_ambiguous_clause = any(
            c["coverage_status"] == "AMBIGUOUS_REQUIRES_SURVEYOR" and c["similarity_score"] > 0.25
            for c in retrieved_clauses
        ) or ("multiple vehicle" in incident_query.lower() and float(context.get("claimedAmount", 0)) > 150000)

        evidence = [
            f"Policy {policy_number} verified Active (Limit: INR {det['coverage_limit_inr']:,.0f}, Deductible: INR {det['deductible_inr']:,.0f})"
        ] + [f"RAG Matched {c['clause_id']}: {c['title']} (score={c['similarity_score']})" for c in retrieved_clauses]

        issues: List[str] = []
        if has_ambiguous_clause:
            issues.append(
                "Ambiguous policy clause triggered (CLAUSE-SEC1-UNDERCARRIAGE): High-value undercarriage/structural claim requires human assessor coverage interpretation."
            )
            confidence = 0.74
            action = RecommendedActionEnum.ESCALATE
            status = AgentStatusEnum.NEED_MORE_EVIDENCE
            coverage_verdict = "AMBIGUOUS_ESCALATE_TO_HUMAN"
        else:
            confidence = 0.98
            action = RecommendedActionEnum.CONTINUE
            status = AgentStatusEnum.SUCCESS
            coverage_verdict = "COVERED_ELIGIBLE"

        return AgentContractOutput(
            claim_id=claim_id,
            agent=self.agent_name,
            status=status,
            result={
                "deterministic_rules": det,
                "retrieved_clauses": retrieved_clauses,
                "coverage_assessment": coverage_verdict,
                "deductible_inr": det["deductible_inr"],
                "coverage_limit_inr": det["coverage_limit_inr"],
                "retrieval_benchmarks": self.retrieval_benchmarks,
            },
            confidence=confidence,
            evidence=evidence,
            issues=issues,
            recommended_action=action,
        )


policy_agent = PolicyAgent()
