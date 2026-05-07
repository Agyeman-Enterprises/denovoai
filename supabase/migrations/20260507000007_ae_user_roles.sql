-- AE RBAC: user_roles table
-- Install via: npx supabase db push
-- Supports org-scoped roles (org_id set) and global roles (org_id null).

CREATE TYPE IF NOT EXISTS app_role AS ENUM ('owner', 'admin', 'member', 'viewer');

CREATE TABLE IF NOT EXISTS user_roles (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id     uuid,                           -- null = global/app-level role
  role       app_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, org_id, role)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Users can read their own roles
CREATE POLICY "users_read_own_roles" ON user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Owners and admins can read all roles within their org
CREATE POLICY "admins_read_org_roles" ON user_roles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.org_id IS NOT DISTINCT FROM user_roles.org_id
        AND ur.role IN ('owner', 'admin')
    )
  );

-- Owners and admins can manage roles within their org
CREATE POLICY "admins_manage_org_roles" ON user_roles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.org_id IS NOT DISTINCT FROM user_roles.org_id
        AND ur.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.org_id IS NOT DISTINCT FROM user_roles.org_id
        AND ur.role IN ('owner', 'admin')
    )
  );
