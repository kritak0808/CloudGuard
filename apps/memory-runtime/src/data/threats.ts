import type { IngestedThreatIntel } from '@cloudguard/types';

export const threatIntelligenceFeed: IngestedThreatIntel[] = [
  {
    id: 'CVE-2021-44228',
    source: 'CISA-KEV',
    severity: 'critical',
    title: 'Log4Shell Apache Log4j JNDI Remote Code Execution',
    description: 'Apache Log4j2 versions 2.0-beta9 through 2.15.0 (excluding security releases) JNDI features used in configuration, log messages, and parameters do not protect against attacker controlled LDAP and other JNDI related endpoints. An attacker who can control log messages or log message parameters can execute arbitrary code loaded from LDAP servers when message lookup substitution is enabled.',
    cwe: 'CWE-917',
    epss: 0.9998,
    mitreTtp: 'T1203 — Exploitation for Client Execution',
    detectionRule: `rule Log4Shell_Detection {
  meta:
    description = "Detects Log4Shell JNDI injection patterns in HTTP logs"
    author = "CloudGuard Threat Research"
  strings:
    $jndi_pattern = /\\\$\\\{jndi:(ldap|ldaps|rmi|dns|nis|iiop|corba|nds|http):[^\\}]+\\\}/ i
  condition:
    $jndi_pattern
}`
  },
  {
    id: 'CVE-2024-3094',
    source: 'CISA-KEV',
    severity: 'critical',
    title: 'XZ Utils Backdoor (Supply Chain Compromise)',
    description: 'A malicious backdoor was introduced into xz-utils (specifically the liblzma library) versions 5.6.0 and 5.6.1. Under certain conditions, this backdoor can intercept and modify data interactions with the OpenSSH daemon (sshd), allowing unauthenticated remote code execution on affected systemd-based Linux systems.',
    cwe: 'CWE-506',
    epss: 0.9412,
    mitreTtp: 'T1195.001 — Supply Chain Compromise: dependencies',
    detectionRule: `rule liblzma_backdoor_signature {
  meta:
    description = "Detects signatures of the compromised liblzma.so backdoor"
    author = "CloudGuard Threat Research"
  strings:
    $hex_sig = { F3 0F 1E FA 55 48 89 F5 4C 89 CE }
  condition:
    $hex_sig
}`
  },
  {
    id: 'CVE-2024-21626',
    source: 'NVD',
    severity: 'critical',
    title: 'runc Container Escape via File Descriptor Leak',
    description: 'In runc 1.1.11 and earlier, a file descriptor leak vulnerability exists during the execution of container processes. By exploiting this, a process inside the container can access the host filesystem namespace and execute arbitrary binaries on the host system, leading to complete container escape.',
    cwe: 'CWE-403',
    epss: 0.8734,
    mitreTtp: 'T1611 — Escape to Host',
    detectionRule: `rule runc_escape_fd_leak {
  meta:
    description = "Detects attempts to access directory fd paths indicating container escape"
    author = "CloudGuard Threat Research"
  strings:
    $proc_path = "/proc/self/fd/"
    $cwd_exploit = "process.cwd"
  condition:
    all of them
}`
  },
  {
    id: 'CVE-2023-44487',
    source: 'MITRE-ATT&CK',
    severity: 'high',
    title: 'HTTP/2 Rapid Reset Denial of Service',
    description: 'The HTTP/2 protocol allows a denial of service attack (Rapid Reset) through stream cancellation. The protocol vulnerability allows a client to open a high number of streams and cancel them rapidly with RST_STREAM frames, consuming server CPU resources without incurring network bandwidth load.',
    cwe: 'CWE-400',
    epss: 0.9854,
    mitreTtp: 'T1499.004 — Endpoint Denial of Service: Application Exhaustion',
    detectionRule: `title: HTTP/2 Rapid Reset Pattern
id: sig-http2-rapid-reset
status: stable
description: Detects massive bursts of HTTP/2 RST_STREAM frames from a single IP address
logsource:
    product: cloudflare
    service: waf
detection:
    selection:
        http2_stream_action: "RST_STREAM"
    timeframe: 1s
    condition: selection | count() > 10000`
  },
  {
    id: 'CVE-2023-38606',
    source: 'NVD',
    severity: 'high',
    title: 'Apple macOS Kernel Privilege Escalation via State Transition',
    description: 'An issue in handling state transitions in the kernel memory manager allows a local app to bypass hardware security registers and execute arbitrary code with kernel privileges. Exploited in Operation Triangulation.',
    cwe: 'CWE-362',
    epss: 0.7423,
    mitreTtp: 'T1068 — Exploitation for Privilege Escalation'
  },
  {
    id: 'CVE-2022-22965',
    source: 'GitHub-Advisory',
    severity: 'critical',
    title: 'Spring4Shell Remote Code Execution',
    description: 'A Spring MVC or Spring WebFlux application running on JDK 9+ may be vulnerable to remote code execution via classloader manipulation when request parameter binding is used.',
    cwe: 'CWE-94',
    epss: 0.9654,
    mitreTtp: 'T1190 — Exploit Public-Facing Application'
  }
];
