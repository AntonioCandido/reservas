
import React, { useState, useEffect } from 'react';
import { Page, UserRole } from './constants';
import type { User } from './types';
import { testDatabaseConnection } from './services/supabase.ts';

import Spinner from './components/common/Spinner';
import LoginScreen from './components/screens/LoginScreen';
import AdminScreen from './components/screens/AdminScreen';
import StudentScreen from './components/screens/StudentScreen';
import DbErrorScreen from './components/screens/DbErrorScreen';

const App: React.FC = () => {
  const [page, setPage] = useState<Page>(Page.Loading);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const checkDb = async () => {
      const isConnected = await testDatabaseConnection();
      if (isConnected) {
        setPage(Page.Login);
      } else {
        setPage(Page.DbError);
      }
    };
    checkDb();
  }, []);

  const renderPage = () => {
    switch (page) {
      case Page.Loading:
        return (
          <div className="flex justify-center items-center min-h-screen">
            <Spinner />
          </div>
        );
      case Page.DbError:
        return <DbErrorScreen setPage={setPage} />;
      case Page.Login:
        return <LoginScreen setPage={setPage} setUser={setUser} />;
      
      case Page.Admin:
        if (user?.role === UserRole.Admin) {
          return <AdminScreen setPage={setPage} user={user} setUser={setUser} />;
        }
        // Fallback para login se não for admin
        return <LoginScreen setPage={setPage} setUser={setUser} />;
        
      case Page.Main:
         if (user) {
          return <StudentScreen setPage={setPage} user={user} setUser={setUser} />;
        }
        // Fallback para login se não houver usuário
        return <LoginScreen setPage={setPage} setUser={setUser} />;
        
      default:
        return <LoginScreen setPage={setPage} setUser={setUser} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {renderPage()}
    </div>
  );
};

export default App;
