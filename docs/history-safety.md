# Preserve the original workout histories

User requirement: Powerlevel development must not corrupt or rewrite the history in the other workout apps.

The original Auto Bulgarian and Accessory Lifts installations own their workout histories. Powerlevel consumes normalized copies. Dashboard ranks, public-data comparisons, profile settings, demo records and estimated strength must never be written back into tracker history or program state.

- The dashboard downloads encrypted summaries with GET. It does not upload history. Its writes are limited to its own cached copies, preferences and pairing key.
- Each tracker's sync widget reads the original tracker storage, creates a summary, and uploads an encrypted copy. It never writes or deletes the original workout storage. Pairing and disconnecting may only change the pairing key.
- Failed reads, invalid records, failed encryption and offline sync must preserve the original bytes. Do not repair, reset, migrate or clear source storage in response to a dashboard or sync error.
- Keep simulations and verification on fabricated histories and mocked network/storage. Do not reset, import into, or overwrite the user's installed apps to test a dashboard change.
- If future work genuinely requires altering a source app's stored data, first prepare a recoverable backup and a narrowly scoped migration with tests. Obtain explicit user approval before applying that data change.

`tests/history-safety.test.mjs` verifies these boundaries against both source formats. It freezes originals and derived histories, exercises rank/profile/preview calculations, checks that dashboard fetches only read, and runs the actual bundled sync widget against guarded storage under successful, offline and invalid-data conditions. Pairing, retries and disconnecting must leave both original histories and unrelated storage untouched. This suite runs in the normal test workflow.

The public-reference release (`5394d19`) did not change either source format, the shared sync transport/widget, or the dashboard history-loading hook. This audit adds tests and documentation without changing production data handling.

Scope of assurance: these checks verify the code's history boundary using synthetic fixtures. They do not inspect or certify the current contents of a particular iPhone installation. The relay's existing latest-upload-wins behavior still assumes one writer per source; it is a dashboard copy, not a replacement for the original tracker history.
