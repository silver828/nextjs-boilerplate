-- Vérifier que la table profiles existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'profiles'
);

-- Vérifier les politiques RLS existantes
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Supprimer les politiques existantes pour les recréer
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

-- Vérifier que les politiques ont été créées
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Vérifier le nombre d'utilisateurs dans la table profiles
SELECT COUNT(*) FROM profiles;
