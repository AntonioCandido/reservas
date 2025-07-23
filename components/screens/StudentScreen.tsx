import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllEnvironments, createReservations, getReservationsForEnvironment, getUserReservations, cancelReservation, getReservationsForMonth, getAllResources } from '../../services/supabase.ts';
import type { AppContextType, Environment, Reservation, User, Resource } from '../../types';
import { Page, UserRole } from '../../constants';
import Spinner from '../common/Spinner';
import Modal from '../common/Modal';
import ConfirmationModal from '../common/ConfirmationModal';
import ProfileModal from '../common/ProfileModal';
import AIAssistantModal from '../common/AIAssistantModal.tsx';

type MainView = 'all' | 'my' | 'calendar';

const MainScreen: React.FC<Omit<AppContextType, 'page'>> = ({ setPage, user, setUser }) => {
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [myReservations, setMyReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const canManageReservations = user?.role === UserRole.Professor || user?.role === UserRole.Coordenador;
  const [view, setView] = useState<MainView>(canManageReservations ? 'calendar' : 'all');
  
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
  const [reservationToDelete, setReservationToDelete] = useState<Reservation | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isContentOpen, setIsContentOpen] = useState(true);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);


  const fetchData = useCallback(async () => {
    setError('');
    try {
      const [envs, myRes, allResources] = await Promise.all([
          getAllEnvironments(),
          user ? getUserReservations(user.id) : Promise.resolve([]),
          getAllResources(),
      ]);
      setEnvironments(envs);
      setMyReservations(myRes);
      setResources(allResources);
    } catch (err: any) {
      setError(err.message);
    }
  }, [user]);

  useEffect(() => {
    setIsLoading(true);
    fetchData().finally(() => setIsLoading(false));
  }, [fetchData]);


  const handleLogout = () => {
    setUser(null);
    setPage(Page.Login);
  };
  
  const confirmCancelReservation = async () => {
    if (!reservationToDelete) return;
    setIsCancelling(true);
    try {
        await cancelReservation(reservationToDelete.id);
        setReservationToDelete(null);
        await fetchData(); // Refresh data
    } catch (err: any) {
        setError(err.message);
    } finally {
        setIsCancelling(false);
    }
  };

  if (!user) {
    setPage(Page.Login);
    return null;
  }
  
  const handleSuggestion = (environment: Environment) => {
    setIsAIAssistantOpen(false);
    setSelectedEnvironment(environment);
  };
  
  const renderContent = () => {
    switch(view) {
        case 'all':
            return <AllEnvironmentsView environments={environments} canManageReservations={canManageReservations} onReserveClick={setSelectedEnvironment} isContentOpen={isContentOpen} setIsContentOpen={setIsContentOpen}/>;
        case 'my':
            return <MyReservationsView reservations={myReservations} canManageReservations={canManageReservations} onCancelClick={setReservationToDelete} isContentOpen={isContentOpen} setIsContentOpen={setIsContentOpen} />;
        case 'calendar':
             if (!canManageReservations) return null;
             return <CalendarView environments={environments} resources={resources} user={user} onCancelClick={setReservationToDelete} />;
        default:
            return null;
    }
  }

  return (
    <div className="container mx-auto p-4 md:p-8 pb-24">
      <header className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
            <h1 className="text-4xl font-bold text-gray-800">Olá, {user.name.split(' ')[0]}</h1>
            <p className="text-gray-600">Bem-vindo(a) ao portal de reservas. Seu perfil: <span className="font-bold text-estacio-red capitalize">{user.role}</span></p>
        </div>
        <div className="flex items-center gap-4 self-start sm:self-center">
             <div className="text-center">
                <button onClick={() => setIsProfileModalOpen(true)} className="flex items-center justify-center h-10 w-10 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-full transition-colors" aria-label="Editar Perfil">
                    <i className="bi bi-person-fill text-xl"></i>
                </button>
                <span className="text-xs text-gray-600 mt-1 max-w-24 truncate block">{user.name}</span>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 bg-estacio-red text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105">
            <i className="bi bi-box-arrow-right text-lg"></i>
            <span>Sair</span>
            </button>
        </div>
      </header>

      {error && <p className="bg-red-100 text-red-700 p-3 rounded-md mb-4 text-center font-semibold">{error}</p>}
      
       <div className="flex border border-gray-200 rounded-lg p-1 bg-gray-50 mb-6 max-w-lg mx-auto">
          {canManageReservations && (
               <button onClick={() => setView('calendar')} className={`w-1/3 py-2 text-sm font-bold rounded-md transition-all duration-300 ${view === 'calendar' ? 'bg-estacio-blue text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
                    <i className="bi bi-calendar3 mr-2"></i> Calendário
                </button>
          )}
          <button onClick={() => setView('all')} className={`w-1/${canManageReservations ? 3: 2} py-2 text-sm font-bold rounded-md transition-all duration-300 ${view === 'all' ? 'bg-estacio-blue text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
            <i className="bi bi-door-open mr-2"></i> Ambientes
          </button>
          <button onClick={() => setView('my')} className={`w-1/${canManageReservations ? 3: 2} py-2 text-sm font-bold rounded-md transition-all duration-300 ${view === 'my' ? 'bg-estacio-blue text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}>
            <i className="bi bi-calendar-check mr-2"></i> Minhas Reservas
          </button>
        </div>

      {isLoading ? <div className="py-16"><Spinner/></div> : renderContent()}
      
      {selectedEnvironment && (
        <ReservationModal
          isOpen={!!selectedEnvironment}
          onClose={() => setSelectedEnvironment(null)}
          environment={selectedEnvironment}
          user={user}
          refreshData={fetchData}
          canCreateReservations={canManageReservations}
        />
      )}

      <ConfirmationModal
        isOpen={!!reservationToDelete}
        onClose={() => setReservationToDelete(null)}
        onConfirm={confirmCancelReservation}
        title="Confirmar Cancelamento"
        message="Tem certeza que deseja cancelar esta reserva?"
        isConfirming={isCancelling}
        confirmButtonText="Sim, Cancelar"
      />
      {user && (
        <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            user={user}
            onUserUpdate={setUser}
        />
      )}

       {user && (
        <AIAssistantModal
          isOpen={isAIAssistantOpen}
          onClose={() => setIsAIAssistantOpen(false)}
          environments={environments}
          user={user}
          onSuggestion={handleSuggestion}
        />
      )}

      {user && view !== 'calendar' && (
        <button
            onClick={() => setIsAIAssistantOpen(true)}
            className="fixed bottom-8 right-8 bg-estacio-blue text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-opacity-90 transition-all duration-300 transform hover:scale-110 z-40"
            title="Assistente de Reserva IA"
            aria-label="Abrir assistente de reserva com Inteligência Artificial"
        >
            <i className="bi bi-magic text-2xl"></i>
        </button>
      )}
    </div>
  );
};

// --- View Components ---
const AllEnvironmentsView: React.FC<{environments: Environment[], canManageReservations: boolean, onReserveClick: (env: Environment) => void, isContentOpen: boolean, setIsContentOpen: (open: boolean) => void}> = 
({environments, canManageReservations, onReserveClick, isContentOpen, setIsContentOpen}) => {
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

    return (
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="flex justify-between items-center p-6 cursor-pointer group" onClick={() => setIsContentOpen(!isContentOpen)}>
                 <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-semibold text-gray-700">Todos os Ambientes</h2>
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
                 <i className={`bi bi-chevron-down text-2xl text-gray-500 transform transition-transform duration-300 group-hover:text-estacio-blue ${isContentOpen ? 'rotate-180' : ''}`}></i>
            </div>
            <div className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${isContentOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <div className="px-6 pb-6 border-t border-gray-200">
                        <div className="space-y-4 pt-6">
                            {sortedEnvironments.map(env => (
                                <div key={env.id} className="bg-gray-50 p-4 rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-4 hover:shadow-md transition-shadow">
                                    <div>
                                        <h3 className="text-xl font-bold text-estacio-blue">{env.name} <span className="text-base font-normal text-gray-600">- {env.environment_types?.name}</span></h3>
                                        <p className="text-sm text-gray-500">{env.location}</p>
                                        <p className="text-sm text-gray-500">Recursos: {env.resources?.map(r => r.name).join(', ') || 'N/A'}</p>
                                    </div>
                                    <button onClick={() => onReserveClick(env)} className="bg-estacio-red text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 transition-transform transform hover:scale-105 self-end md:self-center">
                                        <i className="bi bi-calendar-plus mr-2"></i> {canManageReservations ? 'Reservar' : 'Ver Agenda'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MyReservationsView: React.FC<{reservations: Reservation[], canManageReservations: boolean, onCancelClick: (res: Reservation) => void, isContentOpen: boolean, setIsContentOpen: (open: boolean) => void}> = 
({reservations, canManageReservations, onCancelClick, isContentOpen, setIsContentOpen}) => (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="flex justify-between items-center p-6 cursor-pointer group" onClick={() => setIsContentOpen(!isContentOpen)}>
             <h2 className="text-2xl font-semibold text-gray-700">Minhas Reservas</h2>
             <i className={`bi bi-chevron-down text-2xl text-gray-500 transform transition-transform duration-300 group-hover:text-estacio-blue ${isContentOpen ? 'rotate-180' : ''}`}></i>
        </div>
        <div className={`transition-all duration-500 ease-in-out ${isContentOpen ? 'max-h-[2000px]' : 'max-h-0'}`}>
            <div className="px-6 pb-6 border-t border-gray-200">
                <div className="space-y-4 pt-6">
                    {reservations.length > 0 ? reservations.map(res => (
                        <div key={res.id} className="bg-gray-50 p-4 rounded-lg flex flex-col md:flex-row justify-between md:items-center gap-3">
                            <div>
                                <p className="font-bold text-gray-800">{res.environments?.name}</p>
                                <p className="text-sm text-gray-600">{new Date(res.start_time).toLocaleString('pt-BR')} - {new Date(res.end_time).toLocaleTimeString('pt-BR')}</p>
                            </div>
                           {canManageReservations && (
                             <button onClick={() => onCancelClick(res)} className="bg-red-100 text-red-600 hover:bg-red-200 h-10 w-10 flex items-center justify-center rounded-full transition-colors self-end md:self-center" aria-label="Cancelar reserva">
                                <i className="bi bi-trash"></i>
                            </button>
                           )}
                        </div>
                    )) : <p className="text-center text-gray-500 py-8">Você não possui reservas.</p>}
                </div>
            </div>
        </div>
    </div>
);

// --- Calendar View and Sub-components ---

type CalendarDisplayMode = 'day' | 'week' | 'month' | 'list' | 'resource';

const areDatesSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const CalendarView: React.FC<{ environments: Environment[]; resources: Resource[], user: User, onCancelClick: (res: Reservation) => void }> = ({ environments, resources, user, onCancelClick }) => {
    const [displayMode, setDisplayMode] = useState<CalendarDisplayMode>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedResourceId, setSelectedResourceId] = useState<string | null>(null);
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
    
    const isPrevDisabled = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const newDate = new Date(currentDate);

        if (displayMode === 'day') {
            newDate.setDate(newDate.getDate() - 1);
            return newDate < today;
        } else if (displayMode === 'week') {
            const tempDate = new Date(newDate.setDate(newDate.getDate() - 7));
            tempDate.setDate(tempDate.getDate() - tempDate.getDay() + 6);
            return tempDate < today;
        } else { // month
            const lastDayOfPrevMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 0);
            return lastDayOfPrevMonth < today;
        }
    }, [currentDate, displayMode]);

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
        if (displayMode === 'week') {
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
    
    const filteredReservations = selectedResourceId ? reservations.filter(r => r.environment_id === selectedResourceId) : reservations;

    return (
        <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <button onClick={() => handleDateChange(-1)} disabled={isPrevDisabled} className="p-2 rounded-full hover:bg-gray-200 transition-colors disabled:text-gray-300 disabled:cursor-not-allowed" aria-label="Período anterior"><i className="bi bi-chevron-left"></i></button>
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
                    <select onChange={(e) => setSelectedResourceId(e.target.value)} value={selectedResourceId || ''} className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-estacio-blue focus:border-estacio-blue">
                        <option value="">Selecione o Ambiente</option>
                        {environments.map(env => <option key={env.id} value={env.id}>{env.name}</option>)}
                    </select>
                </div>
            )}
            
            {isLoading ? <div className="h-96 flex items-center justify-center"><Spinner /></div> : (
                <div className="min-h-96">
                    {displayMode === 'day' && <DayView date={currentDate} reservations={reservations} onTimeSlotClick={handleTimeSlotClick} user={user} onCancelClick={onCancelClick} />}
                    {displayMode === 'week' && <WeekView date={currentDate} reservations={reservations} />}
                    {displayMode === 'month' && <MonthView date={currentDate} reservations={reservations} onDateClick={(d) => { setDisplayMode('day'); setCurrentDate(d); }} />}
                    {displayMode === 'list' && <ListView reservations={reservations} />}
                    {displayMode === 'resource' && <WeekView date={currentDate} reservations={filteredReservations} />}
                </div>
            )}
            {isCreateModalOpen && newReservationData && (
                <CreateReservationModal 
                    isOpen={isCreateModalOpen}
                    onClose={() => setCreateModalOpen(false)}
                    initialData={newReservationData}
                    environments={environments}
                    allResources={resources}
                    allReservations={reservations}
                    user={user}
                    onSaveSuccess={() => {
                        setCreateModalOpen(false);
                        fetchMonthReservations();
                    }}
                />
            )}
        </div>
    );
};

const DayView: React.FC<{ date: Date; reservations: Reservation[]; onTimeSlotClick: (date: Date, hour: number) => void; user: User; onCancelClick: (res: Reservation) => void; }> = ({ date, reservations, onTimeSlotClick, user, onCancelClick }) => {
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
                                    <div key={res.id} className="bg-blue-100 text-blue-900 p-2 rounded-md text-xs shadow-sm flex justify-between items-center">
                                        <div>
                                            <p className="font-bold">{res.environments?.name}</p>
                                            <p>{new Date(res.start_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} - {new Date(res.end_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                                            <p className="text-xs font-semibold italic">{res.users?.name}</p>
                                        </div>
                                        {user.id === res.user_id && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onCancelClick(res); }}
                                                className="ml-2 flex-shrink-0 bg-red-100 text-red-600 hover:bg-red-200 h-8 w-8 flex items-center justify-center rounded-full transition-colors"
                                                title="Cancelar sua reserva"
                                                aria-label="Cancelar sua reserva"
                                            >
                                                <i className="bi bi-trash"></i>
                                            </button>
                                        )}
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


// --- Reservation Modal Component ---
interface ReservationModalProps {
    isOpen: boolean;
    onClose: () => void;
    environment: Environment;
    user: User;
    refreshData: () => void;
    canCreateReservations: boolean;
}

const ReservationModal: React.FC<ReservationModalProps> = ({ isOpen, onClose, environment, user, refreshData, canCreateReservations }) => {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isBooking, setIsBooking] = useState(false);
    const [error, setError] = useState('');
    const [formState, setFormState] = useState({ date: '', startTime: '', endTime: '' });
    
    const [repeat, setRepeat] = useState(false);
    const [repeatType, setRepeatType] = useState<'daily' | 'weekly'>('daily');
    const [repeatUntil, setRepeatUntil] = useState('');
    const [weekdays, setWeekdays] = useState<number[]>([]);
    const weekdayLabels = useMemo(() => ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], []);

    const fetchReservations = useCallback(() => {
        setIsLoading(true);
        setError('');
        getReservationsForEnvironment(environment.id)
            .then(setReservations)
            .catch((err: any) => setError(err.message))
            .finally(() => setIsLoading(false));
    }, [environment.id]);

    useEffect(() => {
        if(isOpen) {
            fetchReservations();
            const today = new Date();
            setFormState({ date: today.toISOString().split('T')[0], startTime: '', endTime: '' });
            setRepeat(false);
            setRepeatUntil('');
            setWeekdays([]);
        }
    }, [isOpen, fetchReservations]);
    
    const handleWeekdayToggle = (dayIndex: number) => {
        setWeekdays(prev =>
            prev.includes(dayIndex)
            ? prev.filter(d => d !== dayIndex)
            : [...prev, dayIndex].sort()
        );
    };

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const reservationsToCreate: { environment_id: string; user_id: string; start_time: string; end_time: string; }[] = [];
        const baseStartTime = new Date(`${formState.date}T${formState.startTime}`);
        const baseEndTime = new Date(`${formState.date}T${formState.endTime}`);

        if (baseStartTime >= baseEndTime) { setError("O horário de término deve ser após o horário de início."); return; }
        
        if (!repeat) {
            if (baseStartTime < new Date()) { setError("Não é possível criar uma reserva em uma data ou horário passados."); return; }
            reservationsToCreate.push({
                environment_id: environment.id,
                user_id: user.id,
                start_time: baseStartTime.toISOString(),
                end_time: baseEndTime.toISOString(),
            });
        } else {
            if (!repeatUntil) { setError('Por favor, defina uma data final para a repetição.'); return; }
            if (repeatType === 'weekly' && weekdays.length === 0) { setError('Por favor, selecione pelo menos um dia da semana.'); return; }
            
            let currentDate = new Date(baseStartTime);
            const untilDate = new Date(`${repeatUntil}T23:59:59`);
            if (untilDate < currentDate) { setError('A data final da repetição deve ser após a data de início.'); return; }

            while(currentDate <= untilDate) {
                const shouldAdd = (repeatType === 'daily') || (repeatType === 'weekly' && weekdays.includes(currentDate.getDay()));
                if(shouldAdd) {
                    const newStart = new Date(currentDate);
                    newStart.setHours(baseStartTime.getHours(), baseStartTime.getMinutes());
                    const newEnd = new Date(currentDate);
                    newEnd.setHours(baseEndTime.getHours(), baseEndTime.getMinutes());
                    if(newStart >= new Date()) {
                        reservationsToCreate.push({
                            environment_id: environment.id,
                            user_id: user.id,
                            start_time: newStart.toISOString(),
                            end_time: newEnd.toISOString(),
                        });
                    }
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            if (reservationsToCreate.length === 0) { setError("Nenhuma data válida encontrada no período de repetição selecionado."); return; }
        }

        setIsBooking(true);
        try {
            await createReservations(reservationsToCreate);
            refreshData();
            fetchReservations();
            setFormState({ date: '', startTime: '', endTime: '' });
            setRepeat(false);
            setRepeatUntil('');
            setWeekdays([]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsBooking(false);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Reservas para ${environment.name}`}>
            <div className="max-h-[75vh] overflow-y-auto pr-2">
                {canCreateReservations && (
                     <form onSubmit={handleBooking} className="p-4 border-b mb-4 space-y-3 bg-gray-50 rounded-lg">
                        <h3 className="text-lg font-semibold text-gray-700">Nova Reserva</h3>
                        {error && <p className="text-red-500 text-sm text-center font-semibold bg-red-100 p-2 rounded-md">{error}</p>}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <input type="date" value={formState.date} onChange={e => setFormState(s => ({...s, date: e.target.value}))} required className="input-field" min={new Date().toISOString().split('T')[0]}/>
                            <input type="time" value={formState.startTime} onChange={e => setFormState(s => ({...s, startTime: e.target.value}))} required className="input-field"/>
                            <input type="time" value={formState.endTime} onChange={e => setFormState(s => ({...s, endTime: e.target.value}))} required className="input-field"/>
                        </div>
                        <style>{`.input-field { padding: 0.5rem 0.75rem; border: 1px solid #D1D5DB; border-radius: 0.5rem; }`}</style>
                        
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
                                            <label htmlFor="res-repeatType" className="block text-sm font-medium text-gray-600 mb-1">Frequência</label>
                                            <select id="res-repeatType" value={repeatType} onChange={e => setRepeatType(e.target.value as 'daily'|'weekly')} className="w-full p-2 border border-gray-300 rounded-md shadow-sm">
                                                <option value="daily">Diariamente</option>
                                                <option value="weekly">Semanalmente</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="res-repeatUntil" className="block text-sm font-medium text-gray-600 mb-1">Repetir até</label>
                                            <input type="date" id="res-repeatUntil" value={repeatUntil} onChange={e => setRepeatUntil(e.target.value)} required={repeat} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" min={formState.date}/>
                                        </div>
                                    </div>
                                    {repeatType === 'weekly' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-2">Nos dias:</label>
                                            <div className="flex flex-wrap gap-2">
                                                {weekdayLabels.map((day, index) => (
                                                    <button type="button" key={index} onClick={() => handleWeekdayToggle(index)} className={`h-8 w-10 rounded-md font-bold text-sm transition-colors ${weekdays.includes(index) ? 'bg-estacio-blue text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
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

                        <button type="submit" disabled={isBooking || !formState.date || !formState.startTime || !formState.endTime} className="w-full flex justify-center items-center bg-estacio-red text-white font-bold py-2 rounded-lg hover:bg-opacity-90 disabled:opacity-50">
                            {isBooking ? <Spinner /> : "Confirmar Reserva"}
                        </button>
                     </form>
                )}
               
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Agenda</h3>
                {isLoading ? <div className="h-24 flex justify-center items-center"><Spinner/></div> : (
                    <ul className="space-y-2 max-h-64 overflow-y-auto">
                        {reservations.length > 0 ? reservations.map(res => (
                            <li key={res.id} className="bg-blue-50 text-blue-800 p-2 rounded-md text-sm">
                                <strong>{res.users?.name || 'Usuário desconhecido'}</strong> - {new Date(res.start_time).toLocaleString('pt-BR')} até {new Date(res.end_time).toLocaleTimeString('pt-BR')}
                            </li>
                        )) : <p className="text-center text-gray-500 p-4">Nenhuma reserva para este ambiente.</p>}
                    </ul>
                )}
            </div>
        </Modal>
    )
}


interface CreateReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: { date: Date; hour: number };
  environments: Environment[];
  allResources: Resource[];
  allReservations: Reservation[];
  user: User;
  onSaveSuccess: () => void;
}

const CreateReservationModal: React.FC<CreateReservationModalProps> = ({
  isOpen,
  onClose,
  initialData,
  environments,
  allResources,
  allReservations,
  user,
  onSaveSuccess,
}) => {
  const [formState, setFormState] = useState({
    environmentId: '',
    startTime: '',
    endTime: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
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
            user_id: user.id,
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
                        user_id: user.id,
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
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Nova Reserva">
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
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formState.startTime}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-estacio-blue focus:border-estacio-blue"
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formState.endTime}
                onChange={handleInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-estacio-blue focus:border-estacio-blue"
              />
            </div>
          </div>
          
          {allResources.length > 0 && (
            <div className="bg-gray-50 rounded-lg border">
              <div 
                className="flex justify-between items-center p-3 cursor-pointer group" 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setIsFilterOpen(!isFilterOpen)}
                aria-expanded={isFilterOpen}
              >
                <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-700">Filtrar por Recursos</h4>
                    {selectedResources.length > 0 && (
                        <span className="bg-estacio-blue text-white text-xs font-bold h-5 w-5 rounded-full flex items-center justify-center">
                            {selectedResources.length}
                        </span>
                    )}
                </div>
                <i className={`bi bi-chevron-down text-xl text-gray-500 transform transition-transform duration-300 group-hover:text-estacio-blue ${isFilterOpen ? 'rotate-180' : ''}`}></i>
              </div>
              <div className={`transition-all duration-300 ease-in-out overflow-y-auto ${isFilterOpen ? 'max-h-60' : 'max-h-0'}`}>
                  <div className="p-3 border-t border-gray-200">
                      <div className="flex flex-wrap gap-2">
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
                      </div>
                  </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex justify-between items-center mb-1">
                <label htmlFor="environmentId" className="block text-sm font-medium text-gray-700">Ambiente</label>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    availableEnvironments.length > 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                    {availableEnvironments.length} disponível(is)
                </span>
            </div>
            <select
              id="environmentId"
              name="environmentId"
              value={formState.environmentId}
              onChange={handleInputChange}
              required
              disabled={availableEnvironments.length === 0}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-estacio-blue focus:border-estacio-blue disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              {availableEnvironments.length > 0 ? (
                  availableEnvironments.map(env => (
                  <option key={env.id} value={env.id}>{env.name} ({env.environment_types?.name || 'Tipo não definido'})</option>
                  ))
              ) : (
                  <option value="">Nenhum ambiente disponível</option>
              )}
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
                                <label htmlFor="create-repeatType" className="block text-sm font-medium text-gray-600 mb-1">Frequência</label>
                                <select id="create-repeatType" value={repeatType} onChange={e => setRepeatType(e.target.value as 'daily'|'weekly')} className="w-full p-2 border border-gray-300 rounded-md shadow-sm">
                                    <option value="daily">Diariamente</option>
                                    <option value="weekly">Semanalmente</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="create-repeatUntil" className="block text-sm font-medium text-gray-600 mb-1">Repetir até</label>
                                <input type="date" id="create-repeatUntil" value={repeatUntil} onChange={e => setRepeatUntil(e.target.value)} required={repeat} className="w-full p-2 border border-gray-300 rounded-md shadow-sm" min={initialData.date.toISOString().split('T')[0]}/>
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
            <button type="button" onClick={onClose} disabled={isSaving} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving || !formState.environmentId} className="flex items-center justify-center gap-2 w-48 bg-estacio-red text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
              {isSaving ? <Spinner /> : "Confirmar Reserva"}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};


export default MainScreen;