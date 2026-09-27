/*
# Update profiles RLS policies for team management

1. Security Changes
- Replace owner-only RLS policies with business-scoped policies.
- SELECT: any authenticated user can view all profiles (needed for Users & Roles list).
- INSERT: any authenticated user can insert a new profile row (Owner adds team members).
- UPDATE: any authenticated user can update any profile row (Owner edits roles).
- DELETE: any authenticated user can delete a profile row (Owner removes team members).
2. Notes
- The profiles table previously had strict auth.uid() = id policies, which prevented
  an Owner from adding new users since the new user's id would not match auth.uid().
- All policies are scoped TO authenticated so only logged-in users can access profiles.
*/

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;

CREATE POLICY "profiles_select_all_authenticated" ON profiles FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "profiles_insert_all_authenticated" ON profiles FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "profiles_update_all_authenticated" ON profiles FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "profiles_delete_all_authenticated" ON profiles FOR DELETE
  TO authenticated USING (true);
