# Contributing to CloudGuard AI

We welcome contributions to CloudGuard AI! To maintain our enterprise-grade quality standards, please adhere to the following workflow guidelines.

---

## 🛠 Branching and Development Flow

1. **Fork and Clone**: Fork the repository and check out your branch from `main`.
2. **Branch Naming Scheme**:
   - Features: `feature/your-feature-name`
   - Bugfixes: `bugfix/your-bugfix-name`
   - Hotfixes: `hotfix/your-hotfix-name`
3. **TypeScript Conformity**: All workspace runtimes must compile cleanly with **zero TypeScript errors and warnings** before submission. Run `pnpm build` to verify compile paths.

---

## 💬 Commit Message Guidelines

We enforce semantic, structured commit messages to automate release versioning (v1.0.0+):

Format: `<type>(<scope>): <description>`

### Approved Types
- **`feat`**: A new user-facing product feature.
- **`fix`**: A bug fix.
- **`docs`**: Changes to documentation.
- **`style`**: Layout changes that do not affect code logic (whitespace, formatting, inline styles).
- **`refactor`**: Code changes that neither fix bugs nor add features.
- **`perf`**: Code modifications that optimize runtime performance or latency.
- **`test`**: Adding missing tests or correcting existing tests.
- **`chore`**: Maintenance, versioning, or pnpm lockfile updates.

### Examples
- `feat(devsecops): add automated helm rollback execution endpoints`
- `fix(identity): resolve inline hover types check next.js build failure`
- `docs(readme): update microservice port registries`

---

## 🔬 Quality Gates & Pull Requests

Every Pull Request must undergo security scanning and static analysis:
- All static checks must pass.
- No secrets or credentials may be leaked in git history.
- Unit and integration tests must maintain critical path coverage thresholds above **90%**.
