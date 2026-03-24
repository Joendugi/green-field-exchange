-- Make joeeroctib@gmail.com an admin
-- Run this single query in Supabase SQL editor

INSERT INTO user_roles (user_id, role, created_at, updated_at)
SELECT id, 'admin', NOW(), NOW()
FROM auth.users 
WHERE email = 'joeeroctib@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify admin role was added
SELECT ur.user_id, ur.role, u.email 
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
WHERE ur.role = 'admin' AND u.email = 'joeeroctib@gmail.com';
