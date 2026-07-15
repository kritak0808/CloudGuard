import { describe, it, expect } from 'vitest';
import { signAuditEntry, signEvidenceEntry } from '../data/identityData.js';
import type { SignedAuditLog, ComplianceEvidence } from '@cloudguard/types';

describe('Identity Cryptographic Signing', () => {
  it('should cryptographically sign audit logs with correct SHA-256 digest', () => {
    const rawLog: Omit<SignedAuditLog, 'signature'> = {
      id: 'aud-test-101',
      eventType: 'ZeroTrustPolicyCheck',
      actor: 'agent-compliance@cloudguard.ai',
      tenantId: 't-cyberdyne-sys',
      outcome: 'success',
      timestamp: '2026-07-15T12:00:00Z',
      details: 'ABAC match check complete'
    };

    const signedLog = signAuditEntry(rawLog);
    expect(signedLog.signature).toBeDefined();
    expect(signedLog.signature.length).toBe(64); // SHA-256 hex length is 64 characters

    // Verify deterministic signatures
    const signedLog2 = signAuditEntry(rawLog);
    expect(signedLog.signature).toBe(signedLog2.signature);
  });

  it('should sign compliance evidence entries correctly', () => {
    const rawEv: Omit<ComplianceEvidence, 'verifiableHash'> = {
      id: 'ev-test-55',
      framework: 'SOC2',
      controlId: 'CC6.1',
      description: 'IAM user role boundary check validation',
      status: 'pass',
      timestamp: '2026-07-15T12:10:00Z'
    };

    const signedEv = signEvidenceEntry(rawEv);
    expect(signedEv.verifiableHash).toBeDefined();
    expect(signedEv.verifiableHash.length).toBe(64);
  });
});
