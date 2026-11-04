import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from './supabase';

export interface AdminUserRecord {
  id: string;
  email: string;
  created_at: string;
  role: string;
}

export const STORAGE_USERS_KEY = 'pastelaria_admin_users_list';

export function getLocalAdminUsers(): AdminUserRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveLocalAdminUsers(users: AdminUserRecord[]): void {
  try {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
  } catch (err) {
    console.warn('Erro ao salvar lista de administradores:', err);
  }
}

/**
 * Cria um novo usuário administrador sem complicações.
 * Usa um cliente Supabase isolado (sem persistSession) para NÃO deslogar o administrador atual.
 */
export async function createAdminUser(
  email: string,
  pass: string
): Promise<{ success: boolean; error?: string; user?: AdminUserRecord }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'Por favor, insira um e-mail válido.' };
  }
  if (!pass || pass.length < 6) {
    return { success: false, error: 'A senha deve ter no mínimo 6 caracteres.' };
  }

  const existing = getLocalAdminUsers();
  if (existing.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: 'Este e-mail já está cadastrado na lista de administradores.' };
  }

  // Supabase Auth
  if (isSupabaseConfigured) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

    try {
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });

      const { data, error } = await tempClient.auth.signUp({
        email: cleanEmail,
        password: pass,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      const newUser: AdminUserRecord = {
        id: data.user?.id || 'usr-' + Math.random().toString(36).substring(2, 9),
        email: cleanEmail,
        created_at: new Date().toISOString(),
        role: 'Administrador',
      };

      existing.unshift(newUser);
      saveLocalAdminUsers(existing);

      return { success: true, user: newUser };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao cadastrar usuário no Supabase.';
      return { success: false, error: msg };
    }
  }

  // Fallback para modo Mock local
  try {
    const mockUsers = JSON.parse(localStorage.getItem('pastelaria_mock_users') || '[]');
    mockUsers.push({ email: cleanEmail, password: pass });
    localStorage.setItem('pastelaria_mock_users', JSON.stringify(mockUsers));
  } catch {
    // ignora
  }

  const newUser: AdminUserRecord = {
    id: 'usr-' + Math.random().toString(36).substring(2, 9),
    email: cleanEmail,
    created_at: new Date().toISOString(),
    role: 'Administrador',
  };

  existing.unshift(newUser);
  saveLocalAdminUsers(existing);

  return { success: true, user: newUser };
}

export function removeAdminUser(id: string): void {
  const users = getLocalAdminUsers().filter((u) => u.id !== id);
  saveLocalAdminUsers(users);

  try {
    const mockUsers = JSON.parse(localStorage.getItem('pastelaria_mock_users') || '[]');
    const filteredMock = mockUsers.filter((u: { id?: string; email?: string }) => u.id !== id);
    localStorage.setItem('pastelaria_mock_users', JSON.stringify(filteredMock));
  } catch {
    // ignora
  }
}
