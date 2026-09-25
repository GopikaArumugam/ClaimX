from app.agents.vision_agent import vision_agent
from app.agents.contract import AgentStatusEnum, RecommendedActionEnum


def test_vision_agent_model_comparison_recorded():
    """Verify ROI classification head benchmarks and detector trade-off specs are recorded."""
    assert "SVM_RBF_Classifier" in vision_agent.benchmark_comparison
    assert "RandomForest_Vision_Head" in vision_agent.benchmark_comparison
    assert "MLP_Neural_Head" in vision_agent.benchmark_comparison
    assert "YOLOv8n" in vision_agent.detector_architecture_specs
    assert "RT-DETR-L" in vision_agent.detector_architecture_specs
    assert "Faster-RCNN-ResNet50-FPN" in vision_agent.detector_architecture_specs


def test_vision_agent_low_confidence_to_recovery_loop():
    """
    Verify Section 5 & 13 Confidence-Aware Recovery:
    1. Blurry/underexposed photo yields confidence < 0.75 and REQUEST_EVIDENCE.
    2. Customer uploading clarified photo retries Vision Agent and yields confidence >= 0.90 and CONTINUE.
    """
    low_light_context = {
        "incidentDescription": "Rear bumper scrape in dark basement parking.",
        "accidentPhotos": [
            {
                "id": "IMG-DARK-01",
                "angle": "Rear View",
                "quality": "Insufficient",
                "visionConfidence": 39,
                "damageDetected": [],
            }
        ],
        "retry_count": 0,
    }
    res_low = vision_agent.run("CLM-2026-01775", low_light_context)
    assert res_low.confidence < 0.75
    assert res_low.status == AgentStatusEnum.NEED_MORE_EVIDENCE
    assert res_low.recommended_action == RecommendedActionEnum.REQUEST_EVIDENCE
    assert len(res_low.issues) > 0

    # Simulate Customer uploading clear daylight photo -> Retry
    recovered_context = {
        **low_light_context,
        "clarified_photo_uploaded": True,
        "retry_count": 1,
    }
    res_recovered = vision_agent.run("CLM-2026-01775", recovered_context)
    assert res_recovered.confidence >= 0.90
    assert res_recovered.status == AgentStatusEnum.SUCCESS
    assert res_recovered.recommended_action == RecommendedActionEnum.CONTINUE
    assert len(res_recovered.result["perceptual_dhashes"]) == 1
