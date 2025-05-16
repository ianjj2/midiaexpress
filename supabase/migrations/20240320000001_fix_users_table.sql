-- Dropar a tabela users se ela existir
DROP TABLE IF EXISTS public.users;

-- Criar a tabela users
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    email text NOT NULL,
    password text NOT NULL,
    role text DEFAULT 'visualizador',
    created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Dropar políticas existentes
DROP POLICY IF EXISTS "Admins podem ver todos os usuários" ON public.users;
DROP POLICY IF EXISTS "Admins podem criar usuários" ON public.users;
DROP POLICY IF EXISTS "Admins podem atualizar usuários" ON public.users;
DROP POLICY IF EXISTS "Admins podem deletar usuários" ON public.users;

-- Criar novas políticas
CREATE POLICY "Admins podem ver todos os usuários"
ON public.users
FOR SELECT
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
);

CREATE POLICY "Admins podem criar usuários"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'admin'
);

CREATE POLICY "Admins podem atualizar usuários"
ON public.users
FOR UPDATE
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
)
WITH CHECK (
  (auth.jwt() ->> 'role')::text = 'admin'
);

CREATE POLICY "Admins podem deletar usuários"
ON public.users
FOR DELETE
TO authenticated
USING (
  (auth.jwt() ->> 'role')::text = 'admin'
);

-- Garantir que o usuário admin existe e tem o papel correto
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data)
VALUES (
  gen_random_uuid(),
  'admin@rangel.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"admin"}'
)
ON CONFLICT (email) DO UPDATE
SET raw_user_meta_data = '{"role":"admin"}'::jsonb;

-- Inserir o usuário admin na tabela users
INSERT INTO public.users (id, email, password, role)
SELECT id, email, 'admin123', 'admin'
FROM auth.users
WHERE email = 'admin@rangel.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin'; 