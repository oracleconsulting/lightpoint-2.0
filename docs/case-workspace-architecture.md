# Case Workspace Architecture

The case workspace lives alongside the existing complaint and appeal flows. Routes are under `/cases/*`, data lives in the `cases` family of tables, and tRPC routers are registered under `case`, `caseEvent`, `caseParty`, `caseDecision`, `caseDocument`, `caseChat`, `caseOutput`, and `verification`.

Phase boundaries:

- Phase 1: workspace CRUD, manual timeline, parties, documents, decisions.
- Phase 2: workspace-aware chat with structured outputs and confirmation.
- Phase 3: document intake, classification, metadata proposals, anomalies, and triage.
- Phase 4: BAILII citation verification with cache and research bank status.
- Phase 5: verified output generation, docx storage, and devil's advocate review.
- Phase 6: eval and documentation scaffold.

The AI prompt must never treat proposed workspace changes as committed until the user confirms them. Anomalies detected during intake can be written directly with `acknowledged=false`.

All database access remains organisation-scoped through RLS plus tRPC `ensureCaseAccess`.
