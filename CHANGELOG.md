# Changelog - CloudGuard AI

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-07-15

### Added
- **Observability Microservice**: Created new `observability-runtime` serving trace lists, span call hierarchies, metrics Aggregates, SLO compliance graphs, and capacity projection calculations.
- **GitOps Delivery Microservice**: Created `devsecops-runtime` implementing PR static review engines, pipeline visualizers, artifact registries, and rollback orchestration controls (Git revert, Helm rollback).
- **Zero Trust Identity Microservice**: Completed `identity-runtime` providing adaptive auth validation rules, OIDC tokens checking, custom domain setting portals, and SCIM node directory hierarchies.
- **Experience Layer Layouts**: Remapped incident trackers, security scanners, executive scoring systems, and knowledge graphs into an integrated console panel.

### Changed
- Patched client-side Zustand stores to intercept outbound REST connections, injecting context metadata headers (`X-Tenant-Id`, `X-Device-Risk`) to lock resources.

---

## [0.8.0] - 2026-07-01

### Added
- Initial microservices core layout comprising `agent-runtime`, `scanner-runtime`, and `memory-runtime`.
- Draft RAG structures syncing threat memory documents into vector spaces.
