
import React, { useState } from 'react';
import { loginUser } from '../../services/supabase.ts';
import type { AppContextType } from '../../types';
import { Page, UserRole } from '../../constants';
import Spinner from '../common/Spinner';
import IconInput from '../common/IconInput';

const LoginScreen: React.FC<Omit<AppContextType, 'page' | 'user'>> = ({ setPage, setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await loginUser(email, password);
      if (user) {
        setUser(user);
        if (user.role === UserRole.Admin) {
          setPage(Page.Admin);
        } else {
          setPage(Page.Main);
        }
      } else {
        setError('E-mail ou senha inválidos.');
      }
    } catch (err) {
      setError('Ocorreu um erro ao tentar fazer login. Tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 space-y-8">
        <div className="text-center">
          <img 
            src="https://cdn.portal.estacio.br/logotipo_marca_estacio_preto_HOME_d4bc9da518.svg" 
            alt="Logo Estácio" 
            className="w-40 mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-800">Reserva de Ambientes 1.2</h2>
        </div>
        {error && <p className="bg-red-100 text-red-700 p-3 rounded-md text-center text-sm font-semibold">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-6">
          <IconInput
            icon="bi-envelope"
            id="email"
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="E-mail"
          />
          <IconInput
            icon="bi-lock"
            id="password"
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            aria-label="Senha"
          />
           <p className="text-center text-sm text-gray-500">Polo – Tom Jobim – Barra da Tijuca - RJ</p>
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-estacio-blue hover:bg-opacity-90 text-white font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Spinner /> : (
                <>
                  <i className="bi bi-box-arrow-in-right text-lg"></i>
                  <span>Entrar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;