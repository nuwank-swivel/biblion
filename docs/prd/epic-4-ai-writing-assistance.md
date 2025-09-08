# Epic 4 AI Writing Assistance

## Epic Goal

Deliver essential, privacy-conscious AI assistance for grammar, spell check, and one-click rewriting directly in the editor using client-side calls to providers (Gemini/OpenAI) via Firebase-configured API keys. Keep UX contextual and non-intrusive.

### Story 4.1: AI Provider Integration (Gemini/OpenAI)

As a user,
I want AI features powered by trusted providers,
so that I can improve my writing with minimal setup.

Acceptance Criteria:

1. Integrate Gemini and OpenAI SDKs with client-side usage via env-config.
2. Add provider selection in Settings with fallback logic.
3. Securely load API keys from Firebase Remote Config or environment.
4. Implement request timeouts and exponential backoff.
5. Mask/strip PII toggles before sending content (configurable).
6. Handle quota/rate-limit errors with user-friendly messages.
7. Log anonymized errors to Firebase Performance/Analytics.
8. Add a small usage meter (optional) in Settings.

### Story 4.2: Grammar and Spell Check

As a user,
I want inline grammar and spell check suggestions,
so that I can quickly fix issues without leaving the editor.

Acceptance Criteria:

1. Add “Check grammar” action in editor toolbar and Cmd/Ctrl+G shortcut.
2. Underline issues inline; show suggestion popover on click.
3. Accept, reject, and accept-all actions supported.
4. Batch-check current selection or full page.
5. Handle large content by chunking with stable cursor mapping.
6. Offline: queue request and notify when online is required.
7. Respect privacy toggle (skip sending content if disabled).
8. Provide minimal latency feedback (spinner, progress).
9. Persist last-run timestamp per page.
10. No destructive edits without explicit user action.

### Story 4.3: One-Click Rewrite and Improve

As a user,
I want one-click rewriting suggestions,
so that I can improve clarity, tone, and concision quickly.

Acceptance Criteria:

1. Provide “Improve” button and right-click “Rewrite with AI”.
2. Presets: Concise, Formal, Friendly, Neutral (minimal set).
3. Preview diff before apply; Accept/Reject actions.
4. Support selection-only or entire paragraph scope.
5. Preserve formatting (bold, lists) after rewrite.
6. Add retry with a different preset if first result is poor.
7. Respect token/size limits with chunking.
8. Show small tokens/time estimate in the UI hint.
9. Fail gracefully with clear messaging; never lose original text.
10. Track accepted vs rejected suggestion count (for success metrics).

### Story 4.4: Contextual Hints and Non-Intrusive UX

As a user,
I want AI help that’s available but not distracting,
so that my writing flow isn’t interrupted.

Acceptance Criteria:

1. Collapse AI toolbar group by default; expand on demand.
2. Show subtle inline chips for suggestions, never modal by default.
3. Keyboard-first flows for accept/reject (e.g., Enter/Esc).
4. Do not auto-run AI; user explicitly triggers checks.
5. Respect global “AI Assistance Off” toggle.
6. Provide quick undo for any AI-applied change.
7. Keep editor performance smooth (<16ms frame on interactions).
8. Accessibility: suggestions are screen-reader friendly.

### Story 4.5: Privacy & Data Controls

As a user,
I want clear privacy controls,
so that I can choose what content is shared with AI providers.

Acceptance Criteria:

1. Settings include: “Send full text”, “Mask emails/URLs”, “Don’t send content”.
2. Explain implications inline with short tooltips.
3. Default to masking sensitive patterns when enabled.
4. Never store AI responses longer than needed to render.
5. Log only anonymized metrics.
6. Provide “Delete temporary AI data now” action.
