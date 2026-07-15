# Audit Execution Plan

## Objective
Conduct a full-stack production readiness and security audit of the ArabBot Studio codebase (FastAPI backend and React frontend) and deliver `audit_report.md` at the project root.

## Steps & Verify Actions
1. **Explore (Milestone 2 & 3)**:
   - Dispatch `teamwork_preview_explorer` (Conv ID: explorer-audit) to analyze backend and frontend.
   - Outputs: `backend_findings.md` and `frontend_findings.md` containing specific issues with exact file paths and line numbers.
2. **Implement (Milestone 4)**:
   - Dispatch `teamwork_preview_worker` (Conv ID: worker-audit) to synthesize findings and write the final `audit_report.md` at the project root.
3. **Review & Challenge (Milestone 5)**:
   - Dispatch `teamwork_preview_reviewer` (Conv ID: reviewer-audit) to verify the report format, completeness, and accuracy.
   - Dispatch `teamwork_preview_challenger` (Conv ID: challenger-audit) to perform adversarial verification of the report's claims.
4. **Audit (Forensic Audit)**:
   - Dispatch `teamwork_preview_auditor` (Conv ID: auditor-audit) to verify integrity and correctness of the generated audit report.
5. **Finalize**:
   - Verify all pass criteria.
   - Send completion message to parent.
