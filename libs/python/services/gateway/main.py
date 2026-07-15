import time
import logging
from typing import Dict, Any, List
from fastapi import FastAPI, Request, HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Initialize FastAPI App representing Gateway Layer
app = FastAPI(
    title="CloudGuard AI Enterprise API Gateway",
    description="The centralized secure routing gateway for CloudGuard AI",
    version="1.0.0"
)

# Enable CORS for experience layer apps
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

# Logging config
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("api_gateway")

# In-Memory request counter for rate limiting
rate_limit_store: Dict[str, List[float]] = {}
RATE_LIMIT_MAX = 100  # requests
RATE_LIMIT_WINDOW = 60  # seconds

# Pydantic DTO definitions - Clean API contract bounds
class HealthResponse(BaseModel):
    status: str = Field(..., example="HEALTHY")
    version: str = Field(..., example="1.0.0")
    timestamp: float = Field(default_factory=time.time)

class SecurityIncidentDTO(BaseModel):
    incident_id: str
    resource_id: str
    severity: str
    risk_score: int
    attack_path_length: int
    resolved: bool

# Zero Trust Authentication & JWT scope checker middleware simulator
def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)) -> Dict[str, Any]:
    token = credentials.credentials
    # In enterprise production, this decodes the cryptographically signed JWT via OIDC/JWKS
    if token == "mock-token-secure-admin":
        return {
            "sub": "auth0|enterprise-admin-user",
            "org_id": "org_cloudguard_prod",
            "roles": ["SecurityAdmin", "PlatformEngineer"],
            "scopes": ["read:assets", "write:remediations"]
        }
    raise HTTPException(status_code=401, detail="Invalid cryptographically signed credential")

# Rate Limiting verification helper
def check_rate_limit(client_ip: str):
    now = time.time()
    if client_ip not in rate_limit_store:
        rate_limit_store[client_ip] = [now]
        return
    # filter timestamps within window
    rate_limit_store[client_ip] = [t for t in rate_limit_store[client_ip] if now - t < RATE_LIMIT_WINDOW]
    if len(rate_limit_store[client_ip]) >= RATE_LIMIT_MAX:
        logger.warning(f"Rate limit exceeded for client IP: {client_ip}")
        raise HTTPException(status_code=429, detail="API rate limit exceeded. Retry in 60s.")
    rate_limit_store[client_ip].append(now)

# API Routes
@app.get("/health", response_model=HealthResponse)
async def health_check():
    return HealthResponse(status="HEALTHY", version="1.0.0")

@app.get("/api/v1/incidents", response_model=List[SecurityIncidentDTO])
async def get_active_incidents(
    request: Request,
    user_context: Dict[str, Any] = Depends(verify_token)
):
    # Verify rate limit
    client_ip = request.client.host if request.client else "unknown"
    check_rate_limit(client_ip)
    
    # Audit Log security telemetry
    logger.info(
        f"AuditLog: User {user_context['sub']} of org {user_context['org_id']} "
        f"retrieved active incidents list."
    )
    
    # Return mockup representing EKS node exposure from PR-402
    return [
        SecurityIncidentDTO(
            incident_id="inc-eks-01",
            resource_id="eks-app-pod",
            severity="CRITICAL",
            risk_score=84,
            attack_path_length=3,
            resolved=False
        )
    ]
