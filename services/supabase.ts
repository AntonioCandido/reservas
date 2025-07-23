



import { createClient } from '@supabase/supabase-js';
import type { User, Environment, Reservation, EnvironmentType, Resource } from '../types';
import { UserRole } from '../constants';

export type Database = {
  public: {
    Tables: {
      environments: {
        Row: {
          created_at: string
          id: string
          location: string | null
          name: string
          type_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          name: string
          type_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          type_id?: string
        }
        Relationships: []
      }
      environment_resources: {
        Row: {
          environment_id: string
          resource_id: string
        }
        Insert: {
          environment_id: string
          resource_id: string
        }
        Update: {
          environment_id?: string
          resource_id?: string
        }
        Relationships: []
      }
      environment_types: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      reservations: {
        Row: {
          created_at: string
          end_time: string
          environment_id: string | null
          id: string
          start_time: string
          status: "approved" | "pending" | "cancelled"
          user_id: string | null
        }
        Insert: {
          created_at?: string
          end_time: string
          environment_id: string | null
          id?: string
          start_time: string
          status?: "approved" | "pending" | "cancelled"
          user_id: string | null
        }
        Update: {
          created_at?: string
          end_time?: string
          environment_id?: string | null
          id?: string
          start_time?: string
          status?: "approved" | "pending" | "cancelled"
          user_id?: string | null
        }
        Relationships: []
      }
      resources: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          password: string
          role: "admin" | "professor" | "coordenador" | "aluno"
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          password: string
          role: "admin" | "professor" | "coordenador" | "aluno"
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          password?: string
          role?: "admin" | "professor" | "coordenador" | "aluno"
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}


const supabaseUrl = 'https://mjecveebtvtkslirjqym.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1qZWN2ZWVidHZ0a3NsaXJqcXltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MDI3ODIsImV4cCI6MjA2ODA3ODc4Mn0.ulkescqT6q9wnSpwoFS3qdLkAToSxalK5rFtuLGjIjg';

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

// --- Teste de Conexão ---
export async function testDatabaseConnection(): Promise<boolean> {
    try {
        const { error: usersError } = await supabase.from('users').select('id').limit(1);
        if (usersError) throw usersError;

        // Verifica a estrutura da tabela environments.
        // Procura pela coluna 'type_id' que é parte do esquema atual.
        // Se esta consulta falhar, o banco de dados provavelmente está desatualizado.
        const { error: environmentsError } = await supabase.from('environments').select('id, type_id').limit(1);
        if (environmentsError) throw environmentsError;
        
        const { error: typesError } = await supabase.from('environment_types').select('id').limit(1);
        if (typesError) throw typesError;

        const { error: resourcesError } = await supabase.from('resources').select('id').limit(1);
        if (resourcesError) throw resourcesError;

        const { error: reservationsError } = await supabase.from('reservations').select('id').limit(1);
        if (reservationsError) throw reservationsError;

    } catch (error: any) {
        console.error('Teste de conexão com o banco de dados falhou:', error.message);
        return false;
    }
    return true;
}

// --- Serviços de Autenticação e Usuário ---
export async function loginUser(email: string, password_plaintext: string): Promise<User | null> {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle(); // Usar maybeSingle() evita erro quando nenhum usuário é encontrado
    
    // Se houver um erro real na consulta (ex: problema de rede), lance uma exceção
    if (error) {
        console.error('Erro de login (falha na consulta):', error?.message);
        throw new Error('Ocorreu uma falha ao tentar fazer login. Tente novamente.');
    }

    // Se data for nulo, o usuário não existe; retorne nulo sem erro no console
    if (!data) {
        return null;
    }

    // Se o usuário existir, verifique a senha
    if ((data as any).password === password_plaintext) {
        const { password, ...userWithoutPassword } = data as any;
        return userWithoutPassword as User;
    }

    // Senha incorreta
    return null;
}

export async function getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('id, name, email, role, created_at').order('name');
    if (error) throw new Error('Falha ao buscar usuários: ' + error.message);
    return (data as unknown as User[]) || [];
}

export async function updateUser(
  userId: string, 
  currentPasswordForVerification: string,
  updateData: { name?: string; email?: string; password?: string }
): Promise<User> {
    const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('password')
        .eq('id', userId)
        .single();

    if (fetchError || !currentUser) {
        throw new Error('Usuário não encontrado.');
    }

    if ((currentUser as any).password !== currentPasswordForVerification) {
        throw new Error('A senha atual está incorreta.');
    }
    
    const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select('id, created_at, name, email, role')
        .single();

    if (error) {
        if (error.message.includes('unique constraint')) {
             throw new Error('Este e-mail já está em uso por outro usuário.');
        }
        throw new Error('Falha ao atualizar o usuário: ' + error.message);
    }
    
    if (!data) {
        throw new Error('Usuário não encontrado após a atualização.');
    }
    return data as unknown as User;
}

export async function updateUserByAdmin(
  userId: string,
  updateData: { name?: string; email?: string; role?: UserRole; password?: string }
): Promise<User> {
  const dataToUpdate: Partial<Database['public']['Tables']['users']['Update']> = { ...updateData };
  if (!dataToUpdate.password) {
    delete dataToUpdate.password;
  }

  const { data, error } = await supabase
    .from('users')
    .update(dataToUpdate)
    .eq('id', userId)
    .select('id, created_at, name, email, role')
    .single();

  if (error) {
    if (error.message.includes('unique constraint')) {
      throw new Error('Este e-mail já está em uso por outro usuário.');
    }
    throw new Error('Falha ao atualizar o usuário: ' + error.message);
  }
  if (!data) {
      throw new Error('Usuário não encontrado após a atualização.');
  }
  return data as unknown as User;
}

export async function createUserByAdmin(
  userData: { name: string; email: string; password: string; role: UserRole }
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select('id, created_at, name, email, role')
    .single();

  if (error) {
    if (error.message.includes('unique constraint')) {
      throw new Error('Este e-mail já está em uso por outro usuário.');
    }
    throw new Error('Falha ao criar o usuário: ' + error.message);
  }
  if (!data) {
      throw new Error('Usuário não pôde ser criado.');
  }
  return data as unknown as User;
}

export async function deleteUserByAdmin(userId: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) {
    if (error.code === '23503') { // Foreign key violation
      throw new Error('Não é possível excluir este usuário, pois ele possui reservas associadas.');
    }
    throw new Error('Falha ao excluir o usuário: ' + error.message);
  }
}


// --- Serviços de Ambientes ---
export async function getAllEnvironments(): Promise<Environment[]> {
    const { data, error } = await supabase
      .from('environments')
      .select('*, environment_types(name), environment_resources(resources!inner(*))')
      .order('name');

    if (error) throw new Error('Falha ao buscar ambientes: ' + error.message);
    if (!data) return [];
    
    // Com os tipos corretos, o uso de 'any' pode ser evitado.
    return data.map((env: any) => {
        const { environment_resources, ...rest } = env;
        const resources = environment_resources.map((er: any) => er.resources).filter(Boolean) as Resource[];
        return { ...rest, resources };
    }) as Environment[];
}

export async function addEnvironment(
  envData: { name: string; location?: string | null; type_id: string },
  resourceIds: string[]
): Promise<Environment> {
    const { data, error } = await supabase.from('environments').insert(envData).select().single();
    if (error) {
       if (error.message.includes('unique constraint')) {
           throw new Error('Já existe um ambiente com este nome.');
       }
       throw new Error('Falha ao adicionar o ambiente: ' + error.message);
    }
    if (!data) throw new Error('Não foi possível adicionar o ambiente.');

    if (resourceIds.length > 0) {
        const environmentResources = resourceIds.map(resource_id => ({
            environment_id: (data as any).id,
            resource_id: resource_id
        }));
        const { error: resourcesError } = await supabase.from('environment_resources').insert(environmentResources);
        if (resourcesError) {
            // Tenta limpar o ambiente criado em caso de erro nos recursos
            await supabase.from('environments').delete().eq('id', (data as any).id);
            throw new Error('Falha ao associar recursos ao ambiente: ' + resourcesError.message);
        }
    }
    
    // Busca novamente para retornar com os dados completos
    const { data: newData, error: newError } = await supabase.from('environments').select('*, environment_types(name), environment_resources(resources!inner(*))').eq('id', (data as any).id).single();
    if (newError) throw new Error('Falha ao buscar o ambiente recém-criado: ' + newError.message);
    if (!newData) throw new Error('Ambiente recém-criado não encontrado.');
    
    const { environment_resources, ...rest } = newData as any;
    const resources = environment_resources.map((er: any) => er.resources).filter(Boolean) as Resource[];
    return { ...rest, resources } as Environment;
}

export async function updateEnvironment(
  id: string, 
  envData: { name?: string; location?: string | null; type_id?: string },
  resourceIds: string[]
): Promise<Environment> {
    const { data, error } = await supabase
        .from('environments')
        .update(envData)
        .eq('id', id)
        .select()
        .single();
    if (error) {
       if (error.message.includes('unique constraint')) {
           throw new Error('Já existe um ambiente com este nome.');
       }
       throw new Error('Falha ao atualizar o ambiente: ' + error.message);
    }
    if (!data) throw new Error('Não foi possível encontrar o ambiente para atualizar.');

    // Atualiza os recursos: remove todos e adiciona os novos
    const { error: deleteError } = await supabase.from('environment_resources').delete().eq('environment_id', id);
    if(deleteError) throw new Error('Falha ao atualizar recursos (remoção): ' + deleteError.message);

    if(resourceIds.length > 0) {
        const environmentResources = resourceIds.map(resource_id => ({
            environment_id: id,
            resource_id: resource_id
        }));
        const { error: insertError } = await supabase.from('environment_resources').insert(environmentResources);
        if (insertError) throw new Error('Falha ao atualizar recursos (inserção): ' + insertError.message);
    }
    
    // Busca novamente para retornar com os dados completos
    const { data: newData, error: newError } = await supabase.from('environments').select('*, environment_types(name), environment_resources(resources!inner(*))').eq('id', (data as any).id).single();
    if (newError) throw new Error('Falha ao buscar o ambiente atualizado: ' + newError.message);
    if (!newData) throw new Error('Ambiente atualizado não encontrado.');

    const { environment_resources, ...rest } = newData as any;
    const resources = environment_resources.map((er: any) => er.resources).filter(Boolean) as Resource[];
    return { ...rest, resources } as Environment;
}

export async function deleteEnvironment(id: string): Promise<void> {
    const { error } = await supabase.from('environments').delete().eq('id', id);
    if (error) {
        if (error.code === '23503') { // Foreign key violation
            throw new Error('Não é possível excluir este ambiente, pois existem reservas associadas a ele.');
        }
        throw new Error('Falha ao excluir o ambiente: ' + error.message);
    }
}


// --- CRUD para Tipos de Ambiente ---
export async function getAllEnvironmentTypes(): Promise<EnvironmentType[]> {
    const { data, error } = await supabase.from('environment_types').select('*').order('name');
    if (error) throw new Error('Falha ao buscar tipos de ambiente: ' + error.message);
    return (data as unknown as EnvironmentType[]) || [];
}
export async function addEnvironmentType(name: string): Promise<EnvironmentType> {
    const { data, error } = await supabase.from('environment_types').insert({ name }).select().single();
    if (error) throw new Error('Falha ao adicionar tipo: ' + error.message);
    if (!data) throw new Error('Não foi possível criar o tipo.');
    return data as unknown as EnvironmentType;
}
export async function updateEnvironmentType(id: string, name: string): Promise<EnvironmentType> {
    const { data, error } = await supabase.from('environment_types').update({ name }).eq('id', id).select().single();
    if (error) throw new Error('Falha ao atualizar tipo: ' + error.message);
    if (!data) throw new Error('Tipo não encontrado para atualizar.');
    return data as unknown as EnvironmentType;
}
export async function deleteEnvironmentType(id: string): Promise<void> {
    const { error } = await supabase.from('environment_types').delete().eq('id', id);
    if (error) {
        if (error.code === '23503') {
            throw new Error('Não é possível excluir este tipo, pois está em uso por ambientes.');
        }
        throw new Error('Falha ao excluir tipo: ' + error.message);
    }
}

// --- CRUD para Recursos ---
export async function getAllResources(): Promise<Resource[]> {
    const { data, error } = await supabase.from('resources').select('*').order('name');
    if (error) throw new Error('Falha ao buscar recursos: ' + error.message);
    return (data as unknown as Resource[]) || [];
}
export async function addResource(name: string): Promise<Resource> {
    const { data, error } = await supabase.from('resources').insert({ name }).select().single();
    if (error) throw new Error('Falha ao adicionar recurso: ' + error.message);
    if (!data) throw new Error('Não foi possível criar o recurso.');
    return data as unknown as Resource;
}
export async function updateResource(id: string, name: string): Promise<Resource> {
    const { data, error } = await supabase.from('resources').update({ name }).eq('id', id).select().single();
    if (error) throw new Error('Falha ao atualizar recurso: ' + error.message);
    if (!data) throw new Error('Recurso não encontrado para atualizar.');
    return data as unknown as Resource;
}
export async function deleteResource(id: string): Promise<void> {
    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) {
         if (error.code === '23503') {
            throw new Error('Não é possível excluir este recurso, pois está em uso por ambientes.');
        }
        throw new Error('Falha ao excluir recurso: ' + error.message);
    }
}


// --- Serviços de Reservas ---
export async function getReservationsForEnvironment(environmentId: string): Promise<Reservation[]> {
    const { data, error } = await supabase
        .from('reservations')
        .select(`*, users (name, email), environments (name, location)`)
        .eq('environment_id', environmentId)
        .order('start_time');
    
    if (error) throw new Error('Falha ao buscar a agenda do ambiente: ' + error.message);
    return (data as unknown as Reservation[]) || [];
}

export async function getReservationsForMonth(year: number, month: number): Promise<Reservation[]> {
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).toISOString();
    const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, -1)).toISOString();

    const { data, error } = await supabase
        .from('reservations')
        .select(`*, users (name, email), environments (name, location)`)
        .gte('start_time', startDate)
        .lte('end_time', endDate)
        .order('start_time');

    if (error) throw new Error('Falha ao buscar reservas para o mês: ' + error.message);
    return (data as unknown as Reservation[]) || [];
}


export async function getUserReservations(userId: string): Promise<Reservation[]> {
    const { data, error } = await supabase
        .from('reservations')
        .select(`*, users (name, email), environments (name, location)`)
        .eq('user_id', userId)
        .order('start_time');
    
    if (error) throw new Error('Falha ao buscar suas reservas: ' + error.message);
    return (data as unknown as Reservation[]) || [];
}

export async function createReservations(reservationsData: { environment_id: string; user_id: string; start_time: string; end_time: string; }[]): Promise<any[]> {
    if (!reservationsData || reservationsData.length === 0) {
        return [];
    }

    // Etapa 1: Verificar conflitos antes da inserção.
    // A lógica foi reescrita para usar a sintaxe de filtro correta do Supabase (`and(column.op.value, ...)`),
    // resolvendo um erro que ocorria com a sintaxe SQL bruto anterior.
    const orFilters = reservationsData.map(res => 
        // Para cada nova reserva, cria um filtro que busca por reservas existentes
        // que se sobrepõem no tempo para o mesmo ambiente.
        `and(environment_id.eq.${res.environment_id},start_time.lt.${res.end_time},end_time.gt.${res.start_time})`
    ).join(',');

    const { data: conflictingReservations, error: conflictError } = await supabase
        .from('reservations')
        .select(`*, users (name), environments (name)`)
        .or(orFilters);

    if (conflictError) {
        console.error('Erro ao verificar conflitos:', conflictError.message);
        throw new Error('Falha ao verificar a disponibilidade do horário. Detalhe: ' + conflictError.message);
    }
    
    // Etapa 2: Lidar com conflitos encontrados e fornecer uma mensagem clara
    if (conflictingReservations && conflictingReservations.length > 0) {
        const firstConflict: any = conflictingReservations[0];
        const conflictDetails = `Conflito de horário! O ambiente "${firstConflict.environments?.name || 'desconhecido'}" já está reservado por "${firstConflict.users?.name || 'desconhecido'}" de ${new Date(firstConflict.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} às ${new Date(firstConflict.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} no mesmo dia.`;
        throw new Error(conflictDetails);
    }

    // Etapa 3: Inserir as novas reservas se não houver conflitos
    const dataToInsert = reservationsData.map(res => ({ ...res, status: 'approved' as const }));
    
    const { data, error } = await supabase
        .from('reservations')
        .insert(dataToInsert)
        .select();
    
    if (error) {
        if (error.message.includes('reservations_no_overlap')) {
             throw new Error('Este horário entra em conflito com uma reserva existente. Por favor, atualize e tente novamente.');
        }
        if (error.message.includes('check_end_time_after_start_time')) {
            throw new Error('O horário de término deve ser após o horário de início.');
        }
        throw new Error('Falha ao criar a reserva: ' + error.message);
    }
    
    return data;
}

export async function cancelReservation(id: string): Promise<void> {
    const { error } = await supabase.from('reservations').delete().eq('id', id);
    if (error) throw new Error('Falha ao cancelar a reserva: ' + error.message);
}

// --- Backup & Restore Services ---
export async function getBackupData(): Promise<object> {
    const [
        users,
        environment_types,
        resources,
        environments,
        environment_resources,
        reservations
    ] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('environment_types').select('*'),
        supabase.from('resources').select('*'),
        supabase.from('environments').select('*'),
        supabase.from('environment_resources').select('*'),
        supabase.from('reservations').select('*')
    ]);

    if (users.error) throw new Error('Falha ao buscar usuários: ' + users.error.message);
    if (environment_types.error) throw new Error('Falha ao buscar tipos de ambiente: ' + environment_types.error.message);
    if (resources.error) throw new Error('Falha ao buscar recursos: ' + resources.error.message);
    if (environments.error) throw new Error('Falha ao buscar ambientes: ' + environments.error.message);
    if (environment_resources.error) throw new Error('Falha ao buscar relações de recursos: ' + environment_resources.error.message);
    if (reservations.error) throw new Error('Falha ao buscar reservas: ' + reservations.error.message);
    
    return {
        users: users.data,
        environment_types: environment_types.data,
        resources: resources.data,
        environments: environments.data,
        environment_resources: environment_resources.data,
        reservations: reservations.data,
    };
}

export async function restoreBackupData(backupData: any): Promise<void> {
    const requiredKeys = ['users', 'environment_types', 'resources', 'environments', 'environment_resources', 'reservations'];
    for (const key of requiredKeys) {
        if (!backupData.hasOwnProperty(key) || !Array.isArray(backupData[key])) {
            throw new Error(`Arquivo de backup inválido. A chave "${key}" está faltando ou não é um array.`);
        }
    }

    // Deletion in reverse order of dependencies
    let { error } = await supabase.from('reservations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) throw new Error(`Falha ao limpar reservas: ${error.message}`);
    
    ({ error } = await supabase.from('environment_resources').delete().neq('environment_id', '00000000-0000-0000-0000-000000000000'));
    if (error) throw new Error(`Falha ao limpar recursos de ambientes: ${error.message}`);
    
    ({ error } = await supabase.from('environments').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
    if (error) throw new Error(`Falha ao limpar ambientes: ${error.message}`);
    
    ({ error } = await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
    if (error) throw new Error(`Falha ao limpar usuários: ${error.message}`);
    
    ({ error } = await supabase.from('resources').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
    if (error) throw new Error(`Falha ao limpar recursos: ${error.message}`);
    
    ({ error } = await supabase.from('environment_types').delete().neq('id', '00000000-0000-0000-0000-000000000000'));
    if (error) throw new Error(`Falha ao limpar tipos de ambiente: ${error.message}`);
    

    // Insertion in order of dependencies
    ({ error } = await supabase.from('users').insert(backupData.users));
    if (error) throw new Error(`Falha ao restaurar usuários: ${error.message}`);
    
    ({ error } = await supabase.from('environment_types').insert(backupData.environment_types));
    if (error) throw new Error(`Falha ao restaurar tipos de ambiente: ${error.message}`);

    ({ error } = await supabase.from('resources').insert(backupData.resources));
    if (error) throw new Error(`Falha ao restaurar recursos: ${error.message}`);

    ({ error } = await supabase.from('environments').insert(backupData.environments));
    if (error) throw new Error(`Falha ao restaurar ambientes: ${error.message}`);
    
    ({ error } = await supabase.from('environment_resources').insert(backupData.environment_resources));
    if (error) throw new Error(`Falha ao restaurar recursos de ambientes: ${error.message}`);

    ({ error } = await supabase.from('reservations').insert(backupData.reservations));
    if (error) throw new Error(`Falha ao restaurar reservas: ${error.message}`);
}