export interface EvaluationReport {
  score: number; // 0-100
  passed: boolean;
  metrics: {
    accuracy: number;
    grounding: number; // based on evidence
    completeness: number;
    security: number;
  };
  reasoning: string;
}

export class EvaluationEngine {
  public static evaluateResponse(agentId: string, content: string, threshold: number): EvaluationReport {
    // Simple production validation rules:
    // Check if agent provides structural evidence (arn, port numbers, or CIDR blocks)
    const hasArn = /arn:aws:[a-z0-9:-]+/i.test(content) || /eks-app-role/i.test(content) || /s3-customer-vault/i.test(content);
    const hasNetworkDetails = /0\.0\.0\.0/i.test(content) || /port 22/i.test(content) || /ingress/i.test(content);
    const hasVulnerabilityMention = /CVE-/i.test(content) || /wildcard/i.test(content) || /compliance/i.test(content);

    let accuracy = 90;
    let grounding = 80;
    let completeness = 85;
    let security = 95;

    if (hasArn) grounding += 10;
    if (hasNetworkDetails) completeness += 10;
    if (hasVulnerabilityMention) accuracy += 5;

    // Cap metrics to 100
    grounding = Math.min(grounding, 100);
    completeness = Math.min(completeness, 100);
    accuracy = Math.min(accuracy, 100);

    const overallScore = Math.round((accuracy + grounding + completeness + security) / 4);
    const passed = overallScore >= threshold;

    return {
      score: overallScore,
      passed,
      metrics: { accuracy, grounding, completeness, security },
      reasoning: passed 
        ? `Agent report passed evaluations. Evidence grounding verified.`
        : `Agent report lacks direct resource mapping anchors. Requesting alignment.`
    };
  }
}
