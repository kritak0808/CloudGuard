import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FindingCard } from '../components/FindingCard';
import type { SecurityFinding } from '@cloudguard/types';

describe('FindingCard Component', () => {
  const mockFinding: SecurityFinding = {
    id: 'f-1',
    title: 'S3 Public Read Access Enabled',
    severity: 'critical',
    status: 'open',
    category: 'compliance',
    scanner: 'Trivy',
    resource: 'arn:aws:s3:::customer-vault',
    location: 'us-west-2',
    cvss: 9.8,
    cve: 'CVE-2024-XXXX',
    discoveredAt: new Date().toISOString(),
    aiEnrichment: {
      mitreTactic: 'Exfiltration',
      mitreTechnique: 'T1567',
      remediationDiff: '...',
      confidenceScore: 98,
      securityCouncilConsensus: 'Approved',
      executiveRiskSummary: 'Exposing S3 bucket customer-vault allows public reading of confidential business records.',
    },
  };

  it('renders title, severity label, and resource ARN', () => {
    const onSelect = vi.fn();
    render(<FindingCard finding={mockFinding} isSelected={false} onSelect={onSelect} />);

    expect(screen.getByText('S3 Public Read Access Enabled')).toBeDefined();
    expect(screen.getByText('CRITICAL')).toBeDefined();
    expect(screen.getByText('CVE-2024-XXXX')).toBeDefined();
  });

  it('triggers onSelect when clicked', () => {
    const onSelect = vi.fn();
    render(<FindingCard finding={mockFinding} isSelected={false} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('S3 Public Read Access Enabled'));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
