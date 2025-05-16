-- Atualizar a política de seleção para permitir que admins vejam todos os usuários
CREATE POLICY "Admins podem ver todos os usuários"
ON public.users
FOR SELECT
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Atualizar a política de inserção para permitir que admins criem usuários
CREATE POLICY "Admins podem criar usuários"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin'
);

-- Atualizar a política de atualização para permitir que admins atualizem usuários
CREATE POLICY "Admins podem atualizar usuários"
ON public.users
FOR UPDATE
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
)
WITH CHECK (
  auth.jwt() ->> 'role' = 'admin'
);

-- Atualizar a política de deleção para permitir que admins deletem usuários
CREATE POLICY "Admins podem deletar usuários"
ON public.users
FOR DELETE
TO authenticated
USING (
  auth.jwt() ->> 'role' = 'admin'
);

-- Garantir que a tabela users tenha RLS habilitado
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Garantir que a tabela users tenha as colunas necessárias
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role text DEFAULT 'visualizador',
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- Atualizar o usuário admin para ter o papel correto
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@rangel.com'; 