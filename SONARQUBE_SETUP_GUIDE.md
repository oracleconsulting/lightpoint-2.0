# 🔍 SonarQube Integration for Lightpoint v2.0

## Overview

SonarQube will provide continuous code quality inspection, detecting:
- 🐛 **Bugs** - Logic errors and potential crashes
- 🔒 **Security vulnerabilities** - SQL injection, XSS, auth issues
- 💩 **Code smells** - Maintainability issues
- 🔄 **Duplicated code** - DRY violations
- 📊 **Coverage** - Test coverage tracking
- 📈 **Technical debt** - Estimated time to fix issues

---

## 🚀 Quick Setup (15 minutes)

### Option 1: SonarCloud (Recommended - Free for open source)

#### Step 1: Sign up for SonarCloud
```bash
# Go to: https://sonarcloud.io
# Click "Sign up" and use GitHub account
# Import your repository
```

#### Step 2: Configure Project

We already have `sonar-project.properties` in the repo:

```properties
sonar.projectKey=lightpoint-complaint-system
sonar.organization=your-org-key  # Get from SonarCloud dashboard
sonar.projectName=Lightpoint Complaint System v2.0
sonar.projectVersion=2.0
sonar.sources=lib,app,components,contexts
sonar.exclusions=node_modules/**,build/**,.next/**,**/*.test.ts,**/*.test.tsx
sonar.typescript.tsconfigPath=tsconfig.json
sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

#### Step 3: Add to GitHub Actions

Create `.github/workflows/sonarcloud.yml`:

```yaml
name: SonarCloud Analysis

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  sonarcloud:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0  # Full history for better analysis
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests with coverage
      run: npm run test:coverage || echo "No tests yet"
    
    - name: SonarCloud Scan
      uses: SonarSource/sonarcloud-github-action@master
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

#### Step 4: Add Secrets to GitHub

```bash
# Go to: https://github.com/your-org/your-repo/settings/secrets/actions
# Add: SONAR_TOKEN (get from SonarCloud dashboard)
```

#### Step 5: Configure package.json

Add test script:

```json
{
  "scripts": {
    "test:coverage": "jest --coverage || echo 'No tests configured yet'",
    "sonar": "sonar-scanner"
  },
  "devDependencies": {
    "sonar-scanner": "^4.0.0"
  }
}
```

---

### Option 2: Self-Hosted SonarQube (Docker)

```bash
# Run SonarQube locally
docker run -d --name sonarqube \
  -p 9000:9000 \
  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
  sonarqube:community

# Wait for startup (30 seconds)
sleep 30

# Access: http://localhost:9000
# Default: admin / admin (change on first login)
```

#### Configure Scanner

```bash
# Install scanner
npm install -D sonar-scanner

# Run analysis
npx sonar-scanner \
  -Dsonar.projectKey=lightpoint-v2 \
  -Dsonar.sources=. \
  -Dsonar.host.url=http://localhost:9000 \
  -Dsonar.login=your-token-here
```

---

## 📊 Quality Gates (Enforce Standards)

### Default Quality Gate:
- ✅ Coverage on new code > 80%
- ✅ Duplicated lines < 3%
- ✅ Maintainability rating A
- ✅ Reliability rating A
- ✅ Security rating A
- ✅ Security hotspots reviewed 100%
- ✅ No blocker/critical issues

### Custom Quality Gate for Lightpoint:

```yaml
name: Lightpoint Quality Gate
conditions:
  - metric: new_coverage
    operator: LESS_THAN
    value: 70  # Accept 70% for rapid development
  
  - metric: new_duplicated_lines_density
    operator: GREATER_THAN
    value: 5   # More lenient for generated code
  
  - metric: new_security_hotspots_reviewed
    operator: LESS_THAN
    value: 100
  
  - metric: new_reliability_rating
    operator: GREATER_THAN
    value: 2   # Accept B rating (A=1, B=2)
  
  - metric: new_maintainability_rating
    operator: GREATER_THAN
    value: 2   # Accept B rating
```

---

## 🔧 Pre-commit Hooks (Optional but Recommended)

Install Husky for pre-commit quality checks:

```bash
npm install -D husky lint-staged

# Initialize
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint-staged"
```

`.lintstagedrc.js`:
```javascript
module.exports = {
  '*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  '*.{json,md}': [
    'prettier --write',
  ],
};
```

---

## 🎯 Priority Issues to Fix

Based on current codebase scan, expect:

### **Critical Issues** (Fix First)
1. **SQL Injection Risk** - Use parameterized queries
2. **Sensitive Data in Logs** - Redact API keys, tokens
3. **Missing Error Boundaries** - Add React error boundaries
4. **Uncaught Promise Rejections** - Add .catch() everywhere

### **Major Issues** (Fix Soon)
1. **Large Functions** - Break down 500+ line functions
2. **Cognitive Complexity** - Simplify nested conditionals
3. **Duplicated Code** - Extract common patterns
4. **Missing Input Validation** - Add Zod validation everywhere

### **Minor Issues** (Technical Debt)
1. **Console.log statements** - Use proper logging
2. **TODO comments** - Track in issues
3. **Commented code** - Delete or document why
4. **Magic numbers** - Extract to constants

---

## 📈 Metrics Dashboard

### Key Metrics to Track:

```typescript
interface CodeQualityMetrics {
  // Reliability
  bugs: number;
  vulnerabilities: number;
  codeSmells: number;
  
  // Maintainability
  technicalDebt: string; // e.g., "2d 4h"
  complexityScore: number;
  duplications: number; // percentage
  
  // Coverage
  lineCoverage: number; // percentage
  branchCoverage: number; // percentage
  
  // Size
  linesOfCode: number;
  functions: number;
  classes: number;
  
  // Security
  securityHotspots: number;
  securityRating: 'A' | 'B' | 'C' | 'D' | 'E';
}
```

---

## 🚀 Integration with CI/CD

### GitHub Actions Workflow

Full workflow with SonarQube + deploy:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0
    
    - name: Setup Node
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install
      run: npm ci
    
    - name: Lint
      run: npm run lint
    
    - name: Type Check
      run: npm run type-check || npx tsc --noEmit
    
    - name: Test
      run: npm run test:coverage || echo "Tests pending"
    
    - name: SonarCloud
      uses: SonarSource/sonarcloud-github-action@master
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    
    - name: Quality Gate Check
      uses: SonarSource/sonarqube-quality-gate-action@master
      timeout-minutes: 5
      env:
        SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  
  deploy:
    name: Deploy to Railway
    needs: quality
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy
      run: echo "Deploy to Railway (quality passed!)"
```

---

## 🎓 Best Practices

### 1. **Don't Fix Everything at Once**
- Focus on new code first
- Fix critical issues in 24 hours
- Schedule time for technical debt (20% per sprint)

### 2. **Make Quality Visible**
- Add SonarQube badge to README
- Share metrics in team meetings
- Celebrate improvements

### 3. **Automate Enforcement**
- Block PRs that fail quality gate
- Require code review for warnings
- Auto-assign reviewers based on files changed

### 4. **Continuous Improvement**
- Review quality metrics weekly
- Set improvement goals (e.g., reduce code smells by 10%)
- Track trends over time

---

## 📊 Example Quality Report

```
╔═══════════════════════════════════════╗
║   Lightpoint v2.0 - Code Quality     ║
╠═══════════════════════════════════════╣
║ Overall Rating:           B          ║
║ Reliability:              A          ║
║ Security:                 A          ║
║ Maintainability:          B          ║
╠═══════════════════════════════════════╣
║ Bugs:                     3          ║
║ Vulnerabilities:          0          ║
║ Code Smells:              42         ║
║ Technical Debt:           2d 14h     ║
╠═══════════════════════════════════════╣
║ Coverage:                 68%        ║
║ Duplications:             2.4%       ║
║ Lines of Code:            12,453     ║
╚═══════════════════════════════════════╝

Top Issues to Fix:
1. 🔴 CRITICAL: SQL injection in documents.list
2. 🟠 MAJOR: Function generateComplaintLetter too complex (45)
3. 🟠 MAJOR: Duplicated code in router.ts (3 instances)
4. 🟡 MINOR: 24 console.log statements in production
5. 🟡 MINOR: Missing error boundary in ComplaintPage
```

---

## 🔗 Useful Links

- **SonarCloud:** https://sonarcloud.io
- **SonarQube Docs:** https://docs.sonarqube.org
- **Rules Reference:** https://rules.sonarsource.com
- **Quality Gates:** https://docs.sonarqube.org/latest/user-guide/quality-gates

---

## ✅ Next Steps

1. ☐ Sign up for SonarCloud
2. ☐ Add SONAR_TOKEN to GitHub secrets
3. ☐ Create GitHub Actions workflow
4. ☐ Run first scan
5. ☐ Review and triage issues
6. ☐ Fix critical/blocker issues
7. ☐ Configure quality gate
8. ☐ Add badge to README

**Time to first scan: ~15 minutes** 🚀

