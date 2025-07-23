import React from 'react';
import { Page } from '../../constants';
import type { AppContextType } from '../../types';

const DbErrorScreen: React.FC<Pick<AppContextType, 'setPage'>> = ({ setPage }) => {

  const sqlScript = `-- Este script é idempotente. Pode ser executado com segurança em um banco de dados novo ou existente.
-- Ele criará as tabelas que faltam, migrará as estruturas antigas e inserirá os dados de exemplo.

-- Habilita as extensões para gerar UUIDs e para o GIST, necessário para a restrição de sobreposição.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Criação de tabelas com IF NOT EXISTS para ser seguro
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'professor', 'coordenador', 'aluno'))
);

CREATE TABLE IF NOT EXISTS public.environment_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  environment_id uuid, -- A chave estrangeira será adicionada depois
  user_id uuid, -- A chave estrangeira será adicionada depois
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  status text DEFAULT 'approved' NOT NULL CHECK (status IN ('approved', 'pending', 'cancelled')),
  CONSTRAINT check_end_time_after_start_time CHECK (end_time > start_time)
);

-- Lógica de migração para a tabela de ambientes
DO $$
BEGIN
  -- Se a tabela de ambientes não existir, crie-a com o novo esquema
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'environments') THEN
    CREATE TABLE public.environments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      created_at timestamp with time zone DEFAULT now() NOT NULL,
      name text NOT NULL UNIQUE,
      location text,
      type_id uuid NOT NULL
    );
  -- Se a tabela existir, verifique se ela precisa de migração
  ELSE
    -- Adiciona a coluna type_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='environments' AND column_name='type_id') THEN
      ALTER TABLE public.environments ADD COLUMN type_id uuid;
    END IF;

    -- Migra dados do campo de texto 'type' se ele existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='environments' AND column_name='type') THEN
      INSERT INTO public.environment_types (name) SELECT DISTINCT type FROM public.environments WHERE type IS NOT NULL ON CONFLICT (name) DO NOTHING;
      UPDATE public.environments e SET type_id = et.id FROM public.environment_types et WHERE e.type = et.name;
      ALTER TABLE public.environments DROP COLUMN type;
      ALTER TABLE public.environments ALTER COLUMN type_id SET NOT NULL;
    END IF;
    
    -- Remove a coluna capacity se ela existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='environments' AND column_name='capacity') THEN
      ALTER TABLE public.environments DROP COLUMN capacity;
    END IF;

    -- Remove a coluna antiga 'resources' (array de texto) se ela existir
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='environments' AND column_name='resources' AND data_type='ARRAY') THEN
      ALTER TABLE public.environments DROP COLUMN resources;
    END IF;
  END IF;
END $$;

-- Cria a tabela de junção para recursos
CREATE TABLE IF NOT EXISTS public.environment_resources (
  environment_id uuid NOT NULL,
  resource_id uuid NOT NULL,
  PRIMARY KEY (environment_id, resource_id)
);

-- Adiciona as chaves estrangeiras e restrições
DO $$
BEGIN
    -- Para environments
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'environments_type_id_fkey') THEN
        ALTER TABLE public.environments ADD CONSTRAINT environments_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.environment_types(id) ON DELETE RESTRICT;
    END IF;

    -- Para environment_resources
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'environment_resources_environment_id_fkey') THEN
        ALTER TABLE public.environment_resources ADD CONSTRAINT environment_resources_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES public.environments(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'environment_resources_resource_id_fkey') THEN
        ALTER TABLE public.environment_resources ADD CONSTRAINT environment_resources_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id) ON DELETE CASCADE;
    END IF;
    
    -- Para reservations
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reservations_environment_id_fkey') THEN
        ALTER TABLE public.reservations ADD CONSTRAINT reservations_environment_id_fkey FOREIGN KEY (environment_id) REFERENCES public.environments(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reservations_user_id_fkey') THEN
        ALTER TABLE public.reservations ADD CONSTRAINT reservations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Remove a antiga chave de unicidade se ela existir, para substituí-la
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reservations_environment_id_start_time_end_time_key') THEN
        ALTER TABLE public.reservations DROP CONSTRAINT reservations_environment_id_start_time_end_time_key;
    END IF;
    
    -- Adiciona a nova restrição de exclusão para evitar sobreposição de horários.
    -- Isso garante no nível do banco de dados que não haja duas reservas para o mesmo ambiente no mesmo intervalo de tempo.
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reservations_no_overlap') THEN
        ALTER TABLE public.reservations 
        ADD CONSTRAINT reservations_no_overlap 
        EXCLUDE USING gist (environment_id WITH =, tstzrange(start_time, end_time) WITH &&);
    END IF;
END $$;

-- Inserir dados iniciais (Seed Data) com ON CONFLICT para segurança
INSERT INTO public.users (name, email, password, role) VALUES
('Candido Admin', 'admin@estacio.br', '123', 'admin'),
('Prof. Diego', 'diego@estacio.br', '123', 'professor'),
('Coordenador Academico', 'coord@estacio.br', '123', 'coordenador'),
('Aluno Teste', 'aluno@estacio.br', '123', 'aluno')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.environment_types (name) VALUES
('Sala de Aula'), ('Laboratório'), ('Auditório'), ('Sala de Reunião')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.resources (name) VALUES
('Projetor'), ('Quadro Branco'), ('Computadores'), ('Internet Rápida'), ('Sistema de Som'), ('Palco'), ('TV 60"')
ON CONFLICT (name) DO NOTHING;

-- Inserir ambientes e recursos de forma segura
INSERT INTO public.environments (name, type_id, location) VALUES
('Sala de Aula 101', (SELECT id from public.environment_types WHERE name = 'Sala de Aula'), 'Bloco A, 1º Andar'),
('Laboratório de Informática B', (SELECT id from public.environment_types WHERE name = 'Laboratório'), 'Bloco C, Térreo'),
('Auditório Principal', (SELECT id from public.environment_types WHERE name = 'Auditório'), 'Prédio Central'),
('Sala de Reunião 3', (SELECT id from public.environment_types WHERE name = 'Sala de Reunião'), 'Bloco Administrativo')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.environment_resources (environment_id, resource_id)
SELECT env.id, res.id FROM public.environments env, public.resources res
WHERE (env.name = 'Sala de Aula 101' AND res.name IN ('Projetor', 'Quadro Branco'))
   OR (env.name = 'Laboratório de Informática B' AND res.name IN ('Computadores', 'Projetor', 'Internet Rápida'))
   OR (env.name = 'Auditório Principal' AND res.name IN ('Projetor', 'Sistema de Som', 'Palco'))
   OR (env.name = 'Sala de Reunião 3' AND res.name IN ('TV 60"', 'Quadro Branco'))
ON CONFLICT (environment_id, resource_id) DO NOTHING;
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlScript).then(() => {
        alert('Script SQL copiado para a área de transferência!');
    }, (err) => {
        console.error('Falha ao copiar o texto: ', err);
        alert('Falha ao copiar o script.');
    });
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl p-8">
        <h1 className="text-3xl font-bold text-estacio-red mb-4">Falha na Configuração do Banco de Dados</h1>
        <p className="text-gray-700 mb-6">
          O aplicativo não conseguiu se conectar às tabelas necessárias. A causa mais provável é que elas ainda não existem ou estão desatualizadas no seu projeto Supabase.
        </p>
        <div className="space-y-6 text-left">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Solução: Execute o Script de Atualização</h2>
            <p className="text-gray-600 mb-4">
             Para que o aplicativo funcione, você precisa executar o script SQL abaixo no seu editor de SQL do Supabase. Isso criará as tabelas que faltam, atualizará as existentes e adicionará dados de teste.
            </p>
            <ol className="list-decimal list-inside space-y-2 mb-4 bg-gray-50 p-4 rounded-md">
              <li>Acesse seu projeto em <a href="https://app.supabase.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">app.supabase.com</a>.</li>
              <li>No menu lateral, vá para <strong>SQL Editor</strong> (ícone de terminal).</li>
              <li>Clique em <strong>"+ New query"</strong>.</li>
              <li>Copie o código SQL abaixo, cole no editor e clique em <strong>"RUN"</strong>.</li>
              <li>Após a execução, <strong>desabilite a Row Level Security (RLS)</strong> para as novas tabelas, se necessário, para que a aplicação de demonstração possa acessá-las.</li>
            </ol>
            <div className="relative">
                <textarea
                readOnly
                className="w-full h-64 p-3 font-mono text-sm bg-gray-900 text-green-400 rounded-md border border-gray-700 resize-none"
                value={sqlScript}
                />
                <button 
                    onClick={copyToClipboard}
                    className="absolute top-2 right-2 flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold py-1 px-2 rounded-md"
                    aria-label="Copiar script SQL"
                >
                    <i className="bi bi-clipboard"></i>
                    <span>Copiar</span>
                </button>
            </div>
          </div>
        </div>
        <div className="mt-8 text-center">
          <button
            onClick={() => window.location.reload()}
            className="bg-estacio-blue text-white font-bold py-3 px-6 rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 shadow-md flex items-center justify-center gap-2 mx-auto"
          >
            <i className="bi bi-arrow-repeat"></i>
            <span>Tentar Novamente</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DbErrorScreen;