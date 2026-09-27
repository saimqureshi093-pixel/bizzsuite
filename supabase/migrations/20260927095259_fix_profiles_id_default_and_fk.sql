/*
# Fix profiles table for team management

1. Schema Changes
- Drop the foreign key constraint on profiles.id → auth.users(id)
  so team member profiles can be created without an auth account yet.
- Set profiles.id DEFAULT gen_random_uuid() so inserts that omit id
  auto-generate a UUID instead of failing the NOT NULL constraint.
- Make business_name nullable (team members may not have a business name set).

2. Security
- RLS policies from the previous migration remain in effect:
  any authenticated user can SELECT, INSERT, UPDATE, DELETE profiles.
- These were already applied in migration 20260926154504.

3. Notes
- The FK to auth.users was preventing the Owner from adding team members
  because the new user has no auth.users row yet, and the NOT NULL id
  column had no default.
- With gen_random_uuid(), the frontend can omit id on insert and the
  database generates one automatically.
*/

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE profiles ALTER COLUMN business_name DROP NOT NULL;
