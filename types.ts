import { Page, UserRole } from './constants';

export interface User {
  id: string;
  created_at: string;
  name: string;
  email: string;
  role: UserRole;
  // A senha não deve ser armazenada no estado do cliente
}

export interface EnvironmentType {
  id: string;
  created_at: string;
  name: string;
}

export interface Resource {
  id: string;
  created_at: string;
  name: string;
}

export interface Environment {
  id: string;
  created_at: string;
  name: string;
  location: string | null;
  type_id: string;
  environment_types: { name: string } | null;
  resources: Resource[];
}

export interface Reservation {
  id: string;
  created_at: string;
  environment_id: string;
  user_id: string;
  start_time: string;
  end_time: string;
  status: 'approved' | 'pending' | 'cancelled';
  users: { name: string; email: string } | null;
  environments: { name: string; location: string } | null;
}


export interface AppContextType {
  page: Page;
  setPage: (page: Page) => void;
  user: User | null;
  setUser: (user: User | null) => void;
}