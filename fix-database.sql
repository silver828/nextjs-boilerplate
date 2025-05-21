-- 1. Vérifier les tables existantes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 2. Vérifier la structure de la table profiles
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles';

-- 3. Vérifier les politiques RLS existantes
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- 4. Supprimer et recréer les politiques RLS pour profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

-- S'assurer que RLS est activé
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Recréer les politiques avec des permissions plus larges
CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 5. Vérifier les utilisateurs existants
SELECT id, email, username, created_at 
FROM profiles;

-- 6. Vérifier les utilisateurs authentifiés dans auth.users
SELECT id, email, confirmed_at, last_sign_in_at
FROM auth.users;

-- 7. Synchroniser les utilisateurs manquants
-- Cette requête insère des profils pour les utilisateurs authentifiés qui n'ont pas de profil
INSERT INTO profiles (id, email, username, created_at, updated_at)
SELECT 
  au.id, 
  au.email, 
  SPLIT_PART(au.email, '@', 1), -- Utilise la partie avant @ comme nom d'utilisateur
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 8. Vérifier les conversations et participants
SELECT * FROM conversations;
SELECT * FROM conversation_participants;

-- 9. Vérifier les politiques RLS pour les autres tables
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
