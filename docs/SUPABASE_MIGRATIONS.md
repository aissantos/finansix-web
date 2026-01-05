# Supabase migrations notes

This PR documents recent fixes to the `20250105_rls_and_installments.sql` migration and the local Supabase configuration.

## Changes made
- Added `project_id = "finansix-local"` to `supabase/config.toml` so the local CLI accepts the project config.
- Made `20250105_rls_and_installments.sql` idempotent and safer for re-runs:
  - `DROP FUNCTION IF EXISTS get_user_household_ids() CASCADE;` before creating the function (handles return-type changes and dependent objects).
  - `DROP POLICY IF EXISTS "<name>" ON <table>;` before each `CREATE POLICY` to avoid 'policy already exists' errors.
  - `DROP VIEW IF EXISTS credit_card_limits CASCADE;` before `CREATE VIEW` to avoid column rename conflicts.

## Rationale
These edits fix errors encountered when running the local Supabase CLI/migrations (function signature changes, dependent objects, existing policies, and view column rename conflicts). They make the migration safe to re-run locally.

## Notes & Caution
- Using `CASCADE` will drop dependent objects (policies, etc.) before recreating them; this is acceptable for local development but should be reviewed carefully before applying in production.
- After applying locally: run `npm exec -- supabase start --debug` and verify `supabase_migrations.schema_migrations` contains version `20250105`.

## Tests
- The test suite was run locally (unit tests passed). I validated the function, view, trigger and policies exist after applying the migration.

