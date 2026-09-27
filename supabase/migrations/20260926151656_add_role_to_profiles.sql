/*
# Add role column to profiles for Users & Roles management

1. Modified Tables
- `profiles`
  - Add `role` (text, not null, default 'Owner') — possible values: 'Owner', 'Manager', 'Staff'
2. Security
- No changes to existing RLS policies. All profiles remain owner-scoped (each user sees only their own profile row).
3. Notes
- The role column lets the Settings page display and manage user roles.
- Only users with role 'Owner' can manage other users.
- Existing profiles get 'Owner' by default since they created the business.
*/

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'Owner';
