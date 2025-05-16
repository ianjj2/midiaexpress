-- Criar função para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
    AND raw_user_meta_data->>'role' = 'admin'
  );
END;
$$;

-- Dropar a tabela users se ela existir
DROP TABLE IF EXISTS public.users;

-- Criar a tabela users
CREATE TABLE public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id),
    email text NOT NULL UNIQUE,
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
DROP POLICY IF EXISTS "Usuários podem ver seus próprios dados" ON public.users;

-- Criar novas políticas
CREATE POLICY "Admins podem ver todos os usuários"
ON public.users
FOR SELECT
TO authenticated
USING (is_admin());

CREATE POLICY "Usuários podem ver seus próprios dados"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins podem criar usuários"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admins podem atualizar usuários"
ON public.users
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admins podem deletar usuários"
ON public.users
FOR DELETE
TO authenticated
USING (is_admin());

-- Garantir que o usuário admin existe e tem o papel correto
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Verificar se o usuário admin já existe
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@rangel.com';
  
  IF admin_id IS NULL THEN
    -- Criar novo usuário admin
    INSERT INTO auth.users (
      id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      gen_random_uuid(),
      'admin@rangel.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"role":"admin"}'
    )
    RETURNING id INTO admin_id;
  ELSE
    -- Atualizar usuário admin existente
    UPDATE auth.users
    SET raw_user_meta_data = '{"role":"admin"}'::jsonb
    WHERE id = admin_id;
  END IF;

  -- Inserir ou atualizar na tabela users
  INSERT INTO public.users (id, email, password, role)
  VALUES (admin_id, 'admin@rangel.com', 'admin123', 'admin')
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin';
END $$; 