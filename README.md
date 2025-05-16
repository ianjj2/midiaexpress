# Outdoor Digital

Sistema de gerenciamento e exibição de banners digitais para outdoors.

## Funcionalidades

- Exibição de banners em tela cheia
- Suporte a imagens, GIFs e vídeos
- Rotação automática de banners
- Transições suaves entre banners
- Sistema de administração para gerenciamento de conteúdo

## Tecnologias Utilizadas

- Next.js
- React
- TypeScript
- Supabase (Banco de dados e armazenamento)
- Tailwind CSS
- Framer Motion

## Configuração do Ambiente

1. Clone o repositório
2. Instale as dependências:
   ```bash
   npm install
   ```

3. Configure as variáveis de ambiente:
   - Crie um arquivo `.env.local` na raiz do projeto
   - Adicione as seguintes variáveis:
     ```
     NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
     NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
     ```

4. Configure o Supabase:
   - Crie um novo projeto no Supabase
   - Crie uma tabela `banners` com a seguinte estrutura:
     ```sql
     create table banners (
       id uuid default uuid_generate_v4() primary key,
       title text not null,
       file_url text not null,
       duration integer not null,
       order integer not null,
       file_type text not null,
       created_at timestamp with time zone default timezone('utc'::text, now()) not null
     );
     ```
   - Crie um bucket de armazenamento chamado `banners`

5. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## Uso

### Exibição de Banners

- Acesse a página principal para ver os banners em exibição
- Os banners serão exibidos em tela cheia
- A transição entre banners é automática

### Administração

- Acesse `/admin` para gerenciar os banners
- Adicione novos banners através do formulário
- Gerencie a ordem e duração dos banners
- Exclua banners quando necessário

## Estrutura do Projeto

```
src/
  ├── app/
  │   ├── page.tsx (Página principal)
  │   └── admin/
  │       └── page.tsx (Página de administração)
  ├── components/
  │   └── AddBannerForm.tsx (Formulário de adição de banners)
  └── lib/
      └── supabase.ts (Configuração do Supabase)
``` 