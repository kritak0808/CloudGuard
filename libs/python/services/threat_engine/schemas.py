from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class SimulationRunRequest(BaseModel):
    pull_request_id: str = Field(..., example="PR-402")
    commit_hash: str = Field(..., example="8f9a2b5c7d0e1f3a")
    author: str = Field(..., example="dev-ops-engineer")
    terraform_payload: str = Field(..., description="Raw Terraform plans modified in deployment PR")

class AttackHopDTO(BaseModel):
    step: int
    resource_id: str
    resource_name: str
    resource_type: str

class AttackVectorPathDTO(BaseModel):
    path_id: str
    name: str
    hops: List[AttackHopDTO]
    risk_score_impact: int

class SimulationRunResponse(BaseModel):
    simulation_id: str
    pull_request_id: str
    baseline_risk: int = Field(..., le=100, ge=0)
    predictive_risk: int = Field(..., le=100, ge=0)
    risk_delta: int
    critical_findings_count: int
    active_attack_paths: List[AttackVectorPathDTO]
    compliance_violations: List[str]

class RemediationPatchDTO(BaseModel):
    remediation_id: str
    filepath: str
    original_code: str
    modified_code: str

class RemediationProposal(BaseModel):
    remediation_plan_id: str
    simulation_id: str
    title: str
    description: str
    patches: List[RemediationPatchDTO]
    compliance_frameworks_satisfied: List[str]
