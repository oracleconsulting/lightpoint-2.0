# Case Workspace User Guide

1. Run `migrations/025_case_workspace.sql` against the Lightpoint Supabase project.
2. Open `/cases` and create a new workspace.
3. Add key deadlines and procedural events manually if documents have not yet been uploaded.
4. Upload documents in the Documents panel. Phase 3 intake extracts text for text-layer PDFs, DOCX, TXT and CSV.
5. Review proposed timeline events and parties, then confirm extracted items.
6. Use the chat panel to reason about procedural status, strategy and weaknesses.
7. Confirm any structured output proposals you want written to the workspace.
8. Use the Research panel to verify citations.
9. Generate outputs only after relevant research is verified.

Notes:

- The chat is designed for James's direct working style and should push back on weak strategies.
- Case citations must be verified before they are used in generated outputs.
- Generated Word documents are stored in the private `case-documents` bucket.
