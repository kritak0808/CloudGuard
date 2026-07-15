from typing import Dict, Any, List, Set, Optional
from pydantic import BaseModel, Field
import time

class GraphNode(BaseModel):
    id: str
    type: str
    name: str
    properties: Dict[str, Any]
    version: int = 1
    timestamp: float = Field(default_factory=time.time)

class GraphRelationship(BaseModel):
    source_id: str
    target_id: str
    rel_type: str  # CONNECTED_TO | DEPENDS_ON | OWNS | CAN_ACCESS
    metadata: Dict[str, Any] = Field(default_factory=dict)

class TemporalChange(BaseModel):
    change_id: str
    timestamp: float
    resource_id: str
    action: str  # CREATED | MODIFIED | DELETED
    properties_delta: Dict[str, Any]

class KnowledgeGraphEngine:
    """
    Evolving Knowledge Graph representing the Infrastructure Genome Digital Twin.
    Supports temporal change logging, risk propagation, and NLP Cypher mapping.
    """
    def __init__(self):
        self.nodes: Dict[str, List[GraphNode]] = {}  # id -> list of historical versions
        self.relationships: List[GraphRelationship] = []
        self.changelog: List[TemporalChange] = []

    def clear(self):
        self.nodes.clear()
        self.relationships.clear()
        self.changelog.clear()

    # Temporal Append-Only Node updates
    def upsert_node(self, node_id: str, node_type: str, name: str, properties: Dict[str, Any]) -> int:
        timestamp = time.time()
        
        if node_id not in self.nodes:
            # Creation
            new_node = GraphNode(id=node_id, type=node_type, name=name, properties=properties, version=1, timestamp=timestamp)
            self.nodes[node_id] = [new_node]
            self.changelog.append(TemporalChange(
                change_id=f"chg-{node_id}-v1",
                timestamp=timestamp,
                resource_id=node_id,
                action="CREATED",
                properties_delta=properties
            ))
            return 1
        else:
            # Modification (Version append)
            history = self.nodes[node_id]
            latest = history[-1]
            
            # Simple delta check to see if properties changed
            if latest.properties == properties:
                return latest.version
                
            new_ver = latest.version + 1
            updated_node = GraphNode(
                id=node_id,
                type=node_type,
                name=name,
                properties=properties,
                version=new_ver,
                timestamp=timestamp
            )
            history.append(updated_node)
            self.changelog.append(TemporalChange(
                change_id=f"chg-{node_id}-v{new_ver}",
                timestamp=timestamp,
                resource_id=node_id,
                action="MODIFIED",
                properties_delta=properties
            ))
            return new_ver

    def add_relationship(self, source: str, target: str, rel_type: str, metadata: Dict[str, Any] = None) -> None:
        self.relationships.append(GraphRelationship(
            source_id=source,
            target_id=target,
            rel_type=rel_type,
            metadata=metadata or {}
        ))

    def get_latest_node(self, node_id: str) -> Optional[GraphNode]:
        history = self.nodes.get(node_id)
        return history[-1] if history else None

    # Temporal Replay: retrieve graph state at specific historical timestamp
    def get_graph_at_timestamp(self, timestamp: float) -> Dict[str, Any]:
        historical_nodes = {}
        for nid, history in self.nodes.items():
            # Find the latest node version that existed before or at target timestamp
            valid_node = None
            for node in history:
                if node.timestamp <= timestamp:
                    valid_node = node
                else:
                    break
            if valid_node:
                historical_nodes[nid] = valid_node
                
        return {
            "nodes": list(historical_nodes.values()),
            "relationships": self.relationships # Relationships can be expanded to temporal if needed
        }

    # Dynamic Risk Propagation Algorithm (spreads risk downstream through connection edges)
    def propagate_risk(self, initial_risk_map: Dict[str, int]) -> Dict[str, int]:
        """
        Risk propagation spreads through graph relationships.
        If EC2 Ingress has 80% risk, any connected IAM Role or Database receives a fraction of risk.
        """
        propagated_risk = {**initial_risk_map}
        visited: Set[str] = set()
        
        # BFS Traversal to propagate risk scores
        queue = list(initial_risk_map.keys())
        decay_factor = 0.85
        
        while queue:
            current_id = queue.pop(0)
            current_risk = propagated_risk.get(current_id, 0)
            
            # Find downstream neighbors that current_id connects to or can access
            for rel in self.relationships:
                if rel.source_id == current_id:
                    neighbor_id = rel.target_id
                    
                    # Calculate new potential risk from current node
                    neighbor_risk = int(current_risk * decay_factor)
                    existing_risk = propagated_risk.get(neighbor_id, 0)
                    
                    # If propagated risk is higher than existing, update and re-queue neighbor
                    if neighbor_risk > existing_risk:
                        propagated_risk[neighbor_id] = neighbor_risk
                        if neighbor_id not in visited:
                            visited.add(neighbor_id)
                            queue.append(neighbor_id)
                            
        return propagated_risk

    # Simulated Natural Language query compiler to highlight search targets
    def search_natural_language(self, search_query: str) -> List[str]:
        """
        Converts natural language input into list of matching node IDs.
        e.g., 'show databases' -> ['rds-payment-db']
        """
        query = search_query.lower()
        matched_ids = []
        
        for node_id, history in self.nodes.items():
            node = history[-1]
            # Match rules
            if "database" in query or "rds" in query:
                if node.type == "AWS_RDS_DB" or "db" in node.id:
                    matched_ids.append(node_id)
            elif "exposed" in query or "internet" in query:
                if node.id == "internet" or node.id == "alb-ingress" or node.status == "danger" or node.status == "warning":
                    matched_ids.append(node_id)
            elif "role" in query or "iam" in query:
                if node.type == "AWS_IAM_ROLE":
                    matched_ids.append(node_id)
            elif "pod" in query or "eks" in query:
                if node.type == "K8S_POD" or node.type == "AWS_EKS_CLUSTER":
                    matched_ids.append(node_id)
            elif "bucket" in query or "s3" in query:
                if node.type == "AWS_S3_BUCKET":
                    matched_ids.append(node_id)
            
            # General text match
            if not matched_ids and (query in node.id or query in node.name.lower()):
                matched_ids.append(node_id)
                
        return matched_ids
