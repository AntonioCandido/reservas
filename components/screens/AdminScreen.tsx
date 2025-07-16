import React, { useState, useEffect, useCallback } from 'react';
import { 
  getAllEnvironments, addEnvironment, deleteEnvironment, updateEnvironment,
  getAllUsers, updateUserByAdmin, createUserByAdmin, 
  getAllEnvironmentTypes, addEnvironmentType, updateEnvironmentType, deleteEnvironmentType,
  getAllResources, addResource, updateResource, deleteResource,
  getReservationsForEnvironment, getUserReservations
} from '../../services/supabase.ts';
import type { AppContextType, Environment, User, Reservation, EnvironmentType, Resource } from '../../types';
import { Page, UserRole } from '../../constants';
import Spinner from '../common/Spinner';
import ConfirmationModal from '../common/ConfirmationModal';
import Modal from '../common/Modal';
import ProfileModal from '../common/ProfileModal';

type AdminView = 'environments' | 'users' | 'types' | 'resources';

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
        case 'users': return <UsersAdminView users={users} refreshData={fetchAllData} />;
        case 'types': return <TypesAdminView types={types} refreshData={fetchAllData} />;
        case 'resources': return <ResourcesAdminView resources={resources} refreshData={fetchAllData} />;
        default: return null;
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Manager</h1>
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

      <div className="flex border border-gray-200 rounded-lg p-1 bg-gray-50 mb-6 max-w-2xl mx-auto">
        <button onClick={() => setView('environments')} className={`w-1/4 py-2 text-sm font-bold rounded-md transition-all duration-300 ${view === 'environments' ? 'bg-estacio-blue text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}><i className="bi bi-door-open-fill mr-2"></i> Ambientes</button>
        <button onClick={() => setView('users')} className={`w-1/4 py-2 text-sm font-bold rounded-md transition-all duration-300 ${view === 'users' ? 'bg-estacio-blue text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}><i className="bi bi-people-fill mr-2"></i> Usuários</button>
        <button onClick={() => setView('types')} className={`w-1/4 py-2 text-sm font-bold rounded-md transition-all duration-300 ${view === 'types' ? 'bg-estacio-blue text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}><i className="bi bi-tags-fill mr-2"></i> Tipos</button>
        <button onClick={() => setView('resources')} className={`w-1/4 py-2 text-sm font-bold rounded-md transition-all duration-300 ${view === 'resources' ? 'bg-estacio-blue text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}><i className="bi bi-tools mr-2"></i> Recursos</button>
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
            <div className="flex items-center gap-4 mb-4">
                <i className={`bi ${icon} text-2xl text-estacio-blue`}></i>
                <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
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
                {items.length > 0 ? items.map(item => (
                    <div key={item.id} className="bg-gray-50 p-3 rounded-lg flex justify-between items-center">
                        <p className="font-semibold text-gray-700">{item.name}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setItemToEdit(item)} className="bg-blue-100 text-blue-600 h-8 w-8 flex items-center justify-center rounded-full"><i className="bi bi-pencil-square"></i></button>
                            <button onClick={() => setItemToDelete(item)} className="bg-red-100 text-red-600 h-8 w-8 flex items-center justify-center rounded-full"><i className="bi bi-trash"></i></button>
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

const UsersAdminView: React.FC<{ users: User[], refreshData: () => Promise<void> }> = ({ users, refreshData }) => {
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [userToView, setUserToView] = useState<User | null>(null);
    const [isAddingUser, setIsAddingUser] = useState(false);
    
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
    
    return (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden p-6">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <i className="bi bi-people-fill text-2xl text-estacio-blue"></i>
                    <h2 className="text-2xl font-semibold text-gray-800">Usuários Cadastrados</h2>
                </div>
                <button onClick={() => setIsAddingUser(true)} className="flex items-center gap-2 bg-estacio-blue text-white font-bold py-2 px-3 rounded-lg hover:bg-opacity-90 text-sm">
                    <i className="bi bi-person-plus-fill"></i><span>Novo</span>
                </button>
            </div>
            <div className="space-y-3 border-t pt-4 border-gray-200 max-h-[60vh] overflow-y-auto pr-2">
                {users.map(user => (
                    <div key={user.id} onClick={() => setUserToView(user)} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                        <div><p className="font-bold text-gray-800">{user.name}</p><p className="text-sm text-gray-600">{user.email}</p></div>
                        <div className="flex items-center gap-3"><span className="text-sm font-semibold text-white bg-estacio-red px-3 py-1 rounded-full capitalize">{user.role}</span>
                            <button onClick={(e) => { e.stopPropagation(); setUserToEdit(user); }} className="bg-blue-100 text-blue-600 h-10 w-10 flex items-center justify-center rounded-full"><i className="bi bi-pencil-square"></i></button>
                        </div>
                    </div>
                ))}
            </div>

            {userToView && <UserDetailsModal isOpen={!!userToView} onClose={() => setUserToView(null)} user={userToView} />}
            {userToEdit && <UserEditModal isOpen={!!userToEdit} onClose={() => setUserToEdit(null)} user={userToEdit} onSave={handleUpdateUser} />}
            <UserAddModal isOpen={isAddingUser} onClose={() => setIsAddingUser(false)} onSave={handleAddUser} />
        </div>
    );
};

const EnvironmentsAdminView: React.FC<{ environments: Environment[], types: EnvironmentType[], resources: Resource[], refreshData: () => Promise<void> }> = ({ environments, types, resources, refreshData }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [envToEdit, setEnvToEdit] = useState<Environment | null>(null);
    const [envToDelete, setEnvToDelete] = useState<Environment | null>(null);
    const [envToView, setEnvToView] = useState<Environment | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

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
            <div className="bg-white rounded-xl shadow-xl p-6">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Ambientes Cadastrados</h2>
                <div className="space-y-3 border-t pt-4 border-gray-200">
                    {environments.map(env => (
                        <div key={env.id} onClick={() => setEnvToView(env)} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center gap-4 hover:shadow-md transition-shadow cursor-pointer">
                            <div><p className="font-bold text-gray-800">{env.name} <span className="font-normal text-gray-500">- {env.environment_types?.name}</span></p><p className="text-sm text-gray-600">{env.location} | Recursos: {env.resources?.map(r => r.name).join(', ') || 'N/A'}</p></div>
                            <div className="flex items-center gap-2"><button onClick={(e) => { e.stopPropagation(); setEnvToEdit(env); }} className="bg-blue-100 text-blue-600 h-10 w-10 flex items-center justify-center rounded-full"><i className="bi bi-pencil-square"></i></button><button onClick={(e) => { e.stopPropagation(); setEnvToDelete(env); }} className="bg-red-100 text-red-600 h-10 w-10 flex items-center justify-center rounded-full"><i className="bi bi-trash"></i></button></div>
                        </div>
                    ))}
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

export default AdminScreen;
