# Contributing to Asterisk AMI Dashboard

## Branch Strategy (GitFlow)

This project uses GitFlow for branch management.

### Branch Types

| Branch | Purpose | Base | Merges Into |
|--------|---------|------|-------------|
| `main` | Production-ready code | - | - |
| `develop` | Integration branch | main | main (via release) |
| `feature/*` | New features | develop | develop |
| `release/*` | Release preparation | develop | main + develop |
| `hotfix/*` | Urgent production fixes | main | main + develop |

### Workflow

#### Feature Development

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes, commit
git add .
git commit -m "Add your feature"

# Push and create PR
git push -u origin feature/your-feature-name
# Create PR: develop <- feature/your-feature-name
```

#### Release Process

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create release branch
git checkout -b release/v1.0.0

# Bump version, update changelog, final testing
git commit -m "Prepare release v1.0.0"

# Push and create PRs
git push -u origin release/v1.0.0
# Create PR: main <- release/v1.0.0
# After merge to main, create PR: develop <- release/v1.0.0

# Tag the release on main
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

#### Hotfix Process

```bash
# Start from main
git checkout main
git pull origin main

# Create hotfix branch
git checkout -b hotfix/fix-critical-bug

# Fix the issue
git commit -m "Fix critical bug"

# Push and create PRs
git push -u origin hotfix/fix-critical-bug
# Create PR: main <- hotfix/fix-critical-bug
# After merge to main, create PR: develop <- hotfix/fix-critical-bug

# Tag the hotfix on main
git checkout main
git pull origin main
git tag -a v1.0.1 -m "Hotfix v1.0.1"
git push origin v1.0.1
```

### Commit Messages

Use clear, descriptive commit messages:

- `Add feature X` - New functionality
- `Fix bug in Y` - Bug fixes
- `Update Z` - Enhancements to existing features
- `Refactor W` - Code improvements without changing behavior
- `Docs: V` - Documentation changes

### Pull Requests

1. Create PRs for all changes (no direct pushes to main or develop)
2. Include a clear description of changes
3. Reference any related issues
4. Ensure all tests pass before merging
