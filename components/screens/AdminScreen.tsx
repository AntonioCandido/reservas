

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  getAllEnvironments, addEnvironment, deleteEnvironment, updateEnvironment,
  getAllUsers, updateUserByAdmin, createUserByAdmin, deleteUserByAdmin,
  getAllEnvironmentTypes, addEnvironmentType, updateEnvironmentType, deleteEnvironmentType,
  getAllResources, addResource, updateResource, deleteResource,
  getReservationsForEnvironment, getUserReservations, getReservationsForMonth, createReservation
} from '../../services/supabase.ts';
import type { AppContextType, Environment, User, Reservation, EnvironmentType, Resource } from '../../types';
import { Page, UserRole } from '../../constants';
import Spinner from '../common/Spinner';
import ConfirmationModal from '../common/ConfirmationModal';
import Modal from '../common/Modal';
import ProfileModal from '../common/ProfileModal';

type AdminView = 'calendar' | 'environments' | 'users' | 'types' | 'resources';

const FormField = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
        <label htmlFor={props.id || props.name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <input {...props} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-estacio-blue focus:border-estacio-blue" />
    </div>
);

const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="py-2"><p className="text-sm font-semibold text-gray-500">{label}</p><p className="text-md text-gray-800">{value || 'N/A'}</p></div>
);

const AdminScreen: React.FC<Omit<AppContextType, 'page'>> = ({ setPage, user, setUser }) => {
  const [view, setView] = useState<AdminView>('environments');
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [types, setTypes] = useState<EnvironmentType[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [envData, userData, typeData, resourceData] = await Promise.all([
        getAllEnvironments(),
        getAllUsers(),
        getAllEnvironmentTypes(),
        getAllResources(),
      ]);
      setEnvironments(envData);
      setUsers(userData);
      setTypes(typeData);
      setResources(resourceData);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleLogout = () => {
    setUser(null);
    setPage(Page.Login);
  };
  
  const renderView = () => {
    switch(view) {
        case 'environments': return <EnvironmentsAdminView environments={environments} types={types} resources={resources} refreshData={fetchAllData} />;
        case 'users': return <UsersAdminView users={users} refreshData={fetchAllData} currentUser={user!} />;
        case 'types': return <TypesAdminView types={types} refreshData={fetchAllData} />;
        case 'resources': return <ResourcesAdminView resources={resources} refreshData={fetchAllData} />;
        case 'calendar': return <CalendarAdminView environments={environments} resources={resources} allUsers={users} />;
        default: return null;
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Gestão</h1>
        <div className="flex items-center gap-4">
            <div className="text-center">
                <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center justify-center h-10 w-10 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-full transition-colors" aria-label="Editar Perfil">
                    <i className="bi bi-person-fill text-xl"></i>
                </button>
                {user && <span className="text-xs text-gray-600 mt-1 max-w-24 truncate block">{user.name}</span>}
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-estacio-red text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105">
              <i className="bi bi-box-arrow-right text-lg"></i>
              <span>Sair</span>
            </button>
        </div>
      </header>

      {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center font-semibold">{error}</p>}

      <div className="mb-8">
        <nav className="flex justify-center" aria-label="Tabs de Gestão">
          <button
            onClick={() => setView('environments')}
            className={`flex flex-col items-center justify-center w-1/5 py-3 font-semibold transition-colors duration-200 ease-in-out focus:outline-none border-b-4 ${
              view === 'environments'
                ? 'border-estacio-blue text-estacio-blue'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
            aria-current={view === 'environments' ? 'page' : undefined}
          >
            <i className="bi bi-door-open-fill text-2xl"></i>
            <span className="text-xs mt-1">Ambientes</span>
          </button>
          <button
            onClick={() => setView('users')}
            className={`flex flex-col items-center justify-center w-1/5 py-3 font-semibold transition-colors duration-200 ease-in-out focus:outline-none border-b-4 ${
              view === 'users'
                ? 'border-estacio-blue text-estacio-blue'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
            aria-current={view === 'users' ? 'page' : undefined}
          >
            <i className="bi bi-people-fill text-2xl"></i>
            <span className="text-xs mt-1">Usuários</span>
          </button>
          <button
            onClick={() => setView('types')}
            className={`flex flex-col items-center justify-center w-1/5 py-3 font-semibold transition-colors duration-200 ease-in-out focus:outline-none border-b-4 ${
              view === 'types'
                ? 'border-estacio-blue text-estacio-blue'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
            aria-current={view === 'types' ? 'page' : undefined}
          >
            <i className="bi bi-tags-fill text-2xl"></i>
            <span className="text-xs mt-1">Tipos</span>
          </button>
          <button
            onClick={() => setView('resources')}
            className={`flex flex-col items-center justify-center w-1/5 py-3 font-semibold transition-colors duration-200 ease-in-out focus:outline-none border-b-4 ${
              view === 'resources'
                ? 'border-estacio-blue text-estacio-blue'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
            aria-current={view === 'resources' ? 'page' : undefined}
          >
            <i className="bi bi-tools text-2xl"></i>
            <span className="text-xs mt-1">Recursos</span>
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex flex-col items-center justify-center w-1/5 py-3 font-semibold transition-colors duration-200 ease-in-out focus:outline-none border-b-4 ${
              view === 'calendar'
                ? 'border-estacio-blue text-estacio-blue'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
            aria-current={view === 'calendar' ? 'page' : undefined}
          >
            <i className="bi bi-calendar3-fill text-2xl"></i>
            <span className="text-xs mt-1">Calendário</span>
          </button>
        </nav>
      </div>
      
      {isLoading ? <div className="py-8"><Spinner/></div> : renderView()}

      {user && (
        <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} user={user} onUserUpdate={setUser} />
      )}
    </div>
  );
};

// Generic CRUD view for simple items like Types and Resources
const SimpleCrudView: React.FC<{
    title: string;
    icon: string;
    items: { id: string; name: string }[];
    refreshData: () => Promise<void>;
    addFn: (name: string) => Promise<any>;
    updateFn: (id: string, name: string) => Promise<any>;
    deleteFn: (id: string) => Promise<void>;
}> = ({ title, icon, items, refreshData, addFn, updateFn, deleteFn }) => {
    const [itemToEdit, setItemToEdit] = useState<{ id: string, name: string } | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);
    const [newItemName, setNewItemName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.name.localeCompare(b.name, 'pt-BR');
            } else {
                return b.name.localeCompare(a.name, 'pt-BR');
            }
        });
    }, [items, sortOrder]);

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;
        setIsSaving(true);
        setError('');
        try {
            await addFn(newItemName.trim());
            setNewItemName('');
            await refreshData();
        } catch (err: any) { setError(err.message); }
        finally { setIsSaving(false); }
    };
    
    const handleUpdateItem = async (id: string, name: string) => {
        setIsSaving(true);
        setError('');
        try {
            await updateFn(id, name);
            setItemToEdit(null);
            await refreshData();
        } catch (err: any) { setError(err.message); }
        finally { setIsSaving(false); }
    };
    
    const handleDeleteItem = async () => {
        if(!itemToDelete) return;
        setIsSaving(true);
        setError('');
        try {
            await deleteFn(itemToDelete.id);
            setItemToDelete(null);
            await refreshData();
        } catch (err: any) { setError(err.message); }
        finally { setIsSaving(false); }
    };

    return (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden p-6">
            <div className="flex items-center gap-3 mb-4">
                <i className={`bi ${icon} text-2xl text-estacio-blue`}></i>
                <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
                 <button
                    onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-estacio-blue transition-colors"
                    title={sortOrder === 'asc' ? "Ordenar Z-A" : "Ordenar A-Z"}
                    aria-label={`Ordenar ${title.toLowerCase()} por nome`}
                >
                    <i className={`bi ${sortOrder === 'asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up-alt'} text-xl`}></i>
                </button>
            </div>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <form onSubmit={handleAddItem} className="flex gap-2 mb-4 border-b pb-4">
                <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder={`Novo ${title.slice(0, -1)}`}
                    className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm"
                    disabled={isSaving}
                />
                <button type="submit" disabled={isSaving || !newItemName.trim()} className="bg-estacio-blue text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
                    {isSaving ? <Spinner/> : "Adicionar"}
                </button>
            </form>
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                {sortedItems.length > 0 ? sortedItems.map(item => (
                    <div key={item.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                        <p className="font-semibold text-gray-700">{item.name}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setItemToEdit(item)} className="bg-blue-100 text-blue-600 h-8 w-8 flex items-center justify-center rounded-full" title="Editar"><i className="bi bi-pencil-square"></i></button>
                            <button onClick={() => setItemToDelete(item)} className="bg-red-100 text-red-600 h-8 w-8 flex items-center justify-center rounded-full" title="Excluir"><i className="bi bi-trash"></i></button>
                        </div>
                    </div>
                )) : <p className="text-center text-gray-500 py-4">Nenhum item cadastrado.</p>}
            </div>

            {itemToEdit && (
                <ItemEditModal 
                  isOpen={!!itemToEdit}
                  onClose={() => setItemToEdit(null)}
                  item={itemToEdit}
                  onSave={handleUpdateItem}
                  isSaving={isSaving}
                  title={`Editar ${title.slice(0, -1)}`}
                />
            )}
            <ConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={handleDeleteItem}
                title={`Excluir ${title.slice(0, -1)}`}
                message={`Tem certeza que deseja excluir "${itemToDelete?.name}"?`}
                isConfirming={isSaving}
            />
        </div>
    );
};

const TypesAdminView: React.FC<{ types: EnvironmentType[], refreshData: () => Promise<void> }> = ({ types, refreshData }) => (
    <SimpleCrudView title="Tipos de Ambientes" icon="bi-tags-fill" items={types} refreshData={refreshData} addFn={addEnvironmentType} updateFn={updateEnvironmentType} deleteFn={deleteEnvironmentType} />
);

const ResourcesAdminView: React.FC<{ resources: Resource[], refreshData: () => Promise<void> }> = ({ resources, refreshData }) => (
    <SimpleCrudView title="Recursos" icon="bi-tools" items={resources} refreshData={refreshData} addFn={addResource} updateFn={updateResource} deleteFn={deleteResource} />
);

const UsersAdminView: React.FC<{ users: User[], refreshData: () => Promise<void>, currentUser: User }> = ({ users, refreshData, currentUser }) => {
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToView, setUserToView] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.name.localeCompare(b.name, 'pt-BR');
            } else {
                return b.name.localeCompare(a.name, 'pt-BR');
            }
        });
    }, [users, sortOrder]);
    
    const handleUpdateUser = async (userId: string, updateData: { name?: string; email?: string; role?: UserRole; password?: string }): Promise<void> => {
        await updateUserByAdmin(userId, updateData);
        setUserToEdit(null);
        await refreshData();
    };

    const handleAddUser = async (userData: { name: string; email: string; password: string; role: UserRole }): Promise<void> => {
        await createUserByAdmin(userData);
        setIsAddingUser(false);
        await refreshData();
    };
    
    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        setIsProcessing(true);
        setError('');
        try {
            await deleteUserByAdmin(userToDelete.id);
            setUserToDelete(null);
            await refreshData();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden p-6">
            <div className="flex justify-between items-center mb-4">
                 <div className="flex items-center gap-3">
                    <i className="bi bi-people-fill text-2xl text-estacio-blue"></i>
                    <h2 className="text-2xl font-semibold text-gray-800">Usuários Cadastrados</h2>
                     <button
                        onClick={() => setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'))}
                        className="p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-estacio-blue transition-colors"
                        title={sortOrder === 'asc' ? "Ordenar Z-A" : "Ordenar A-Z"}
                        aria-label="Ordenar usuários por nome"
                    >
                        <i className={`bi ${sortOrder === 'asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up-alt'} text-2xl`}></i>
                    </button>
                </div>
                <button onClick={() => setIsAddingUser(true)} className="flex items-center gap-2 bg-estacio-blue text-white font-bold py-2 px-3 rounded-lg hover:bg-opacity-90 text-sm">
                    <i className="bi bi-person-plus-fill"></i><span>Novo</span>
                </button>
            </div>
            {error && <p className="bg-red-100 text-red-700 p-3 rounded-md my-4 text-center font-semibold">{error}</p>}
            <div className="space-y-3 border-t pt-4 border-gray-200 max-h-[60vh] overflow-y-auto pr-2">
                {sortedUsers.map(user => (
                    <div key={user.id} onClick={() => { setError(''); setUserToView(user); }} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div><p className="font-bold text-gray-800">{user.name}</p><p className="text-sm text-gray-600">{user.email}</p></div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-white bg-estacio-red px-3 py-1 rounded-full capitalize">{user.role}</span>
                            <button onClick={(e) => { e.stopPropagation(); setError(''); setUserToEdit(user); }} className="bg-blue-100 text-blue-600 h-10 w-10 flex items-center justify-center rounded-full" title="Editar" aria-label={`Editar usuário ${user.name}`}>
                                <i className="bi bi-pencil-square"></i>
                            </button>
                            {currentUser.id !== user.id && (
                                <button onClick={(e) => { e.stopPropagation(); setError(''); setUserToDelete(user); }} className="bg-red-100 text-red-600 h-10 w-10 flex items-center justify-center rounded-full" title="Excluir" aria-label={`Excluir usuário ${user.name}`}>
                                    <i className="bi bi-trash"></i>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {userToView && <UserDetailsModal isOpen={!!userToView} onClose={() => setUserToView(null)} user={userToView} />}
            {userToEdit && <UserEditModal isOpen={!!userToEdit} onClose={() => setUserToEdit(null)} user={userToEdit} onSave={handleUpdateUser} />}
            <UserAddModal isOpen={isAddingUser} onClose={() => setIsAddingUser(false)} onSave={handleAddUser} />
            <ConfirmationModal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={handleDeleteUser}
                title="Confirmar Exclusão de Usuário"
                message={<>Tem certeza que deseja excluir o usuário <strong>"{userToDelete?.name}"</strong>? Esta ação não pode ser desfeita.</>}
                isConfirming={isProcessing}
                confirmButtonText="Sim, Excluir"
            />
        </div>
    );
};

const EnvironmentsAdminView: React.FC<{ environments: Environment[], types: EnvironmentType[], resources: Resource[], refreshData: () => Promise<void> }> = ({ environments, types, resources, refreshData }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isListOpen, setIsListOpen] = useState(false);
    const [envToEdit, setEnvToEdit] = useState<Environment | null>(null);
    const [envToDelete, setEnvToDelete] = useState<Environment | null>(null);
    const [envToView, setEnvToView] = useState<Environment | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const sortedEnvironments = useMemo(() => {
        return [...environments].sort((a, b) => {
            if (sortOrder === 'asc') {
                return a.name.localeCompare(b.name, 'pt-BR');
            } else {
                return b.name.localeCompare(a.name, 'pt-BR');
            }
        });
    }, [environments, sortOrder]);

    const handleUpdateEnvironment = async (id: string, updatedData: any, resourceIds: string[]): Promise<void> => {
        await updateEnvironment(id, updatedData, resourceIds);
        setEnvToEdit(null);
        await refreshData();
    };

    const confirmDeleteEnvironment = async () => {
        if (!envToDelete) return;
        setIsDeleting(true);
        try {
            await deleteEnvironment(envToDelete.id);
            setEnvToDelete(null);
            await refreshData();
        } catch (err: any) { alert(err.message); }
        finally { setIsDeleting(false); }
    };

    return (
        <div className="space-y-6">
            <EnvironmentAddForm 
              isOpen={isFormOpen} 
              setIsOpen={setIsFormOpen} 
              types={types} 
              resources={resources} 
              refreshData={refreshData} 
            />
            <div className="bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-300">
                <div className="flex justify-between items-center p-6 cursor-pointer group" onClick={() => setIsListOpen(!isListOpen)}>
                    <div className="flex items-center gap-4">
                        <i className="bi bi-door-open-fill text-2xl text-estacio-blue"></i>
                        <h2 className="text-2xl font-semibold text-gray-800">Ambientes Cadastrados</h2>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
                            }}
                            className="p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-estacio-blue transition-colors"
                            title={sortOrder === 'asc' ? "Ordenar Z-A" : "Ordenar A-Z"}
                            aria-label="Ordenar ambientes por nome"
                        >
                            <i className={`bi ${sortOrder === 'asc' ? 'bi-sort-alpha-down' : 'bi-sort-alpha-up-alt'} text-xl`}></i>
                        </button>
                    </div>
                    <i className={`bi bi-chevron-down text-2xl text-gray-500 transform transition-transform ${isListOpen ? 'rotate-180' : ''}`}></i>
                </div>
                 <div className={`transition-all duration-500 ease-in-out ${isListOpen ? 'max-h-[2000px]' : 'max-h-0'}`}>
                    <div className="px-6 pb-6">
                        <div className="space-y-3 border-t pt-4 border-gray-200">
                            {sortedEnvironments.length > 0 ? sortedEnvironments.map(env => (
                                <div key={env.id} onClick={() => setEnvToView(env)} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                                    <div><p className="font-bold text-gray-800">{env.name} <span className="font-normal text-gray-500">- {env.environment_types?.name}</span></p><p className="text-sm text-gray-600">{env.location} | Recursos: {env.resources?.map(r => r.name).join(', ') || 'N/A'}</p></div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={(e) => { e.stopPropagation(); setEnvToEdit(env); }} className="bg-blue-100 text-blue-600 h-10 w-10 flex items-center justify-center rounded-full" title="Editar" aria-label={`Editar ambiente ${env.name}`}><i className="bi bi-pencil-square"></i></button>
                                        <button onClick={(e) => { e.stopPropagation(); setEnvToDelete(env); }} className="bg-red-100 text-red-600 h-10 w-10 flex items-center justify-center rounded-full" title="Excluir" aria-label={`Excluir ambiente ${env.name}`}><i className="bi bi-trash"></i></button>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-gray-500 py-8">Nenhum ambiente cadastrado.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <ConfirmationModal isOpen={!!envToDelete} onClose={() => setEnvToDelete(null)} onConfirm={confirmDeleteEnvironment} title="Confirmar Exclusão" message={`Tem certeza que deseja excluir o ambiente "${envToDelete?.name}"?`} isConfirming={isDeleting} />
            {envToEdit && <EnvironmentEditModal isOpen={!!envToEdit} onClose={() => setEnvToEdit(null)} environment={envToEdit} onSave={handleUpdateEnvironment} types={types} resources={resources} />}
            {envToView && <EnvironmentDetailsModal isOpen={!!envToView} onClose={() => setEnvToView(null)} environment={envToView} />}
        </div>
    );
};


// --- Modals ---

const ItemEditModal: React.FC<{ isOpen: boolean; onClose: () => void; item: {id: string, name: string}; title: string; onSave: (id: string, name: string) => void; isSaving: boolean }> = ({isOpen, onClose, item, title, onSave, isSaving}) => {
    const [name, setName] = useState(item.name);
    useEffect(() => { setName(item.name) }, [item]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(item.id, name);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <FormField label="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button type="button" onClick={onClose} disabled={isSaving} className="bg-gray-200 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" disabled={isSaving || !name.trim()} className="flex items-center justify-center w-32 bg-estacio-blue text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">{isSaving ? <Spinner /> : "Salvar"}</button>
                </div>
            </form>
        </Modal>
    )
};

const EnvironmentAddForm: React.FC<{ isOpen: boolean, setIsOpen: (b: boolean) => void, types: EnvironmentType[], resources: Resource[], refreshData: () => Promise<void> }> = ({ isOpen, setIsOpen, types, resources, refreshData }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [error, setError] = useState('');
    const [formState, setFormState] = useState({ name: '', location: '', type_id: ''});
    const [selectedResources, setSelectedResources] = useState<string[]>([]);
    
    const handleAddEnvironment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.name || !formState.type_id) {
            setError('Nome e tipo são obrigatórios.');
            return;
        }
        setIsAdding(true);
        setError('');
        try {
            await addEnvironment({ ...formState }, selectedResources);
            setFormState({ name: '', location: '', type_id: '' });
            setSelectedResources([]);
            setIsOpen(false);
            await refreshData();
        } catch(err: any) { setError(err.message); }
        finally { setIsAdding(false); }
    };
    
    return (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-300">
            <div className="flex justify-between items-center p-6 cursor-pointer group" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex items-center gap-4"><i className="bi bi-plus-circle-fill text-2xl text-estacio-blue"></i><h2 className="text-2xl font-semibold text-gray-800">Novo Ambiente</h2></div>
                <i className={`bi bi-chevron-down text-2xl text-gray-500 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
            </div>
            <div className={`transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px]' : 'max-h-0'}`}>
                <div className="px-6 pb-6"><form onSubmit={handleAddEnvironment} className="space-y-4 border-t pt-6 border-gray-200">
                    <FormField label="Nome do Ambiente" name="name" value={formState.name} onChange={(e) => setFormState(p => ({ ...p, name: e.target.value }))} required />
                    <FormField label="Localização" name="location" value={formState.location} onChange={(e) => setFormState(p => ({ ...p, location: e.target.value }))} />
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label><select name="type_id" value={formState.type_id} onChange={(e) => setFormState(p => ({...p, type_id: e.target.value}))} required className="w-full p-2 border border-gray-300 rounded-md"><option value="">Selecione um tipo</option>{types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Recursos</label><div className="flex flex-wrap gap-2 p-2 border rounded-md">{resources.map(r => <label key={r.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedResources.includes(r.id)} onChange={() => setSelectedResources(p => p.includes(r.id) ? p.filter(id => id !== r.id) : [...p, r.id])} />{r.name}</label>)}</div></div>
                    <div className="pt-2"><button type="submit" disabled={isAdding} className="w-full flex justify-center items-center gap-3 bg-estacio-blue text-white font-bold py-3 rounded-lg disabled:opacity-50">{isAdding ? <Spinner /> : "Adicionar Ambiente"}</button>{error && <p className="text-red-500 text-center mt-3">{error}</p>}</div>
                </form></div>
            </div>
        </div>
    );
}

const EnvironmentEditModal: React.FC<{ isOpen: boolean, onClose: () => void, environment: Environment, onSave: Function, types: EnvironmentType[], resources: Resource[] }> = ({ isOpen, onClose, environment, onSave, types, resources }) => {
    const [formState, setFormState] = useState({ name: '', location: '', type_id: '' });
    const [selectedResources, setSelectedResources] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (environment) {
            setFormState({ name: environment.name, location: environment.location || '', type_id: environment.type_id });
            setSelectedResources(environment.resources.map(r => r.id));
            setError('');
        }
    }, [environment, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!formState.name || !formState.type_id) {
            setError('Nome e tipo são obrigatórios.'); return;
        }
        setIsSaving(true);
        try { await onSave(environment.id, formState, selectedResources); }
        catch (err: any) { setError(err.message); }
        finally { setIsSaving(false); }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Editar: ${environment.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
                <FormField label="Nome do Ambiente" value={formState.name} onChange={(e) => setFormState(p => ({ ...p, name: e.target.value }))} required />
                <FormField label="Localização" value={formState.location} onChange={(e) => setFormState(p => ({ ...p, location: e.target.value }))} />
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label><select value={formState.type_id} onChange={(e) => setFormState(p => ({...p, type_id: e.target.value}))} required className="w-full p-2 border border-gray-300 rounded-md"><option value="">Selecione um tipo</option>{types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Recursos</label><div className="flex flex-wrap gap-2 p-2 border rounded-md">{resources.map(r => <label key={r.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedResources.includes(r.id)} onChange={() => setSelectedResources(p => p.includes(r.id) ? p.filter(id => id !== r.id) : [...p, r.id])} />{r.name}</label>)}</div></div>
                {error && <p className="text-red-500 text-center">{error}</p>}
                <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={onClose} disabled={isSaving} className="bg-gray-200 font-bold py-2 px-4 rounded-lg">Cancelar</button><button type="submit" disabled={isSaving} className="flex justify-center items-center w-32 bg-estacio-blue text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">{isSaving ? <Spinner /> : "Salvar"}</button></div>
            </form>
        </Modal>
    );
};

const UserDetailsModal: React.FC<{ isOpen: boolean; onClose: () => void; user: User }> = ({ isOpen, onClose, user }) => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        if(isOpen) { setIsLoading(true); getUserReservations(user.id).then(setReservations).catch(console.error).finally(() => setIsLoading(false)); }
    }, [isOpen, user.id]);
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes de ${user.name}`}>
            <div className="max-h-[75vh] overflow-y-auto pr-2 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 border-b pb-4"><DetailItem label="Nome" value={user.name} /><DetailItem label="E-mail" value={user.email} /><DetailItem label="Perfil" value={<span className="capitalize font-semibold">{user.role}</span>} /><DetailItem label="Membro Desde" value={new Date(user.created_at).toLocaleDateString('pt-BR')} /></div>
                <div><h4 className="text-lg font-semibold mb-2">Histórico de Reservas</h4>{isLoading ? <Spinner/> : <ul className="space-y-2">{reservations.length > 0 ? reservations.map(res => <li key={res.id} className="bg-blue-50 p-3 rounded-md text-sm"><p className="font-bold">{res.environments?.name}</p><p>{new Date(res.start_time).toLocaleString('pt-BR')} - {new Date(res.end_time).toLocaleTimeString('pt-BR')}</p></li>) : <p className="text-center p-4">Nenhuma reserva.</p>}</ul>}</div>
            </div>
        </Modal>
    );
};

const UserEditModal: React.FC<{ isOpen: boolean, onClose: () => void, user: User, onSave: (userId: string, data: any) => Promise<void> }> = ({ isOpen, onClose, user, onSave }) => {
    const [formState, setFormState] = useState({ name: '', email: '', role: UserRole.Aluno, password: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => { if (user) { setFormState({ name: user.name, email: user.email, role: user.role, password: '' }); setError(''); } }, [user, isOpen]);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setError('');
        if (!formState.name || !formState.email) { setError('Nome e e-mail são obrigatórios.'); return; }
        const updateData: any = {};
        if (formState.name !== user.name) updateData.name = formState.name;
        if (formState.email !== user.email) updateData.email = formState.email;
        if (formState.role !== user.role) updateData.role = formState.role;
        if (formState.password) { if (formState.password.length < 3) { setError('A nova senha deve ter pelo menos 3 caracteres.'); return; } updateData.password = formState.password; }
        if (Object.keys(updateData).length === 0) { setError("Nenhuma alteração foi feita."); return; }
        setIsSaving(true);
        try { await onSave(user.id, updateData); } catch (err: any) { setError(err.message); } finally { setIsSaving(false); }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Editar Usuário: ${user.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
                <FormField label="Nome Completo" value={formState.name} onChange={(e) => setFormState(p => ({ ...p, name: e.target.value }))} required />
                <FormField label="E-mail" type="email" value={formState.email} onChange={(e) => setFormState(p => ({ ...p, email: e.target.value }))} required />
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label><select value={formState.role} onChange={(e) => setFormState(p => ({...p, role: e.target.value as UserRole}))} required className="w-full p-2 border rounded-md"><option value={UserRole.Aluno}>Aluno</option><option value={UserRole.Professor}>Professor</option><option value={UserRole.Coordenador}>Coordenador</option><option value={UserRole.Admin}>Administrador</option></select></div>
                <FormField label="Nova Senha (opcional)" type="password" placeholder="Deixe em branco para não alterar" value={formState.password} onChange={(e) => setFormState(p => ({ ...p, password: e.target.value }))} />
                {error && <p className="text-red-500 text-center">{error}</p>}
                <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={onClose} disabled={isSaving} className="bg-gray-200 font-bold py-2 px-4 rounded-lg">Cancelar</button><button type="submit" disabled={isSaving} className="flex justify-center items-center w-32 bg-estacio-blue text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">{isSaving ? <Spinner /> : "Salvar"}</button></div>
            </form>
        </Modal>
    );
};

const UserAddModal: React.FC<{ isOpen: boolean, onClose: () => void, onSave: Function }> = ({ isOpen, onClose, onSave }) => {
    const [formState, setFormState] = useState({ name: '', email: '', role: UserRole.Aluno, password: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => { if (isOpen) { setFormState({ name: '', email: '', role: UserRole.Aluno, password: '' }); setError(''); setIsSaving(false); } }, [isOpen]);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setError('');
        if (!formState.name || !formState.email || !formState.password) { setError('Todos os campos são obrigatórios.'); return; }
        if (formState.password.length < 3) { setError('A senha deve ter pelo menos 3 caracteres.'); return; }
        setIsSaving(true);
        try { await onSave(formState); } catch (err: any) { setError(err.message); } finally { setIsSaving(false); }
    };
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Novo Usuário">
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
                <FormField label="Nome Completo" value={formState.name} onChange={(e) => setFormState(p => ({...p, name: e.target.value}))} required />
                <FormField label="E-mail" type="email" value={formState.email} onChange={(e) => setFormState(p => ({...p, email: e.target.value}))} required />
                <FormField label="Senha" type="password" value={formState.password} onChange={(e) => setFormState(p => ({...p, password: e.target.value}))} required />
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label><select value={formState.role} onChange={(e) => setFormState(p => ({...p, role: e.target.value as UserRole}))} required className="w-full p-2 border rounded-md"><option value={UserRole.Aluno}>Aluno</option><option value={UserRole.Professor}>Professor</option><option value={UserRole.Coordenador}>Coordenador</option><option value={UserRole.Admin}>Administrador</option></select></div>
                {error && <p className="text-red-500 text-center">{error}</p>}
                <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={onClose} disabled={isSaving} className="bg-gray-200 font-bold py-2 px-4 rounded-lg">Cancelar</button><button type="submit" disabled={isSaving} className="flex justify-center items-center w-32 bg-estacio-blue text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">{isSaving ? <Spinner /> : "Cadastrar"}</button></div>
            </form>
        </Modal>
    );
};

const EnvironmentDetailsModal: React.FC<{ isOpen: boolean; onClose: () => void; environment: Environment; }> = ({ isOpen, onClose, environment }) => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        if(isOpen) { setIsLoading(true); getReservationsForEnvironment(environment.id).then(setReservations).catch(console.error).finally(() => setIsLoading(false)); }
    }, [isOpen, environment.id]);
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Detalhes de ${environment.name}`}>
            <div className="max-h-[75vh] overflow-y-auto pr-2 space-y-4">
                <div className="grid grid-cols-2 gap-x-4 border-b pb-4"><DetailItem label="Tipo" value={environment.environment_types?.name} /><DetailItem label="Localização" value={environment.location} /><DetailItem label="Recursos" value={environment.resources?.map(r => r.name).join(', ')} /></div>
                <div><h4 className="text-lg font-semibold text-gray-800 mb-2">Próximas Reservas</h4>{isLoading ? <Spinner/> : <ul className="space-y-2">{reservations.length > 0 ? reservations.map(res => <li key={res.id} className="bg-blue-50 p-3 rounded-md text-sm"><p className="font-bold">{res.users?.name}</p><p>{new Date(res.start_time).toLocaleString('pt-BR')} - {new Date(res.end_time).toLocaleTimeString('pt-BR')}</p></li>) : <p className="text-center p-4">Nenhuma reserva.</p>}</ul>}</div>
            </div>
        </Modal>
    );
};


// --- Calendar Components ---

type CalendarDisplayMode = 'day' | 'week' | 'month' | 'list' | 'resource';

const areDatesSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const CalendarAdminView: React.FC<{ environments: Environment[]; resources: Resource[], allUsers: User[] }> = ({ environments, resources, allUsers }) => {
    const [displayMode, setDisplayMode] = useState<CalendarDisplayMode>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedEnvironmentId, setSelectedEnvironmentId] = useState<string | null>(null);
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [newReservationData, setNewReservationData] = useState<{ date: Date; hour: number } | null>(null);

    const fetchMonthReservations = useCallback(() => {
        setIsLoading(true);
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        getReservationsForMonth(year, month)
            .then(setReservations)
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [currentDate]);

    useEffect(() => {
        fetchMonthReservations();
    }, [fetchMonthReservations]);

    const handleDateChange = (offset: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            if (displayMode === 'day') newDate.setDate(prev.getDate() + offset);
            else if (displayMode === 'week') newDate.setDate(prev.getDate() + offset * 7);
            else newDate.setMonth(prev.getMonth() + offset);
            return newDate;
        });
    };

    const handleTimeSlotClick = (date: Date, hour: number) => {
        const now = new Date();
        const slotDateTime = new Date(date);
        slotDateTime.setHours(hour, 59, 59, 999);
        if (slotDateTime < now) return;

        setNewReservationData({ date, hour });
        setCreateModalOpen(true);
    };

    const getHeaderText = () => {
        if (displayMode === 'day') return currentDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (displayMode === 'week' || displayMode === 'resource') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return `${startOfWeek.toLocaleDateString('pt-BR')} - ${endOfWeek.toLocaleDateString('pt-BR')}`;
        }
        return currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    };

    const viewOptions: { key: CalendarDisplayMode; label: string; icon: string }[] = [
        { key: 'day', label: 'Dia', icon: 'bi-calendar-day' },
        { key: 'week', label: 'Semana', icon: 'bi-calendar-week' },
        { key: 'month', label: 'Mês', icon: 'bi-calendar-month' },
        { key: 'list', label: 'Lista', icon: 'bi-list-ul' },
        { key: 'resource', label: 'Ambiente', icon: 'bi-building' },
    ];
    
    const filteredReservations = selectedEnvironmentId ? reservations.filter(r => r.environment_id === selectedEnvironmentId) : reservations;

    return (
        <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => handleDateChange(-1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Período anterior"><i className="bi bi-chevron-left"></i></button>
                    <button onClick={() => setCurrentDate(new Date())} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors text-sm">Hoje</button>
                    <button onClick={() => handleDateChange(1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Próximo período"><i className="bi bi-chevron-right"></i></button>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-center text-gray-800 capitalize">{getHeaderText()}</h3>
                <div className="flex justify-center border border-gray-200 rounded-lg p-1 bg-gray-50">
                    {viewOptions.map(opt => (
                        <button key={opt.key} onClick={() => setDisplayMode(opt.key)} className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all duration-300 ${displayMode === opt.key ? 'bg-estacio-blue text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`} title={opt.label}>
                            <i className={`${opt.icon} sm:mr-2`}></i><span className="hidden sm:inline">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {displayMode === 'resource' && (
                <div className="mb-4">
                    <select onChange={(e) => setSelectedEnvironmentId(e.target.value)} value={selectedEnvironmentId || ''} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-estacio-blue focus:border-estacio-blue">
                        <option value="">Selecione o Ambiente para filtrar</option>
                        {environments.map(env => <option key={env.id} value={env.id}>{env.name}</option>)}
                    </select>
                </div>
            )}
            
            {isLoading ? <div className="h-96 flex items-center justify-center"><Spinner /></div> : (
                <div className="min-h-96">
                    {displayMode === 'day' && <DayView date={currentDate} reservations={reservations} onTimeSlotClick={handleTimeSlotClick} />}
                    {displayMode === 'week' && <WeekView date={currentDate} reservations={reservations} />}
                    {displayMode === 'month' && <MonthView date={currentDate} reservations={reservations} onDateClick={(d) => { setDisplayMode('day'); setCurrentDate(d); }} />}
                    {displayMode === 'list' && <ListView reservations={reservations} />}
                    {displayMode === 'resource' && <WeekView date={currentDate} reservations={filteredReservations} />}
                </div>
            )}
            {isCreateModalOpen && newReservationData && (
                <CreateReservationAdminModal 
                    isOpen={isCreateModalOpen}
                    onClose={() => setCreateModalOpen(false)}
                    initialData={newReservationData}
                    environments={environments}
                    allResources={resources}
                    allReservations={reservations}
                    allUsers={allUsers}
                    onSaveSuccess={() => {
                        setCreateModalOpen(false);
                        fetchMonthReservations();
                    }}
                />
            )}
        </div>
    );
};

const DayView: React.FC<{ date: Date; reservations: Reservation[]; onTimeSlotClick: (date: Date, hour: number) => void; }> = ({ date, reservations, onTimeSlotClick }) => {
    const dayReservations = reservations.filter(r => areDatesSameDay(new Date(r.start_time), date)).sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 7 AM to 10 PM
    const now = new Date();

    const reservationsByHour = dayReservations.reduce((acc, res) => {
        const startHour = new Date(res.start_time).getHours();
        if (!acc[startHour]) {
            acc[startHour] = [];
        }
        acc[startHour].push(res);
        return acc;
    }, {} as Record<number, Reservation[]>);

    return (
        <div className="border rounded-lg p-2 max-h-[60vh] overflow-y-auto">
            {hours.map(hour => {
                const hourReservations = reservationsByHour[hour] || [];
                const slotEndDateTime = new Date(date);
                slotEndDateTime.setHours(hour, 59, 59, 999);
                const isPast = slotEndDateTime < now;

                return (
                    <div 
                        key={hour} 
                        className={`flex border-b last:border-b-0 min-h-[4rem] group ${isPast ? 'bg-gray-100' : ''}`}
                        onClick={() => !isPast && onTimeSlotClick(date, hour)}
                        role="button"
                        aria-disabled={isPast}
                        aria-label={isPast ? `Horário passado: ${hour}:00` : `Agendar para ${hour}:00`}
                    >
                        <div className={`w-20 text-right pr-4 py-2 text-sm border-r flex-shrink-0 ${isPast ? 'text-gray-400' : 'text-gray-500'}`}>{hour}:00</div>
                        <div className={`flex-1 pl-4 py-2 space-y-2 w-full ${isPast ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-blue-50 transition-colors'}`}>
                            {hourReservations.length > 0 ? (
                                hourReservations.map(res => (
                                    <div key={res.id} className="bg-blue-100 text-blue-900 p-2 rounded-md text-xs shadow-sm">
                                        <p className="font-bold">{res.environments?.name}</p>
                                        <p>{new Date(res.start_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} - {new Date(res.end_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                                        <p className="text-xs font-semibold italic">{res.users?.name}</p>
                                    </div>
                                ))
                            ) : (
                                <div className={`h-full flex items-center ${isPast ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 transition-opacity'}`}>
                                    {isPast ? (
                                        <p className="text-sm text-gray-400">Horário indisponível</p>
                                    ) : (
                                        <p className="text-sm text-estacio-blue font-semibold"><i className="bi bi-plus-circle-fill mr-2"></i>Agendar neste horário</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
             {dayReservations.length === 0 && (
                <div className="text-center text-gray-500 py-16">
                    <p>Nenhuma reserva para este dia.</p>
                    <p>Clique em um horário para agendar.</p>
                </div>
            )}
        </div>
    );
};

const WeekView: React.FC<{ date: Date; reservations: Reservation[] }> = ({ date, reservations }) => {
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-7 border rounded-lg overflow-hidden max-h-[70vh] md:max-h-none">
            {Array.from({ length: 7 }).map((_, i) => {
                const day = new Date(startOfWeek);
                day.setDate(day.getDate() + i);
                const dayReservations = reservations.filter(r => areDatesSameDay(new Date(r.start_time), day)).sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

                return (
                    <div key={i} className="border-b md:border-b-0 md:border-r last:border-r-0 p-2">
                        <div className="font-bold text-center mb-2">{weekdays[i]} <span className="text-gray-500">{day.getDate()}</span></div>
                        <div className="space-y-2 h-full md:h-96 overflow-y-auto pr-1">
                             {dayReservations.map(res => (
                                <div key={res.id} className="bg-blue-50 text-blue-800 p-2 rounded-md text-xs shadow-sm">
                                    <p className="font-bold">{res.environments?.name}</p>
                                    <p>{new Date(res.start_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} - {new Date(res.end_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                                    <p className="text-xs font-semibold italic">{res.users?.name}</p>
                                </div>
                            ))}
                            {dayReservations.length === 0 && <div className="h-full flex items-center justify-center"><p className="text-xs text-gray-400">Vazio</p></div>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const MonthView: React.FC<{ date: Date; reservations: Reservation[]; onDateClick: (date: Date) => void; }> = ({ date, reservations, onDateClick }) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    const reservationsByDay = reservations.reduce((acc, res) => {
        const day = new Date(res.start_time).getDate();
        if (!acc[day]) acc[day] = 0;
        acc[day]++;
        return acc;
    }, {} as { [day: number]: number });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <>
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-gray-600 mb-2">
                {weekdays.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {Array(firstDayOfMonth).fill(null).map((_, i) => <div key={`empty-${i}`}></div>)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                    const dayDate = new Date(year, month, day);
                    const isToday = areDatesSameDay(new Date(), dayDate);
                    
                    const dayDateStartOfDay = new Date(year, month, day);
                    dayDateStartOfDay.setHours(0, 0, 0, 0);
                    const isPast = dayDateStartOfDay < today;
                    
                    const hasReservations = !!reservationsByDay[day];

                    return (
                        <button
                            key={day}
                            onClick={() => onDateClick(dayDate)}
                            disabled={isPast}
                            className={`relative h-16 w-full flex items-center justify-center rounded-lg transition-colors ${
                                isPast
                                ? 'bg-gray-100 cursor-not-allowed'
                                : 'hover:bg-gray-100'
                            } ${!hasReservations && isToday ? 'bg-red-50' : 'bg-white'}`}
                        >
                            <span
                                className={`h-8 w-8 flex items-center justify-center rounded-full font-semibold transition-colors ${
                                    isPast
                                    ? 'text-gray-400'
                                    : hasReservations
                                        ? 'bg-highlight-blue text-white'
                                        : isToday
                                        ? 'text-estacio-red'
                                        : 'text-gray-700'
                                }`}
                            >
                                {day}
                            </span>
                        </button>
                    );
                })}
            </div>
        </>
    );
};

const ListView: React.FC<{ reservations: Reservation[] }> = ({ reservations }) => {
    const sortedReservations = [...reservations].sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    
    return (
         <div className="border rounded-lg max-h-[60vh] overflow-y-auto">
            <ul className="divide-y">
                {sortedReservations.length > 0 ? sortedReservations.map(res => (
                     <li key={res.id} className="p-3 hover:bg-gray-50">
                        <p className="font-bold text-gray-800">{res.environments?.name}</p>
                        <p className="text-sm text-gray-600">{new Date(res.start_time).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}</p>
                        <p className="text-sm text-gray-500 italic">Reservado por: {res.users?.name}</p>
                    </li>
                )) : <p className="text-center text-gray-500 py-16">Nenhuma reserva neste mês.</p>}
            </ul>
        </div>
    );
};

interface CreateReservationAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: { date: Date; hour: number };
  environments: Environment[];
  allResources: Resource[];
  allReservations: Reservation[];
  allUsers: User[];
  onSaveSuccess: () => void;
}

const CreateReservationAdminModal: React.FC<CreateReservationAdminModalProps> = ({
  isOpen,
  onClose,
  initialData,
  environments,
  allResources,
  allReservations,
  allUsers,
  onSaveSuccess,
}) => {
  const [formState, setFormState] = useState({
    userId: '',
    environmentId: '',
    startTime: '',
    endTime: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  useEffect(() => {
    if (isOpen && initialData) {
      const { hour } = initialData;
      const startTimeStr = `${hour.toString().padStart(2, '0')}:00`;
      const endTimeStr = `${(hour + 1).toString().padStart(2, '0')}:00`;

      setFormState({
        userId: '',
        environmentId: '',
        startTime: startTimeStr,
        endTime: endTimeStr,
      });
      setError('');
      setIsSaving(false);
      setSelectedResources([]);
      setIsFilterOpen(false);
    }
  }, [isOpen, initialData]);

  const availableEnvironments = useMemo(() => {
    const dateString = initialData.date.toISOString().split('T')[0];
    const startDateTime = new Date(`${dateString}T${formState.startTime}`);
    const endDateTime = new Date(`${dateString}T${formState.endTime}`);

    if (!formState.startTime || !formState.endTime || startDateTime >= endDateTime) {
      return [];
    }

    const occupiedEnvIds = new Set(
      allReservations
        .filter(res => {
          const resStart = new Date(res.start_time);
          const resEnd = new Date(res.end_time);
          return resStart < endDateTime && resEnd > startDateTime;
        })
        .map(res => res.environment_id)
    );

    return environments.filter(env => {
      const isAvailable = !occupiedEnvIds.has(env.id);
      const hasAllResources = selectedResources.every(resourceId =>
        env.resources?.some(r => r.id === resourceId)
      );
      return isAvailable && hasAllResources;
    });
  }, [formState.startTime, formState.endTime, selectedResources, environments, allReservations, initialData.date]);
  
  useEffect(() => {
    if (availableEnvironments.length > 0) {
      if (!availableEnvironments.some(env => env.id === formState.environmentId)) {
        setFormState(prev => ({ ...prev, environmentId: availableEnvironments[0].id }));
      }
    } else {
        setFormState(prev => ({ ...prev, environmentId: '' }));
    }
  }, [availableEnvironments, formState.environmentId]);


  const handleResourceToggle = (resourceId: string) => {
    setSelectedResources(prev =>
      prev.includes(resourceId)
        ? prev.filter(r => r !== resourceId)
        : [...prev, resourceId]
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formState.userId) {
        setError('Por favor, selecione um usuário para a reserva.');
        return;
    }
    if (!formState.environmentId) {
        setError('Nenhum ambiente disponível com os filtros selecionados.');
        return;
    }
    
    const dateString = initialData.date.toISOString().split('T')[0];
    const startDateTime = new Date(`${dateString}T${formState.startTime}`);
    const endDateTime = new Date(`${dateString}T${formState.endTime}`);

    if (startDateTime >= endDateTime) {
      setError('O horário de término deve ser após o horário de início.');
      return;
    }

    if (startDateTime < new Date()) {
        setError('Não é possível criar uma reserva em uma data ou horário passados.');
        return;
    }

    setIsSaving(true);
    try {
      await createReservation({
        environment_id: formState.environmentId,
        user_id: formState.userId,
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
      });
      onSaveSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Nova Reserva (Admin)">
      <div className="max-h-[80vh] overflow-y-auto pr-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input
              type="text"
              readOnly
              value={initialData.date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">Início</label>
              <input type="time" id="startTime" name="startTime" value={formState.startTime} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-estacio-blue focus:border-estacio-blue" />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
              <input type="time" id="endTime" name="endTime" value={formState.endTime} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-estacio-blue focus:border-estacio-blue" />
            </div>
          </div>
          
           <div>
              <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
              <select id="userId" name="userId" value={formState.userId} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-estacio-blue focus:border-estacio-blue">
                <option value="">Selecione um usuário...</option>
                {allUsers.map(user => (
                  <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                ))}
              </select>
            </div>
          
          {allResources.length > 0 && (
            <div className="bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-center p-3 cursor-pointer group" onClick={() => setIsFilterOpen(!isFilterOpen)} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsFilterOpen(!isFilterOpen)} aria-expanded={isFilterOpen}>
                <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-700">Filtrar por Recursos</h4>
                    {selectedResources.length > 0 && ( <span className="bg-estacio-blue text-white text-xs font-bold h-5 w-5 rounded-full flex items-center justify-center">{selectedResources.length}</span> )}
                </div>
                <i className={`bi bi-chevron-down text-xl text-gray-500 transform transition-transform duration-300 group-hover:text-estacio-blue ${isFilterOpen ? 'rotate-180' : ''}`}></i>
              </div>
              <div className={`transition-all duration-300 ease-in-out overflow-y-auto ${isFilterOpen ? 'max-h-60' : 'max-h-0'}`}>
                  <div className="p-3 border-t border-gray-200"><div className="flex flex-wrap gap-2">
                      {allResources.map(resource => (
                          <button key={resource.id} type="button" onClick={() => handleResourceToggle(resource.id)} className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${selectedResources.includes(resource.id) ? 'bg-estacio-blue text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                          {resource.name}
                          </button>
                      ))}
                  </div></div>
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
                <label htmlFor="environmentId" className="block text-sm font-medium text-gray-700">Ambiente</label>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${availableEnvironments.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {availableEnvironments.length} disponível(is)
                </span>
            </div>
            <select id="environmentId" name="environmentId" value={formState.environmentId} onChange={handleInputChange} required disabled={availableEnvironments.length === 0} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-estacio-blue focus:border-estacio-blue disabled:bg-gray-100 disabled:cursor-not-allowed">
              {availableEnvironments.length > 0 ? ( availableEnvironments.map(env => ( <option key={env.id} value={env.id}>{env.name}</option> )) ) : ( <option value="">Nenhum ambiente disponível</option> )}
            </select>
          </div>
          
          {error && <p className="text-red-500 text-center text-sm font-semibold bg-red-100 p-2 rounded-md">{error}</p>}
          
          <div className="flex justify-end gap-3 pt-4 border-t mt-4">
            <button type="button" onClick={onClose} disabled={isSaving} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
            <button type="submit" disabled={isSaving || !formState.environmentId} className="flex items-center justify-center gap-2 w-48 bg-estacio-red text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving ? <Spinner /> : "Confirmar Reserva"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default AdminScreen;