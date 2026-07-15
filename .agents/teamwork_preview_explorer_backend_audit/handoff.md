# Handoff Report

## 1. Observation
We conducted a comprehensive production readiness and security audit on the ArabBot Studio FastAPI backend codebase under the `backend/` directory. The following direct observations were made:
*   **Missing dependency**: In `src/routers/auth.py`, `import bcrypt` is called (line 4) and used (lines 44, 71). However, neither `backend/requirements.txt` nor `backend/pyproject.toml` lists `bcrypt` as a dependency.
*   **State transition bug in handoffs**: In `src/services/handoff_service.py` (lines 61-74), `resolve_handoff` updates `HandoffQueue.resolved_at` but does not update `Conversation.status`. In `src/webhooks/whatsapp.py` (lines 87-90), we have:
    ```python
    if conversation.status == "handed_off":
        await db.commit()
        logger.info("Skipping AI: conversation %s is handed off", conversation.id)
        return
    ```
*   **Workspace switcher bypass**: In `src/deps.py` (lines 43-56), `get_current_workspace` resolves workspace via:
    ```python
    result = await db.execute(
        select(WorkspaceMember)
        .where(WorkspaceMember.user_id == user.id)
        .options(selectinload(WorkspaceMember.workspace))
        .limit(1)
    )
    membership = result.scalar_one_or_none()
    ```
    This completely ignores `request.state.workspace_id` set by the `workspace_middleware` (extracted from the JWT token).
*   **RAG negative index bug**: In `src/services/vector_store.py` (line 101), the search function returns:
    ```python
    return [data["texts"][i] for i in indices[0] if i < len(data["texts"])]
    ```
    When the FAISS index contains fewer documents than `k`, `index.search` returns `-1` indices, which Python resolves to the last elements of the list.
*   **Inactive bots processing events**: In `src/webhooks/whatsapp.py` (line 161), `receive_webhook` retrieves the bot using:
    ```python
    result = await db.execute(select(Bot).where(Bot.id == bot_id, Bot.deleted_at.is_(None)))
    ```
    This does not filter on `Bot.is_active`.
*   **HTTPX Client overhead**: In `src/services/wa_sender_service.py` (lines 32-33), a new `httpx.AsyncClient` context is opened on every message:
    ```python
    async with httpx.AsyncClient() as client:
    ```
*   **Redis pipeline await error**: In `src/services/rate_limiter.py` (lines 29-32), commands are called with `await` on the pipeline object:
    ```python
    await pipe.zremrangebyscore(key, 0, window_start)
    await pipe.zadd(key, {f"{now}:{uuid.uuid4()}": now})
    await pipe.expire(key, window_seconds)
    await pipe.zcard(key)
    ```

---

## 2. Logic Chain
1. **AUD-01 (Missing Dependency)**: Because `bcrypt` is imported and used in `auth.py` (Observation 1), but is omitted from `requirements.txt` and `pyproject.toml` (Observation 1), any fresh setup or Docker build will fail with `ModuleNotFoundError` during container runtime execution when attempting authentication operations.
2. **AUD-02 (Handoff Loop)**: Once a conversation is handed off, `conversation.status` becomes `"handed_off"`. Because resolving a handoff updates the queue record but does not reset the conversation status (Observation 2), the webhook will continue to encounter `conversation.status == "handed_off"` and return early (Observation 2), causing the user to be permanently ignored by the bot.
3. **AUD-03 (Workspace Switcher)**: Because `get_current_workspace` queries the database and grabs the first workspace member row limit 1 (Observation 3), it ignores the token payload's requested `workspace_id`. Therefore, users can never access any workspace other than their first workspace.
4. **AUD-04 (RAG Indexing)**: Since FAISS index returns `-1` for empty match indices (Observation 4), and Python negative list indexing maps `-1` to the last item in `data["texts"]` (Observation 4), the vector store returns redundant duplicated items when the index size is smaller than `k`.
5. **AUD-05 (Inactive Bots)**: Since webhook queries do not filter on `Bot.is_active` (Observation 5), inactive bots will still trigger AI logic and respond on WhatsApp.

---

## 3. Caveats
No caveats. All findings were verified directly from backend source files.

---

## 4. Conclusion
The backend contains 5 critical/high deployment blockers: missing dependencies (`bcrypt`), stuck handoff loops, workspace switcher routing bugs, RAG vector indexing issues, and lack of inactive bot checks. These must be repaired before production deployment.

---

## 5. Verification Method
*   Run the test suite using: `.\.venv\Scripts\pytest tests/ -v`
*   Inspect `backend_audit_results.md` for specific remediation examples.
*   Invalidation condition: If the frontend uses workspace-less APIs or if the project has custom dependency management outside of standard configuration.
