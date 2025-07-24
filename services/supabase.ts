

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

    const userData = data as any;
    // Se o usuário existir, verifique a senha
    if (userData.password === password_plaintext) {
        const { password, ...userWithoutPassword } = userData;
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
    
    const payload = updateData;
    const { data, error } = await supabase
        .from('users')
        .update(payload as any)
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
  const dataToUpdate: any = { ...updateData };
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
  const payload: Database['public']['Tables']['users']['Insert'] = userData;
  const { data, error } = await supabase
    .from('users')
    .insert(payload as any)
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
    const payload: Database['public']['Tables']['environments']['Insert'] = envData;
    const { data, error } = await supabase.from('environments').insert(payload as any).select().single();
    if (error) {
       if (error.message.includes('unique constraint')) {
           throw new Error('Já existe um ambiente com este nome.');
       }
       throw new Error('Falha ao adicionar o ambiente: ' + error.message);
    }
    if (!data) throw new Error('Não foi possível adicionar o ambiente.');

    const newEnvironment = data as any;

    if (resourceIds.length > 0) {
        const environmentResources: Database['public']['Tables']['environment_resources']['Insert'][] = resourceIds.map(resource_id => ({
            environment_id: newEnvironment.id,
            resource_id: resource_id
        }));
        const { error: resourcesError } = await supabase.from('environment_resources').insert(environmentResources as any);
        if (resourcesError) {
            // Tenta limpar o ambiente criado em caso de erro nos recursos
            await supabase.from('environments').delete().eq('id', newEnvironment.id);
            throw new Error('Falha ao associar recursos ao ambiente: ' + resourcesError.message);
        }
    }
    
    // Busca novamente para retornar com os dados completos
    const { data: newData, error: newError } = await supabase.from('environments').select('*, environment_types(name), environment_resources(resources!inner(*))').eq('id', newEnvironment.id).single();
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
    const payload: Database['public']['Tables']['environments']['Update'] = envData;
    const { data, error } = await supabase
        .from('environments')
        .update(payload as any)
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
        const environmentResources: Database['public']['Tables']['environment_resources']['Insert'][] = resourceIds.map(resource_id => ({
            environment_id: id,
            resource_id: resource_id
        }));
        const { error: insertError } = await supabase.from('environment_resources').insert(environmentResources as any);
        if (insertError) throw new Error('Falha ao atualizar recursos (inserção): ' + insertError.message);
    }
    
    // Busca novamente para retornar com os dados completos
    const { data: newData, error: newError } = await supabase.from('environments').select('*, environment_types(name), environment_resources(resources!inner(*))').eq('id', id).single();
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
    const payload: Database['public']['Tables']['environment_types']['Insert'] = { name };
    const { data, error } = await supabase.from('environment_types').insert(payload as any).select().single();
    if (error) throw new Error('Falha ao adicionar tipo: ' + error.message);
    if (!data) throw new Error('Não foi possível criar o tipo.');
    return data as unknown as EnvironmentType;
}
export async function updateEnvironmentType(id: string, name: string): Promise<EnvironmentType> {
    const payload: Database['public']['Tables']['environment_types']['Update'] = { name };
    const { data, error } = await supabase.from('environment_types').update(payload as any).eq('id', id).select().single();
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
    const payload: Database['public']['Tables']['resources']['Insert'] = { name };
    const { data, error } = await supabase.from('resources').insert(payload as any).select().single();
    if (error) throw new Error('Falha ao adicionar recurso: ' + error.message);
    if (!data) throw new Error('Não foi possível criar o recurso.');
    return data as unknown as Resource;
}
export async function updateResource(id: string, name: string): Promise<Resource> {
    const payload: Database['public']['Tables']['resources']['Update'] = { name };
    const { data, error } = await supabase.from('resources').update(payload as any).eq('id', id).select().single();
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
        .select(`*, users (name, email), environments(*, environment_types(name))`)
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
        .insert(dataToInsert as any)
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

export async function updateReservation(
  reservationId: string,
  updateData: {
    environment_id?: string;
    user_id?: string;
    start_time?: string;
    end_time?: string;
  }
): Promise<Reservation> {
  const { environment_id, user_id, start_time, end_time } = updateData;

  // 1. Obter o estado final da reserva para verificar conflitos
  const { data: currentReservation, error: fetchError } = await supabase
    .from('reservations')
    .select('environment_id, start_time, end_time')
    .eq('id', reservationId)
    .single();

  if (fetchError || !currentReservation) {
    throw new Error('Reserva original não encontrada para verificação de conflitos.');
  }

  const currentRes = currentReservation as any;
  
  const finalEnvId = environment_id || currentRes.environment_id;
  const finalStartTime = start_time || currentRes.start_time;
  const finalEndTime = end_time || currentRes.end_time;
  
  if (!finalEnvId || !finalStartTime || !finalEndTime) {
      throw new Error("Dados insuficientes para verificar conflitos.");
  }
  
  // 2. Verificar se existem reservas conflitantes para o mesmo ambiente e horário
  const { data: conflictingReservations, error: conflictError } = await supabase
    .from('reservations')
    .select('id, environments (name)')
    .neq('id', reservationId) // Excluir a própria reserva da verificação
    .eq('environment_id', finalEnvId)
    .lt('start_time', finalEndTime) // A nova reserva começa antes que a antiga termine
    .gt('end_time', finalStartTime); // A nova reserva termina depois que a antiga começa

  if (conflictError) {
    console.error('Erro ao verificar conflitos na atualização:', conflictError.message);
    throw new Error('Falha ao verificar a disponibilidade do horário durante a atualização.');
  }

  if (conflictingReservations && conflictingReservations.length > 0) {
    const conflictDetails = `Conflito de horário! O ambiente "${(conflictingReservations[0] as any).environments?.name || 'desconhecido'}" já possui uma reserva que se sobrepõe a este horário.`;
    throw new Error(conflictDetails);
  }

  // 3. Se não houver conflitos, atualizar a reserva
  const payload: Partial<Database['public']['Tables']['reservations']['Update']> = {};
  if (environment_id) payload.environment_id = environment_id;
  if (user_id) payload.user_id = user_id;
  if (start_time) payload.start_time = start_time;
  if (end_time) payload.end_time = end_time;

  const { data, error } = await supabase
    .from('reservations')
    .update(payload as any)
    .eq('id', reservationId)
    .select(`*, users (name, email), environments(*, environment_types(name))`)
    .single();

  if (error) {
    console.error('Erro ao atualizar reserva:', error.message);
    if (error.message.includes('reservations_no_overlap')) {
        throw new Error('Conflito de horário detectado pelo banco de dados.');
    }
    if (error.message.includes('check_end_time_after_start_time')) {
        throw new Error('O horário de término deve ser após o horário de início.');
    }
    throw new Error('Falha ao atualizar a reserva.');
  }

  if (!data) {
    throw new Error('Não foi possível encontrar a reserva após a atualização.');
  }

  return data as unknown as Reservation;
}

// --- Serviços de Backup e Restauração ---
export async function getBackupData(): Promise<any> {
    const { data: users, error: usersError } = await supabase.from('users').select('*');
    if (usersError) throw new Error(`Backup (users): ${usersError.message}`);
    
    const { data: environment_types, error: typesError } = await supabase.from('environment_types').select('*');
    if (typesError) throw new Error(`Backup (types): ${typesError.message}`);

    const { data: resources, error: resourcesError } = await supabase.from('resources').select('*');
    if (resourcesError) throw new Error(`Backup (resources): ${resourcesError.message}`);

    const { data: environments, error: envsError } = await supabase.from('environments').select('*');
    if (envsError) throw new Error(`Backup (environments): ${envsError.message}`);

    const { data: environment_resources, error: envResError } = await supabase.from('environment_resources').select('*');
    if (envResError) throw new Error(`Backup (env_resources): ${envResError.message}`);
    
    const { data: reservations, error: resError } = await supabase.from('reservations').select('*');
    if (resError) throw new Error(`Backup (reservations): ${resError.message}`);

    return {
        users,
        environment_types,
        resources,
        environments,
        environment_resources,
        reservations,
    };
}

export async function restoreBackupData(backupData: any): Promise<void> {
    const { users, environment_types, resources, environments, environment_resources, reservations } = backupData;

    // Validação básica do arquivo de backup
    if (!users || !environment_types || !resources || !environments || !environment_resources || !reservations) {
        throw new Error('Arquivo de backup inválido ou corrompido. Faltam tabelas essenciais.');
    }
    
    // Deletar na ordem inversa de dependência
    const tablesToDelete = [
        'reservations', 
        'environment_resources', 
        'environments', 
        'resources', 
        'environment_types', 
        'users'
    ];
    for (const table of tablesToDelete) {
        // Usar um filtro que sempre será verdadeiro para deletar todos os registros
        const { error } = await supabase.from(table as any).delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows trick
        if (error) throw new Error(`Falha ao limpar a tabela ${table}: ${error.message}`);
    }

    // Inserir na ordem de dependência
    const { error: usersError } = await supabase.from('users').insert(users as any);
    if (usersError) throw new Error(`Restauração (users): ${usersError.message}`);

    const { error: typesError } = await supabase.from('environment_types').insert(environment_types as any);
    if (typesError) throw new Error(`Restauração (types): ${typesError.message}`);

    const { error: resourcesError } = await supabase.from('resources').insert(resources as any);
    if (resourcesError) throw new Error(`Restauração (resources): ${resourcesError.message}`);

    const { error: envsError } = await supabase.from('environments').insert(environments as any);
    if (envsError) throw new Error(`Restauração (environments): ${envsError.message}`);

    const { error: envResError } = await supabase.from('environment_resources').insert(environment_resources as any);
    if (envResError) throw new Error(`Restauração (env_resources): ${envResError.message}`);
    
    const { error: resError } = await supabase.from('reservations').insert(reservations as any);
    if (resError) throw new Error(`Restauração (reservations): ${resError.message}`);
}