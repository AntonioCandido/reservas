


import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  getAllEnvironments, addEnvironment, deleteEnvironment, updateEnvironment,
  getAllUsers, updateUserByAdmin, createUserByAdmin, deleteUserByAdmin,
  getAllEnvironmentTypes, addEnvironmentType, updateEnvironmentType, deleteEnvironmentType,
  getAllResources, addResource, updateResource, deleteResource,
  getReservationsForEnvironment, getUserReservations, getReservationsForMonth, createReservations, cancelReservation, updateReservation,
  getBackupData, restoreBackupData
} from '../../services/supabase.ts';
import type { AppContextType, Environment, User, Reservation, EnvironmentType, Resource } from '../../types';
import { Page, UserRole } from '../../constants';
import Spinner from '../common/Spinner';
import ConfirmationModal from '../common/ConfirmationModal';
import Modal from '../common/Modal';
import ProfileModal from '../common/ProfileModal';

type AdminView = 'calendar' | 'environments' | 'users' | 'types' | 'resources' | 'backup';

const FormField = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement | HTMLSelectElement> & { as?: 'input' | 'select', children?: React.ReactNode }) => (
    <div>
        <label htmlFor={props.id || props.name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {props.as === 'select' ? (
             <select {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-estacio-blue focus:border-estacio-blue">
                {props.children}
             </select>
        ) : (
            <input {...(props as React.InputHTMLAttributes<HTMLInputElement>)} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-estacio-blue focus:border-estacio-blue" />
        )}
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
    }
    finally {
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
        case 'backup': return <BackupRestoreView refreshData={fetchAllData} />;
        default: return null;
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <header className="flex justify-between items-center mb-8 non-printable">
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

      <div className="mb-8 non-printable">
        <nav className="flex justify-around bg-gray-100 rounded-lg p-1" aria-label="Tabs de Gestão">
          <button
            onClick={() => setView('environments')}
            className={`flex-1 flex flex-col items-center justify-center py-2 font-semibold transition-all duration-300 ease-in-out rounded-md ${
              view === 'environments'
                ? 'bg-estacio-blue text-white shadow'
                : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            }`}
            aria-current={view === 'environments' ? 'page' : undefined}
          >
            <i className="bi bi-door-open-fill text-2xl"></i>
            <span className="text-xs mt-1">Ambientes</span>
          </button>
          <button
            onClick={() => setView('users')}
            className={`flex-1 flex flex-col items-center justify-center py-2 font-semibold transition-all duration-300 ease-in-out rounded-md ${
              view === 'users'
                ? 'bg-estacio-blue text-white shadow'
                : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            }`}
            aria-current={view === 'users' ? 'page' : undefined}
          >
            <i className="bi bi-people-fill text-2xl"></i>
            <span className="text-xs mt-1">Usuários</span>
          </button>
          <button
            onClick={() => setView('types')}
            className={`flex-1 flex flex-col items-center justify-center py-2 font-semibold transition-all duration-300 ease-in-out rounded-md ${
              view === 'types'
                ? 'bg-estacio-blue text-white shadow'
                : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            }`}
            aria-current={view === 'types' ? 'page' : undefined}
          >
            <i className="bi bi-tags-fill text-2xl"></i>
            <span className="text-xs mt-1">Tipos</span>
          </button>
          <button
            onClick={() => setView('resources')}
            className={`flex-1 flex flex-col items-center justify-center py-2 font-semibold transition-all duration-300 ease-in-out rounded-md ${
              view === 'resources'
                ? 'bg-estacio-blue text-white shadow'
                : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            }`}
            aria-current={view === 'resources' ? 'page' : undefined}
          >
            <i className="bi bi-tools text-2xl"></i>
            <span className="text-xs mt-1">Recursos</span>
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex-1 flex flex-col items-center justify-center py-2 font-semibold transition-all duration-300 ease-in-out rounded-md ${
              view === 'calendar'
                ? 'bg-estacio-blue text-white shadow'
                : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            }`}
            aria-current={view === 'calendar' ? 'page' : undefined}
          >
            <i className="bi bi-calendar3-fill text-2xl"></i>
            <span className="text-xs mt-1">Calendário</span>
          </button>
          <button
            onClick={() => setView('backup')}
            className={`flex-1 flex flex-col items-center justify-center py-2 font-semibold transition-all duration-300 ease-in-out rounded-md ${
              view === 'backup'
                ? 'bg-estacio-blue text-white shadow'
                : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
            }`}
            aria-current={view === 'backup' ? 'page' : undefined}
          >
            <i className="bi bi-hdd-stack-fill text-2xl"></i>
            <span className="text-xs mt-1">Backup</span>
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

const LayoutAdminView: React.FC<{ environments: Environment[], allResources: Resource[] }> = ({ environments, allResources }) => {
    const [floorSortOrder, setFloorSortOrder] = useState<'asc' | 'desc'>('asc');
    const [openFloors, setOpenFloors] = useState<Record<string, boolean>>({});
    const [selectedResources, setSelectedResources] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const handleResourceToggle = (resourceId: string) => {
        setSelectedResources(prev =>
            prev.includes(resourceId)
                ? prev.filter(id => id !== resourceId)
                : [...prev, resourceId]
        );
    };

    const handleToggleFloor = (floor: string) => {
        setOpenFloors(prev => ({ ...prev, [floor]: !prev[floor] }));
    };

    const getFloorFromLocation = (location: string | null): string => {
        if (!location) return 'Andar Desconhecido';
        const match = location.match(/(\d+º\s*andar|térreo)/i);
        if (match) {
            const floor = match[0].toLowerCase();
            if (floor === 'térreo') return 'Térreo';
            return floor.charAt(0).toUpperCase() + floor.slice(1);
        }
        return 'Andar Desconhecido';
    };
    
    const filteredEnvironments = useMemo(() => {
        if (selectedResources.length === 0) return environments;
        return environments.filter(env =>
            selectedResources.every(resId =>
                env.resources.some(envRes => envRes.id === resId)
            )
        );
    }, [environments, selectedResources]);
    
    const environmentsByFloor = useMemo(() => {
        return filteredEnvironments.reduce((acc, env) => {
            const floor = getFloorFromLocation(env.location);
            if (!acc[floor]) {
                acc[floor] = [];
            }
            acc[floor].push(env);
            return acc;
        }, {} as Record<string, Environment[]>);
    }, [filteredEnvironments]);

    const sortedFloors = useMemo(() => {
        return Object.keys(environmentsByFloor).sort((a, b) => {
            const getFloorNumber = (floorStr: string) => {
                if (floorStr.toLowerCase() === 'térreo') return 0;
                if (floorStr.toLowerCase() === 'andar desconhecido') return 999;
                const match = floorStr.match(/(\d+)/);
                return match ? parseInt(match[0], 10) : 998;
            };
            const numA = getFloorNumber(a);
            const numB = getFloorNumber(b);
            return floorSortOrder === 'asc' ? numA - numB : numB - numA;
        });
    }, [environmentsByFloor, floorSortOrder]);

    useEffect(() => {
        const initialFloorsState = sortedFloors.reduce((acc, floor) => {
            acc[floor] = false; // Start all floors closed
            return acc;
        }, {} as Record<string, boolean>);
        setOpenFloors(initialFloorsState);
    }, [environments]); // This dependency is simplified; it resets when the base data changes.

    return (
        <div className="bg-white rounded-xl shadow-xl p-6 non-printable">
            <div className="flex items-center gap-3 mb-4">
                <i className="bi bi-map-fill text-2xl text-estacio-blue"></i>
                <h2 className="text-2xl font-semibold text-gray-800">Layout dos Ambientes</h2>
                <button
                    onClick={() => setFloorSortOrder(p => p === 'asc' ? 'desc' : 'asc')}
                    className="p-1 rounded-full text-gray-500 hover:bg-gray-200 hover:text-estacio-blue transition-colors"
                    title={floorSortOrder === 'asc' ? "Ordenar Descendente" : "Ordenar Ascendente"}
                    aria-label="Ordenar andares"
                >
                    <i className={`bi ${floorSortOrder === 'asc' ? 'bi-sort-numeric-down' : 'bi-sort-numeric-up-alt'} text-xl`}></i>
                </button>
            </div>
            
             <div className="bg-gray-50 rounded-lg border mb-6">
                <div
                    className="flex justify-between items-center p-4 cursor-pointer group"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    role="button"
                    aria-expanded={isFilterOpen}
                >
                    <div className="flex items-center gap-3">
                         <i className="bi bi-filter-circle-fill text-xl text-estacio-blue"></i>
                        <h3 className="font-semibold text-gray-800">Filtrar por Recursos</h3>
                        {selectedResources.length > 0 && (
                            <span className="bg-estacio-blue text-white text-xs font-bold h-5 w-5 rounded-full flex items-center justify-center">
                                {selectedResources.length}
                            </span>
                        )}
                    </div>
                    <i className={`bi bi-chevron-down text-2xl text-gray-500 transform transition-transform duration-300 group-hover:text-estacio-blue ${isFilterOpen ? 'rotate-180' : ''}`}></i>
                </div>

                <div className={`grid transition-all duration-500 ease-in-out ${isFilterOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                    <div className="overflow-hidden">
                        <div className="p-4 border-t border-gray-200">
                             {allResources.length > 0 ? (
                                <div className="flex flex-wrap gap-2 items-center">
                                    {allResources.map(resource => (
                                        <button
                                            key={resource.id}
                                            type="button"
                                            onClick={() => handleResourceToggle(resource.id)}
                                            className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${
                                                selectedResources.includes(resource.id)
                                                    ? 'bg-estacio-blue text-white shadow'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        >
                                            {resource.name}
                                        </button>
                                    ))}
                                    {selectedResources.length > 0 && (
                                        <button
                                            onClick={() => setSelectedResources([])}
                                            className="text-sm text-estacio-red hover:underline ml-auto font-semibold"
                                            title="Limpar filtros"
                                        >
                                            Limpar Filtros
                                        </button>
                                    )}
                                </div>
                            ) : <p className="text-sm text-gray-500">Nenhum recurso cadastrado para filtrar.</p>}
                        </div>
                    </div>
                </div>
            </div>

            {sortedFloors.length > 0 ? (
                <div className="space-y-4">
                    {sortedFloors.map(floor => {
                        const isFloorOpen = openFloors[floor] ?? false;
                        return (
                            <div key={floor} className="border-t pt-4 first:border-t-0">
                                <div
                                    onClick={() => handleToggleFloor(floor)}
                                    className="flex justify-between items-center cursor-pointer group"
                                    role="button"
                                    aria-expanded={isFloorOpen}
                                    aria-controls={`floor-content-${floor.replace(/\s+/g, '-')}`}
                                >
                                    <h3 className="text-xl font-bold text-gray-700 capitalize group-hover:text-estacio-blue transition-colors">{floor}</h3>
                                    <i className={`bi bi-chevron-down text-2xl text-gray-500 transform transition-transform duration-300 group-hover:text-estacio-blue ${isFloorOpen ? 'rotate-180' : ''}`}></i>
                                </div>
                                
                                <div
                                    id={`floor-content-${floor.replace(/\s+/g, '-')}`}
                                    className={`grid transition-all duration-500 ease-in-out ${isFloorOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                                >
                                    <div className="overflow-hidden">
                                        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                            {environmentsByFloor[floor].map(env => (
                                                <div key={env.id} className="border rounded-lg p-4 bg-gray-50 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col h-full">
                                                    <div className="flex-grow">
                                                        <h4 className="font-bold text-lg text-estacio-blue">{env.name}</h4>
                                                        <p className="text-sm text-gray-500 mb-3">{env.environment_types?.name}</p>
                                                        <div className="text-xs text-gray-600">
                                                            <p className="font-semibold mb-1">Recursos:</p>
                                                            <ul className="space-y-1">
                                                                {env.resources.length > 0
                                                                    ? env.resources.map(r => 
                                                                        <li key={r.id} className="flex items-center gap-2">
                                                                            <i className="bi bi-check-circle-fill text-green-500"></i>
                                                                            <span>{r.name}</span>
                                                                        </li>
                                                                    )
                                                                    : <li className="text-gray-400 italic">Nenhum recurso.</li>
                                                                }
                                                            </ul>
                                                        </div>
                                                    </div>
                                                    <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-400">
                                                        <i className="bi bi-geo-alt-fill mr-1"></i> {env.location || "Localização não informada"}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center text-gray-500 py-16">
                    <i className="bi bi-search text-4xl mb-3"></i>
                    <p className="font-semibold">Nenhum ambiente encontrado.</p>
                    <p className="text-sm">Tente ajustar seus filtros ou cadastre novos ambientes.</p>
                </div>
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
        <div className="bg-white rounded-xl shadow-xl overflow-hidden p-6 non-printable">
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
        <div className="bg-white rounded-xl shadow-xl overflow-hidden p-6 non-printable">
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
            <div className="bg-white rounded-xl shadow-xl overflow-hidden non-printable">
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
                        <div className="space-y-3 border-t pt-4 border-gray-200 max-h-[60vh] overflow-y-auto pr-2">
                            {sortedEnvironments.length > 0 ? sortedEnvironments.map(env => (
                                <div 
                                    key={env.id} 
                                    onClick={() => setEnvToView(env)} 
                                    className="bg-gray-50 p-4 rounded-lg hover:shadow-lg hover:border-estacio-blue border border-transparent transition-all duration-300 cursor-pointer flex justify-between items-center"
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setEnvToView(env)}
                                >
                                  <div>
                                    <p className="font-bold text-gray-800">{env.name} <span className="font-normal text-gray-600">- {env.environment_types?.name}</span></p>
                                    <p className="text-sm text-gray-500">{env.location}</p>
                                    <p className="text-xs text-gray-500 mt-2">Recursos: {env.resources?.map(r => r.name).join(', ') || 'N/A'}</p>
                                  </div>
                                  <i className="bi bi-chevron-right text-xl text-gray-400 group-hover:text-estacio-blue transition-colors"></i>
                                </div>
                            )) : (
                                <p className="text-center text-gray-500 py-8">Nenhum ambiente cadastrado.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <LayoutAdminView environments={environments} allResources={resources} />
            
            <ConfirmationModal isOpen={!!envToDelete} onClose={() => setEnvToDelete(null)} onConfirm={confirmDeleteEnvironment} title="Confirmar Exclusão" message={`Tem certeza que deseja excluir o ambiente "${envToDelete?.name}"?`} isConfirming={isDeleting} />
            {envToEdit && <EnvironmentEditModal isOpen={!!envToEdit} onClose={() => setEnvToEdit(null)} environment={envToEdit} onSave={handleUpdateEnvironment} types={types} resources={resources} />}
            {envToView && (
                <EnvironmentDetailsModal
                    isOpen={!!envToView}
                    onClose={() => setEnvToView(null)}
                    environment={envToView}
                    onEdit={(env) => {
                        setEnvToView(null);
                        setEnvToEdit(env);
                    }}
                    onDelete={(env) => {
                        setEnvToView(null);
                        setEnvToDelete(env);
                    }}
                />
            )}
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
        <div className="bg-white rounded-xl shadow-xl overflow-hidden transition-all duration-300 non-printable">
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
            setFormState({ name: environment.name, location: environment.location, type_id: environment.type_id });
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

const EnvironmentDetailsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  environment: Environment;
  onEdit: (env: Environment) => void;
  onDelete: (env: Environment) => void;
}> = ({ isOpen, onClose, environment, onEdit, onDelete }) => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        if(isOpen) { setIsLoading(true); getReservationsForEnvironment(environment.id).then(setReservations).catch(console.error).finally(() => setIsLoading(false)); }
    }, [isOpen, environment.id]);
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={'Detalhes do Ambiente'}>
            <>
                <div className="max-h-[70vh] overflow-y-auto pr-2 space-y-4">
                    <div>
                        <h3 className="text-2xl font-bold text-estacio-blue">{environment.name}</h3>
                        <p className="text-lg text-gray-600 mb-4">{environment.environment_types?.name || 'Tipo não definido'}</p>
                        <div className="border-t pt-4 space-y-2">
                            <DetailItem label="Localização" value={environment.location} />
                            <DetailItem label="Recursos" value={environment.resources?.map(r => r.name).join(', ') || 'Nenhum'} />
                        </div>
                    </div>

                    <div>
                        <h4 className="text-lg font-semibold text-gray-800 mb-2 pt-4 border-t">Próximas Reservas</h4>
                        {isLoading ? <Spinner/> : (
                            <ul className="space-y-2 max-h-48 overflow-y-auto">
                                {reservations.length > 0 ? reservations.map(res => (
                                    <li key={res.id} className="bg-blue-50 p-3 rounded-md text-sm">
                                        <p className="font-bold">{res.users?.name}</p>
                                        <p>{new Date(res.start_time).toLocaleString('pt-BR')} - {new Date(res.end_time).toLocaleTimeString('pt-BR')}</p>
                                    </li>
                                )) : <p className="text-center p-4">Nenhuma reserva futura encontrada.</p>}
                            </ul>
                        )}
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                    <button
                        onClick={() => onEdit(environment)}
                        className="flex items-center justify-center gap-2 bg-estacio-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors"
                        aria-label={`Editar ambiente ${environment.name}`}
                    >
                        <i className="bi bi-pencil-square"></i>
                        <span>Editar</span>
                    </button>
                    <button
                        onClick={() => onDelete(environment)}
                        className="flex items-center justify-center gap-2 bg-estacio-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                        aria-label={`Excluir ambiente ${environment.name}`}
                    >
                        <i className="bi bi-trash"></i>
                        <span>Excluir</span>
                    </button>
                </div>
            </>
        </Modal>
    );
};


// --- Calendar Components ---

type CalendarDisplayMode = 'day' | 'week' | 'month' | 'list';

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
    const [reservationToDelete, setReservationToDelete] = useState<Reservation | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const [reservationToEdit, setReservationToEdit] = useState<Reservation | null>(null);

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

    const handleCancelReservation = async () => {
        if (!reservationToDelete) return;
        setIsCancelling(true);
        try {
            await cancelReservation(reservationToDelete.id);
            setReservationToDelete(null);
            fetchMonthReservations();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsCancelling(false);
        }
    };

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
        const slotStartDateTime = new Date(date);
        slotStartDateTime.setHours(hour, 0, 0, 0);
        if (slotStartDateTime < now) return;

        setNewReservationData({ date, hour });
        setCreateModalOpen(true);
    };

    const getHeaderText = () => {
        if (displayMode === 'day') return currentDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (displayMode === 'week') {
            const startOfWeek = new Date(currentDate);
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return `${startOfWeek.toLocaleDateString('pt-BR')} - ${endOfWeek.toLocaleDateString('pt-BR')}`;
        }
        return currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    };

    const viewOptions: { key: CalendarDisplayMode; label: string; icon: string; disabled?: boolean }[] = [
        { key: 'day', label: 'Dia', icon: 'bi-calendar-day' },
        { key: 'week', label: 'Semana', icon: 'bi-calendar-week' },
        { key: 'month', label: 'Mês', icon: 'bi-calendar-month' },
        { key: 'list', label: 'Agenda', icon: 'bi-list-ul' },
    ];
    
    const filteredReservations = selectedEnvironmentId ? reservations.filter(r => r.environment_id === selectedEnvironmentId) : reservations;

    return (
        <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4 non-printable">
                <div className="flex items-center gap-2">
                    <button onClick={() => handleDateChange(-1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Período anterior"><i className="bi bi-chevron-left"></i></button>
                    <button onClick={() => setCurrentDate(new Date())} className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-colors text-sm">Hoje</button>
                    <button onClick={() => handleDateChange(1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label="Próximo período"><i className="bi bi-chevron-right"></i></button>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-center text-gray-800 capitalize">{getHeaderText()}</h3>
                <div className="flex justify-center border border-gray-200 rounded-lg p-1 bg-gray-50">
                    {viewOptions.map(opt => (
                        <button key={opt.key} onClick={() => !opt.disabled && setDisplayMode(opt.key)} disabled={opt.disabled} className={`px-3 py-1.5 text-sm font-bold rounded-md transition-all duration-300 ${displayMode === opt.key ? 'bg-estacio-blue text-white shadow' : 'text-gray-600 hover:bg-gray-200'} ${opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}`} title={opt.label}>
                            <i className={`${opt.icon} sm:mr-2`}></i><span className="hidden sm:inline">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            {isLoading ? <div className="h-96 flex items-center justify-center"><Spinner /></div> : (
                <div className="min-h-96">
                    {displayMode === 'day' && <DayView date={currentDate} reservations={reservations} onTimeSlotClick={handleTimeSlotClick} onDeleteClick={setReservationToDelete} onEditClick={setReservationToEdit} />}
                    {displayMode === 'week' && <WeekView date={currentDate} reservations={reservations} />}
                    {displayMode === 'month' && <MonthView date={currentDate} reservations={reservations} onDateClick={(d) => { setDisplayMode('day'); setCurrentDate(d); }} />}
                    {displayMode === 'list' && <ListView reservations={reservations} />}
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
             <ConfirmationModal
                isOpen={!!reservationToDelete}
                onClose={() => setReservationToDelete(null)}
                onConfirm={handleCancelReservation}
                title="Confirmar Cancelamento"
                message={<>Tem certeza que deseja cancelar esta reserva?<br/><strong>{reservationToDelete?.environments?.name}</strong> às <strong>{reservationToDelete && new Date(reservationToDelete.start_time).toLocaleString('pt-BR')}</strong></>}
                isConfirming={isCancelling}
                confirmButtonText="Sim, Cancelar"
            />
            {reservationToEdit && (
                <EditReservationAdminModal 
                    isOpen={!!reservationToEdit}
                    onClose={() => setReservationToEdit(null)}
                    reservation={reservationToEdit}
                    environments={environments}
                    allUsers={allUsers}
                    onSaveSuccess={() => {
                        setReservationToEdit(null);
                        fetchMonthReservations();
                    }}
                />
            )}
        </div>
    );
};

const DayView: React.FC<{ date: Date; reservations: Reservation[]; onTimeSlotClick: (date: Date, hour: number) => void; onDeleteClick: (reservation: Reservation) => void; onEditClick: (reservation: Reservation) => void; }> = ({ date, reservations, onTimeSlotClick, onDeleteClick, onEditClick }) => {
    const dayReservations = reservations.filter(r => areDatesSameDay(new Date(r.start_time), date));
    const hours = Array.from({ length: 16 }, (_, i) => i + 7); // 7 AM to 10 PM (22:00)
    const now = new Date();

    const getMinutesFromMidnight = (d: Date) => d.getHours() * 60 + d.getMinutes();
    const timelineStartMinutes = 7 * 60; // 7 AM
    const timelineEndMinutes = 22 * 60; // 10 PM

    return (
        <div className="relative border rounded-lg max-h-[70vh] overflow-y-auto">
            {/* Hour markers and grid lines */}
            <div className="relative">
                {hours.map(hour => {
                    const slotStartDateTime = new Date(date);
                    slotStartDateTime.setHours(hour, 0, 0, 0);
                    const isPast = slotStartDateTime < now;

                    return (
                        <div
                            key={hour}
                            className={`flex items-start border-b last:border-b-0 group ${isPast ? 'bg-gray-50' : 'cursor-pointer hover:bg-blue-50'}`}
                            style={{ height: '60px' }} // 60px per hour
                            onClick={() => !isPast && onTimeSlotClick(date, hour)}
                        >
                            <div className={`w-20 text-right pr-4 pt-1 text-xs flex-shrink-0 ${isPast ? 'text-gray-400' : 'text-gray-500'}`}>
                                {hour}:00
                            </div>
                            <div className="w-full h-full border-l">
                                {!isPast && (
                                    <div className="h-full flex items-center opacity-0 group-hover:opacity-100 transition-opacity pl-4">
                                        <p className="text-sm text-estacio-blue font-semibold"><i className="bi bi-plus-circle-fill mr-2"></i>Agendar</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Reservation Blocks */}
                {dayReservations.map(res => {
                    const startDate = new Date(res.start_time);
                    const endDate = new Date(res.end_time);

                    const startMinutes = getMinutesFromMidnight(startDate);
                    const endMinutes = getMinutesFromMidnight(endDate);
                    
                    if (startMinutes >= timelineEndMinutes || endMinutes <= timelineStartMinutes) {
                        return null; // Don't render if outside timeline
                    }
                    
                    const top = ((Math.max(startMinutes, timelineStartMinutes) - timelineStartMinutes) / 60) * 60; // top in px
                    const height = Math.max(24, ((Math.min(endMinutes, timelineEndMinutes) - Math.max(startMinutes, timelineStartMinutes)) / 60) * 60); // height in px, min 24px

                    return (
                        <div
                            key={res.id}
                            className="absolute left-20 right-0 mr-2 p-2 rounded-lg bg-blue-100 border border-blue-300 z-10 overflow-hidden group"
                            style={{ top: `${top}px`, height: `${height}px` }}
                        >
                            <div className="text-xs text-blue-900 h-full flex flex-col justify-between">
                                <div>
                                    <p className="font-bold truncate">{res.environments?.name}{res.environments?.environment_types?.name ? ` (${res.environments.environment_types.name})` : ''}</p>
                                    <p className="truncate">{new Date(res.start_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} - {new Date(res.end_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                                    <p className="text-xs italic truncate">{res.users?.name}</p>
                                </div>
                                <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEditClick(res); }}
                                        className="bg-blue-100 text-blue-600 hover:bg-blue-200 h-6 w-6 flex items-center justify-center rounded-full"
                                        title="Editar reserva"
                                    >
                                        <i className="bi bi-pencil-square text-xs"></i>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDeleteClick(res); }}
                                        className="bg-red-100 text-red-600 hover:bg-red-200 h-6 w-6 flex items-center justify-center rounded-full"
                                        title="Cancelar reserva"
                                    >
                                        <i className="bi bi-trash text-xs"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {dayReservations.length === 0 && (
                 <div className="absolute inset-0 flex items-center justify-center text-gray-500 z-0 pointer-events-none">
                    <div className="text-center">
                        <p>Nenhuma reserva para este dia.</p>
                        <p>Clique em um horário para agendar.</p>
                    </div>
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
        <div className="grid grid-cols-1 md:grid-cols-7 border rounded-lg overflow-y-auto max-h-[75vh]">
            {Array.from({ length: 7 }).map((_, i) => {
                const day = new Date(startOfWeek);
                day.setDate(day.getDate() + i);
                const dayReservations = reservations.filter(r => areDatesSameDay(new Date(r.start_time), day)).sort((a,b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

                return (
                    <div key={i} className="border-b md:border-b-0 md:border-r last:border-r-0 p-2 min-h-24">
                        <div className="font-bold text-center mb-2">{weekdays[i]} <span className="text-gray-500">{day.getDate()}</span></div>
                        <div className="space-y-2 pr-1">
                             {dayReservations.map(res => (
                                <div key={res.id} className="bg-blue-50 text-blue-800 p-2 rounded-md text-xs shadow-sm">
                                    <p className="font-bold truncate">{res.environments?.name}{res.environments?.environment_types?.name ? ` (${res.environments.environment_types.name})` : ''}</p>
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
            <div className="grid grid-cols-7 gap-1 text-center font-semibold text-gray-600 mb-2 non-printable">
                {weekdays.map(day => <div key={day}>{day}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 non-printable">
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
    const sortedReservations = [...reservations].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return (
        <div className="printable-agenda">
            <div className="flex justify-end mb-4 non-printable">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                    <i className="bi bi-printer-fill"></i>
                    <span>Imprimir Agenda</span>
                </button>
            </div>
            
            <div className="print-header hidden">
                <h2 className="text-2xl font-bold text-center mb-2">Relatório de Agenda</h2>
                <p className="text-center text-gray-600">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
            </div>

            <div className="border rounded-lg max-h-[60vh] overflow-y-auto non-printable-scroll">
                <ul className="divide-y divide-gray-200">
                    {sortedReservations.length > 0 ? (
                        sortedReservations.map(res => (
                            <li key={res.id} className="p-4 hover:bg-gray-50 break-inside-avoid">
                                <p className="font-bold text-lg text-gray-800">{res.environments?.name}{res.environments?.environment_types?.name ? ` (${res.environments.environment_types.name})` : ''}</p>
                                <div className="mt-1">
                                    <p className="text-sm text-gray-600">
                                        <i className="bi bi-calendar-event mr-2"></i>
                                        <span className="font-semibold">{new Date(res.start_time).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        <i className="bi bi-clock mr-2"></i>
                                        Das <span className="font-semibold">{new Date(res.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span> às <span className="font-semibold">{new Date(res.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </p>
                                    <p className="text-sm text-gray-500 italic mt-1">
                                        <i className="bi bi-person mr-2"></i>
                                        Reservado por: {res.users?.name}
                                    </p>
                                </div>
                            </li>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-16">Nenhuma reserva neste mês.</p>
                    )}
                </ul>
            </div>
            
            <style>{`
                @media print {
                    body > #root > div {
                        visibility: hidden;
                    }
                    .printable-agenda {
                        visibility: visible !important;
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 1rem;
                    }
                    .printable-agenda * {
                        visibility: visible !important;
                    }
                    .non-printable {
                        display: none !important;
                    }
                    .non-printable-scroll {
                        max-height: none !important;
                        overflow-y: visible !important;
                        border: none !important;
                        box-shadow: none !important;
                    }
                    .print-header {
                        display: block !important;
                    }
                    li {
                        page-break-inside: avoid;
                    }
                }
            `}</style>
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
  
  // Recurrence state
  const [repeat, setRepeat] = useState(false);
  const [repeatType, setRepeatType] = useState<'daily' | 'weekly'>('daily');
  const [repeatUntil, setRepeatUntil] = useState('');
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const weekdayLabels = useMemo(() => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], []);

  useEffect(() => {
    if (isOpen && initialData) {
      const { hour, date } = initialData;
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
      setRepeat(false);
      setRepeatUntil('');
      setWeekdays([date.getDay()]);
      setRepeatType('weekly');
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

  const handleWeekdayToggle = (dayIndex: number) => {
    setWeekdays(prev =>
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formState.userId) { setError('Por favor, selecione um usuário para a reserva.'); return; }
    if (!formState.environmentId) { setError('Nenhum ambiente disponível com os filtros selecionados.'); return; }
    
    const reservationsToCreate: { environment_id: string; user_id: string; start_time: string; end_time: string; }[] = [];
    const dateString = initialData.date.toISOString().split('T')[0];
    const baseStartTime = new Date(`${dateString}T${formState.startTime}`);
    const baseEndTime = new Date(`${dateString}T${formState.endTime}`);

    if (baseStartTime >= baseEndTime) { setError('O horário de término deve ser após o horário de início.'); return; }

    if (!repeat) {
        if (baseStartTime < new Date()) { setError('Não é possível criar uma reserva em uma data ou horário passados.'); return; }
        reservationsToCreate.push({
            environment_id: formState.environmentId,
            user_id: formState.userId,
            start_time: baseStartTime.toISOString(),
            end_time: baseEndTime.toISOString(),
        });
    } else {
        if (!repeatUntil) { setError('Por favor, defina uma data final para a repetição.'); return; }
        if (repeatType === 'weekly' && weekdays.length === 0) { setError('Por favor, selecione pelo menos um dia da semana.'); return; }

        let currentDate = new Date(baseStartTime);
        const untilDate = new Date(`${repeatUntil}T23:59:59`);
        if (untilDate < currentDate) { setError('A data final da repetição deve ser após a data de início.'); return; }

        while (currentDate <= untilDate) {
            const shouldAdd = (repeatType === 'daily') || (repeatType === 'weekly' && weekdays.includes(currentDate.getDay()));
            if (shouldAdd) {
                const newStart = new Date(currentDate);
                newStart.setHours(baseStartTime.getHours(), baseStartTime.getMinutes());
                const newEnd = new Date(currentDate);
                newEnd.setHours(baseEndTime.getHours(), baseEndTime.getMinutes());
                if (newStart >= new Date()) {
                    reservationsToCreate.push({
                        environment_id: formState.environmentId,
                        user_id: formState.userId,
                        start_time: newStart.toISOString(),
                        end_time: newEnd.toISOString(),
                    });
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        if (reservationsToCreate.length === 0) { setError("Nenhuma data válida encontrada no período de repetição selecionado."); return; }
    }

    setIsSaving(true);
    try {
      await createReservations(reservationsToCreate);
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
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
              {availableEnvironments.length > 0 ? ( availableEnvironments.map(env => ( <option key={env.id} value={env.id}>{env.name} ({env.environment_types?.name || 'Tipo não definido'})</option> )) ) : ( <option value="">Nenhum ambiente disponível</option> )}
            </select>
          </div>
          
            <div className="space-y-2 border-t pt-3 mt-3">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={repeat} onChange={e => setRepeat(e.target.checked)} className="h-4 w-4 rounded text-estacio-blue focus:ring-estacio-blue" />
                    <span className="font-semibold text-gray-700">Repetir reserva</span>
                </label>

                <div className={`grid transition-all duration-500 ease-in-out ${repeat ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                  <div className="overflow-hidden">
                    <div className="pt-2 pl-6 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="repeatType" className="block text-sm font-medium text-gray-600 mb-1">Frequência</label>
                                <select id="repeatType" value={repeatType} onChange={e => setRepeatType(e.target.value as 'daily'|'weekly')} className="w-full p-2 border border-gray-300 rounded-md shadow-sm">
                                    <option value="daily">Diariamente</option>
                                    <option value="weekly">Semanalmente</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="repeatUntil" className="block text-sm font-medium text-gray-600 mb-1">Repetir até</label>
                                <input type="date" id="repeatUntil" value={repeatUntil} onChange={e => setRepeatUntil(e.target.value)} required={repeat} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" min={initialData.date.toISOString().split('T')[0]}/>
                            </div>
                        </div>
                        {repeatType === 'weekly' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-2">Nos dias:</label>
                                <div className="flex flex-wrap gap-2">
                                    {weekdayLabels.map((day, index) => (
                                        <button
                                            type="button"
                                            key={index}
                                            onClick={() => handleWeekdayToggle(index)}
                                            className={`h-8 w-10 rounded-md font-bold text-sm transition-colors ${weekdays.includes(index) ? 'bg-estacio-blue text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                  </div>
                </div>
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

interface EditReservationAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation;
  environments: Environment[];
  allUsers: User[];
  onSaveSuccess: () => void;
}

const EditReservationAdminModal: React.FC<EditReservationAdminModalProps> = ({
  isOpen,
  onClose,
  reservation,
  environments,
  allUsers,
  onSaveSuccess,
}) => {
  const [formState, setFormState] = useState({
    userId: '',
    environmentId: '',
    date: '',
    startTime: '',
    endTime: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && reservation) {
      const startDate = new Date(reservation.start_time);
      const endDate = new Date(reservation.end_time);

      setFormState({
        userId: reservation.user_id || '',
        environmentId: reservation.environment_id || '',
        date: startDate.toISOString().split('T')[0],
        startTime: startDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
        endTime: endDate.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }),
      });
      setError('');
      setIsSaving(false);
    }
  }, [isOpen, reservation]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(p => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formState.userId || !formState.environmentId || !formState.date || !formState.startTime || !formState.endTime) {
      setError('Todos os campos são obrigatórios.');
      return;
    }
    
    const startTime = new Date(`${formState.date}T${formState.startTime}`);
    const endTime = new Date(`${formState.date}T${formState.endTime}`);

    if (startTime >= endTime) {
      setError('O horário de término deve ser após o horário de início.');
      return;
    }

    const updatedData = {
      user_id: formState.userId,
      environment_id: formState.environmentId,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    };
    
    setIsSaving(true);
    try {
      await updateReservation(reservation.id, updatedData);
      onSaveSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar Reserva: ${reservation.environments?.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-2">
        <div>
          <label htmlFor="edit-date" className="block text-sm font-medium text-gray-700 mb-1">Data</label>
          <input type="date" id="edit-date" name="date" value={formState.date} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-startTime" className="block text-sm font-medium text-gray-700 mb-1">Início</label>
            <input type="time" id="edit-startTime" name="startTime" value={formState.startTime} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="edit-endTime" className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
            <input type="time" id="edit-endTime" name="endTime" value={formState.endTime} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md shadow-sm" />
          </div>
        </div>
        <div>
          <label htmlFor="edit-userId" className="block text-sm font-medium text-gray-700 mb-1">Usuário</label>
          <select id="edit-userId" name="userId" value={formState.userId} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md shadow-sm">
            <option value="">Selecione um usuário...</option>
            {allUsers.map(user => (
              <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="edit-environmentId" className="block text-sm font-medium text-gray-700 mb-1">Ambiente</label>
          <select id="edit-environmentId" name="environmentId" value={formState.environmentId} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md shadow-sm">
            <option value="">Selecione um ambiente...</option>
            {environments.map(env => (
              <option key={env.id} value={env.id}>
                {env.name}{env.environment_types?.name ? ` (${env.environment_types.name})` : ''}
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-red-500 text-center text-sm font-semibold bg-red-100 p-2 rounded-md">{error}</p>}
        
        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <button type="button" onClick={onClose} disabled={isSaving} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
          <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 w-48 bg-estacio-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 disabled:opacity-50">
            {isSaving ? <Spinner /> : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const BackupRestoreView: React.FC<{ refreshData: () => Promise<void> }> = ({ refreshData }) => {
  const [isLoadingBackup, setIsLoadingBackup] = useState(false);
  const [isLoadingRestore, setIsLoadingRestore] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const handleCreateBackup = async () => {
    setIsLoadingBackup(true);
    setError('');
    setSuccess('');
    try {
      const backupData = await getBackupData();
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      link.download = `backup_reserva_ambientes_${date}.json`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSuccess('Backup criado e baixado com sucesso!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoadingBackup(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setSuccess('');
    if (e.target.files && e.target.files[0]) {
      setRestoreFile(e.target.files[0]);
    } else {
      setRestoreFile(null);
    }
  };
  
  const handleConfirmRestore = async () => {
    if (!restoreFile) return;

    setIsLoadingRestore(true);
    setError('');
    setSuccess('');
    setIsConfirmModalOpen(false);
    
    const fileReader = new FileReader();
    fileReader.onload = async (event) => {
        try {
            const result = event.target?.result;
            if (typeof result !== 'string') {
                throw new Error('Falha ao ler o arquivo.');
            }
            const backupData = JSON.parse(result);
            
            await restoreBackupData(backupData);
            setSuccess('Sistema restaurado com sucesso! A página será atualizada em breve.');
             setTimeout(() => {
                window.location.reload();
            }, 2500);

        } catch (err: any) {
            setError(err.message);
            setIsLoadingRestore(false);
        }
    };
    fileReader.onerror = () => {
        setError('Falha ao ler o arquivo de backup.');
        setIsLoadingRestore(false);
    };
    fileReader.readAsText(restoreFile);
  };

  return (
    <div className="space-y-8 non-printable">
        {success && <p className="bg-green-100 text-green-700 p-3 rounded-md text-center font-semibold">{success}</p>}
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-center font-semibold">{error}</p>}
      
      {/* Backup Section */}
      <div className="bg-white rounded-xl shadow-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <i className="bi bi-download text-2xl text-estacio-blue"></i>
          <h2 className="text-2xl font-semibold text-gray-800">Criar Backup</h2>
        </div>
        <p className="text-gray-600 mb-4">
          Crie um arquivo de backup (.json) contendo todos os dados do sistema, incluindo usuários, ambientes, recursos e reservas. Guarde este arquivo em um local seguro.
        </p>
        <button 
          onClick={handleCreateBackup} 
          disabled={isLoadingBackup || isLoadingRestore}
          className="w-full flex items-center justify-center gap-2 bg-estacio-blue hover:bg-opacity-90 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50"
        >
          {isLoadingBackup ? <Spinner /> : "Criar e Baixar Backup"}
        </button>
      </div>

      {/* Restore Section */}
      <div className="bg-white rounded-xl shadow-xl p-6 border-2 border-red-300">
        <div className="flex items-center gap-3 mb-4">
          <i className="bi bi-upload text-2xl text-estacio-red"></i>
          <h2 className="text-2xl font-semibold text-gray-800">Restaurar a partir de um Arquivo</h2>
        </div>
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Atenção! Ação Destrutiva!</p>
          <p>Restaurar a partir de um arquivo irá <strong>APAGAR TODOS OS DADOS ATUAIS</strong> do sistema e substituí-los pelos dados do arquivo de backup. Esta ação é irreversível.</p>
        </div>
        
        <div className="space-y-4">
            <div>
                <label htmlFor="restore-file" className="block text-sm font-medium text-gray-700 mb-1">Arquivo de Backup (.json)</label>
                <input 
                    type="file" 
                    id="restore-file" 
                    accept=".json"
                    onChange={handleFileChange}
                    disabled={isLoadingRestore || isLoadingBackup}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-estacio-blue file:text-white hover:file:bg-opacity-90"
                />
            </div>
            <button 
              onClick={() => setIsConfirmModalOpen(true)} 
              disabled={!restoreFile || isLoadingRestore || isLoadingBackup}
              className="w-full flex items-center justify-center gap-2 bg-estacio-red hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50"
            >
              {isLoadingRestore ? <Spinner /> : "Restaurar Sistema"}
            </button>
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmRestore}
        title="Confirmar Restauração do Sistema"
        message={<>Tem certeza de que deseja continuar? Todos os dados atuais serão <strong>permanentemente apagados</strong> e substituídos pelo conteúdo do arquivo <strong>{restoreFile?.name}</strong>.</>}
        isConfirming={isLoadingRestore}
        confirmButtonText="Sim, Restaurar"
      />
    </div>
  );
};


export default AdminScreen;