# Lightpoint v2.0 Development Environment

**Status:** 🚧 Development Branch  
**Purpose:** Major refactoring without affecting production v1.0  
**Created:** November 16, 2025

---

## What is v2.0?

This is a **parallel development environment** for implementing major improvements to Lightpoint without risking the production system (v1.0).

### Key Principles

1. **v1.0 stays untouched** - Production continues running on `main` branch
2. **v2.0 is experimental** - We can break things here without consequences
3. **Migration only when ready** - Thoroughly tested before switching
4. **Instant rollback** - Keep v1.0 running as backup during migration

---

## v2.0 Planned Improvements

### Week 1: Core Infrastructure
- ✅ Proper tRPC authentication (not just RLS)
- ✅ Split monolithic router into modules (~200 lines each)
- ✅ Custom error classes and comprehensive error handling
- ✅ Testing infrastructure (Vitest + critical path tests)

### Week 2: Observability & Performance
- ✅ Structured logging with Winston
- ✅ Rate limiting on AI endpoints
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ Error monitoring with Sentry
- ✅ Performance monitoring and bundle analysis

### Week 3: Testing & Optimization
- ✅ Comprehensive test suite (unit + integration)
- ✅ Code splitting for heavy components
- ✅ Caching layer for vector search
- ✅ Load testing (v1 vs v2 comparison)
- ✅ Security audit and hardening

---

## Development Workflow

### Daily Development
```bash
# Work on v2.0
git checkout v2-development

# Make changes, test locally
npm run dev

# Commit improvements
git add .
git commit -m "feat(v2): description"
git push v2 v2-development:main
```

### Checking Production Status
```bash
# Switch to production branch
git checkout main

# Check what's running in production
git log --oneline -5

# Switch back to development
git checkout v2-development
```

### Syncing Production Fixes to v2
```bash
# If critical fix made to v1.0, bring it to v2.0
git checkout v2-development
git merge main
```

---

## Environment Setup

### Separate Infrastructure for v2.0

| Component | v1.0 (Production) | v2.0 (Development) |
|-----------|-------------------|-------------------|
| **GitHub Repo** | `oracleconsulting/lightpoint` | `oracleconsulting/lightpoint-v2` |
| **Branch** | `main` | `main` (from v2-development) |
| **Supabase Project** | `lightpoint-production` | `lightpoint-v2-dev` |
| **Railway Project** | `lightpoint-complaint-system` | `lightpoint-v2` |
| **URL** | `lightpoint.up.railway.app` | `lightpoint-v2.up.railway.app` |

### Why Separate Infrastructure?

1. **Database isolation** - Schema changes don't affect production
2. **Cost isolation** - AI testing costs don't hit production limits
3. **True parallel testing** - Run both systems simultaneously
4. **Safe experimentation** - Break things without user impact

---

## Testing Strategy

### Before Merging to v1.0
v2.0 must pass all these criteria:

- [ ] Zero critical errors in 72 hours of testing
- [ ] All existing features work identically or better
- [ ] Load testing shows equal or better performance
- [ ] At least 10 complete complaint flows tested successfully
- [ ] Authentication and security improvements verified
- [ ] No regression in letter quality
- [ ] Time tracking accuracy maintained
- [ ] Knowledge base search performance equal or better

### Migration Checklist
- [ ] Export production data from v1.0
- [ ] Import to v2.0 with data migration scripts
- [ ] Run v1.0 and v2.0 in parallel for 1 week
- [ ] Have select users test v2.0
- [ ] Monitor error rates on both systems
- [ ] Prepare rollback plan
- [ ] Schedule migration window
- [ ] Update DNS/custom domain to v2.0
- [ ] Keep v1.0 running as instant rollback for 1 week
- [ ] After stable week, decommission v1.0

---

## Current Status

**Phase:** B1 - Repository Setup  
**Next Steps:**
1. ✅ Create v2-development branch (DONE)
2. ⏳ Create GitHub repository for v2
3. ⏳ Duplicate Supabase project
4. ⏳ Deploy to Railway
5. ⏳ Verify v2.0 works identically

---

## Important Notes

⚠️ **DO NOT make breaking changes to v1.0 after Part A is complete**  
⚠️ **ALL major refactoring happens ONLY on v2.0**  
⚠️ **Test every feature on v2.0 before considering migration**  
⚠️ **Keep detailed notes of all changes for migration guide**

---

## Useful Commands

```bash
# Check which branch you're on
git branch

# Compare v2 to v1
git diff main..v2-development

# See what files changed
git diff main..v2-development --name-only

# Deploy v2.0 to Railway
railway up

# Check v2.0 Railway logs
railway logs

# Run v2.0 tests
npm run test

# Build v2.0
npm run build
```

---

## Contact & Support

**Development Branch:** v2-development  
**Primary Developer:** AI Assistant  
**Client Contact:** jhoward@rpgcc.co.uk  
**Production System:** https://github.com/oracleconsulting/lightpoint (main branch)

---

**Last Updated:** November 16, 2025

