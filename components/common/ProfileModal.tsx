
import React, { useState, useEffect } from 'react';
import type { User } from '../../types';
import { updateUser } from '../../services/supabase.ts';
import Modal from './Modal';
import Spinner from './Spinner';
import IconInput from './IconInput';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUserUpdate: (updatedUser: User | null) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onUserUpdate }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const wantsToChangePassword = newPassword !== '' || confirmPassword !== '';

  useEffect(() => {
    if (isOpen) {
      // Redefine o estado quando o modal é aberto
      setName(user.name);
      setEmail(user.email);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccessMessage('');
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!currentPassword) {
      setError('Por favor, insira sua senha atual para salvar as alterações.');
      return;
    }
    
    const updateData: { name?: string; email?: string; password?: string } = {};
    if (name !== user.name) updateData.name = name;
    if (email !== user.email) updateData.email = email;

    if (wantsToChangePassword) {
      if (newPassword.length < 3) {
        setError('A nova senha deve ter pelo menos 3 caracteres.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('A nova senha e a confirmação não correspondem.');
        return;
      }
      updateData.password = newPassword;
    }
    
    if (Object.keys(updateData).length === 0) {
        setError("Nenhuma alteração foi feita.");
        return;
    }

    setIsSaving(true);

    try {
      const updatedUser = await updateUser(user.id, currentPassword, updateData);
      onUserUpdate(updatedUser);
      setSuccessMessage('Dados atualizados com sucesso!');
      setTimeout(() => {
          onClose();
      }, 1500); // Fecha o modal após exibir a mensagem de sucesso
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao atualizar os dados.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Perfil">
      <form onSubmit={handleSubmit} className="space-y-4">
        <IconInput
          icon="bi-person"
          id="profile-name"
          type="text"
          placeholder="Nome Completo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          aria-label="Nome Completo"
        />
        <IconInput
          icon="bi-envelope"
          id="profile-email"
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-label="E-mail"
        />
        
        <div className="border-t pt-4 space-y-4">
             <IconInput
                icon="bi-shield-lock"
                id="profile-current-password"
                type="password"
                placeholder="Senha Atual (obrigatório para salvar)"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                required
                aria-label="Senha Atual"
            />
            <p className="text-sm text-gray-600 text-center">Para alterar sua senha, preencha os campos abaixo.</p>
            <IconInput
                icon="bi-lock"
                id="profile-new-password"
                type="password"
                placeholder="Nova Senha (opcional)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                aria-label="Nova Senha"
            />
            <IconInput
                icon="bi-lock-fill"
                id="profile-confirm-password"
                type="password"
                placeholder="Confirmar Nova Senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                aria-label="Confirmar Nova Senha"
            />
        </div>
        
        {error && <p className="text-red-500 text-center text-sm font-semibold">{error}</p>}
        {successMessage && <p className="text-green-600 text-center text-sm font-semibold">{successMessage}</p>}
        
        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <button type="button" onClick={onClose} disabled={isSaving} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors">
            Cancelar
          </button>
          <button type="submit" disabled={isSaving} className="flex items-center justify-center gap-2 w-48 bg-estacio-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-opacity-90 disabled:opacity-50">
            {isSaving ? <Spinner /> : "Salvar Alterações"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProfileModal;