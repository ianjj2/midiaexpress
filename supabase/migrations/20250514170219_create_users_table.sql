-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'operador', 'visualizador')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can do everything" ON users;
DROP POLICY IF EXISTS "Users can read their own data" ON users;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON users;

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy for admins to do everything
CREATE POLICY "Admins can do everything" ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'role' = 'admin' OR raw_app_meta_data->>'role' = 'admin')
    )
  );

-- Policy for users to read their own data
CREATE POLICY "Users can read their own data" ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Policy to allow initial user creation
CREATE POLICY "Allow insert for authenticated users" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Remover trigger se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Criar usuário admin inicial
DO $$
DECLARE
  admin_id UUID;
  admin_exists BOOLEAN;
BEGIN
  -- Verificar se o usuário admin já existe
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@rangel.com'
  ) INTO admin_exists;

  IF NOT admin_exists THEN
    -- Criar usuário no auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@rangel.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"],"role":"admin"}',
      '{"role":"admin"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO admin_id;

    -- Criar registro na tabela users
    INSERT INTO public.users (id, email, password, role, created_at)
    VALUES (admin_id, 'admin@rangel.com', 'admin123', 'admin', now());
  END IF;
END $$;

-- Atualizar usuário admin existente
DO $$
DECLARE
  admin_user RECORD;
BEGIN
  -- Encontrar o usuário admin
  SELECT * INTO admin_user FROM auth.users WHERE email = 'admin@rangel.com';
  
  IF admin_user.id IS NOT NULL THEN
    -- Atualizar os metadados do usuário
    UPDATE auth.users
    SET raw_user_meta_data = '{"role":"admin"}',
        raw_app_meta_data = '{"provider":"email","providers":["email"],"role":"admin"}'
    WHERE id = admin_user.id;

    -- Atualizar o papel na tabela users
    UPDATE public.users
    SET role = 'admin'
    WHERE id = admin_user.id;
  END IF;
END $$;

-- Forçar atualização dos metadados do usuário admin
DO $$
DECLARE
  admin_user RECORD;
BEGIN
  -- Encontrar o usuário admin
  SELECT * INTO admin_user FROM auth.users WHERE email = 'admin@rangel.com';
  
  IF admin_user.id IS NOT NULL THEN
    -- Forçar atualização dos metadados
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
      COALESCE(raw_user_meta_data, '{}'::jsonb),
      '{role}',
      '"admin"'
    ),
    raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{"provider":"email","providers":["email"]}'::jsonb),
      '{role}',
      '"admin"'
    )
    WHERE id = admin_user.id;
  END IF;
END $$;
