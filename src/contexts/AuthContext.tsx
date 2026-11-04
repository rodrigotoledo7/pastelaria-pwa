import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const STORAGE_KEY_SAVED_EMAIL = 'pastelaria_saved_email';
export const STORAGE_KEY_REMEMBER_ME = 'pastelaria_remember_me';
export const STORAGE_KEY_MOCK_SESSION = 'pastelaria_mock_admin_session';
export const STORAGE_KEY_LAST_ACTIVITY = 'pastelaria_last_activity';
export const STORAGE_KEY_LOGOUT_REASON = 'pastelaria_logout_reason';
export const SESSION_KEY_ACTIVE = 'pastelaria_session_active';

// Limite de inatividade (em ms)
// Se "Lembrar": 30 minutos (1.800.000 ms)
// Se NÃO lembrar: 10 minutos (600.000 ms)
export const IDLE_TIMEOUT_REMEMBERED_MS = 30 * 60 * 1000;
export const IDLE_TIMEOUT_TEMPORARY_MS = 10 * 60 * 1000;

interface AuthContextType {
  user: any | null;
  isAdmin: boolean;
  loading: boolean;
  rememberMe: boolean;
  logoutReason: string | null;
  clearLogoutReason: () => void;
  login: (email: string, pass: string, remember?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: (reason?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem(STORAGE_KEY_REMEMBER_ME) !== 'false';
  });
  const [logoutReason, setLogoutReason] = useState<string | null>(() => {
    return sessionStorage.getItem(STORAGE_KEY_LOGOUT_REASON);
  });
  const lastActivityRef = useRef<number>(0);

  const clearLogoutReason = useCallback(() => {
    setLogoutReason(null);
    sessionStorage.removeItem(STORAGE_KEY_LOGOUT_REASON);
  }, []);

  const logout = useCallback(async (reason?: string) => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Erro ao deslogar do Supabase:', err);
      }
    }

    localStorage.removeItem(STORAGE_KEY_MOCK_SESSION);
    sessionStorage.removeItem(SESSION_KEY_ACTIVE);
    localStorage.removeItem(STORAGE_KEY_LAST_ACTIVITY);

    if (reason) {
      setLogoutReason(reason);
      sessionStorage.setItem(STORAGE_KEY_LOGOUT_REASON, reason);
    } else {
      setLogoutReason(null);
      sessionStorage.removeItem(STORAGE_KEY_LOGOUT_REASON);
    }

    setUser(null);
  }, []);

  // Registra atividade recente
  const updateActivity = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    try {
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, String(now));
    } catch {
      // Ignora erro de cota
    }
  }, []);

  // Inicialização e checagem de persistência
  useEffect(() => {
    const isRemembered = localStorage.getItem(STORAGE_KEY_REMEMBER_ME) !== 'false';
    const hasSessionActive = sessionStorage.getItem(SESSION_KEY_ACTIVE) === 'true';

    // Se o usuário não marcou "Lembrar" e encerrou a sessão do navegador, desconecta
    if (!isRemembered && !hasSessionActive) {
      localStorage.removeItem(STORAGE_KEY_MOCK_SESSION);
      if (isSupabaseConfigured && supabase) {
        supabase.auth.signOut().catch(() => {});
      }
      setUser(null);
      setLoading(false);
      return;
    }

    // Verifica se a última atividade salva já estourou o tempo de inatividade
    const storedLastActivity = Number(localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY) || 0);
    const timeoutMs = isRemembered ? IDLE_TIMEOUT_REMEMBERED_MS : IDLE_TIMEOUT_TEMPORARY_MS;
    if (storedLastActivity && Date.now() - storedLastActivity >= timeoutMs) {
      localStorage.removeItem(STORAGE_KEY_MOCK_SESSION);
      sessionStorage.removeItem(SESSION_KEY_ACTIVE);
      if (isSupabaseConfigured && supabase) {
        supabase.auth.signOut().catch(() => {});
      }
      setUser(null);
      setLogoutReason('Sua sessão anterior foi encerrada por tempo de inatividade.');
      setLoading(false);
      return;
    }

    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } else {
      // Mock session check
      const mockLogged = localStorage.getItem(STORAGE_KEY_MOCK_SESSION);
      if (mockLogged) {
        setUser({
          email: localStorage.getItem(STORAGE_KEY_SAVED_EMAIL) || 'admin@pastelaria.com',
          id: 'mock-admin-id',
        });
      }
      setLoading(false);
    }
  }, []);

  // Monitora inatividade enquanto o usuário estiver logado
  useEffect(() => {
    if (!user) return;

    updateActivity();

    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

    let lastRecorded = 0;
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastRecorded > 3000) {
        lastRecorded = now;
        updateActivity();
      }
    };

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleUserActivity, { passive: true });
    });

    const checkIdleInterval = setInterval(() => {
      const isRemembered = localStorage.getItem(STORAGE_KEY_REMEMBER_ME) !== 'false';
      const timeoutMs = isRemembered ? IDLE_TIMEOUT_REMEMBERED_MS : IDLE_TIMEOUT_TEMPORARY_MS;

      const storedLastActivity = Number(localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY) || 0);
      const effectiveLastActivity = Math.max(lastActivityRef.current, storedLastActivity);

      const idleDuration = Date.now() - effectiveLastActivity;

      if (idleDuration >= timeoutMs) {
        logout('Sua conexão foi encerrada por tempo de inatividade para a sua segurança.');
      }
    }, 10000);

    return () => {
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserActivity);
      });
      clearInterval(checkIdleInterval);
    };
  }, [user, updateActivity, logout]);

  const login = async (
    email: string,
    pass: string,
    remember: boolean = true
  ): Promise<{ success: boolean; error?: string }> => {
    setRememberMe(remember);
    if (remember) {
      localStorage.setItem(STORAGE_KEY_REMEMBER_ME, 'true');
      localStorage.setItem(STORAGE_KEY_SAVED_EMAIL, email);
    } else {
      localStorage.setItem(STORAGE_KEY_REMEMBER_ME, 'false');
      localStorage.removeItem(STORAGE_KEY_SAVED_EMAIL);
    }

    sessionStorage.setItem(SESSION_KEY_ACTIVE, 'true');
    sessionStorage.removeItem(STORAGE_KEY_LOGOUT_REASON);
    setLogoutReason(null);

    const now = Date.now();
    lastActivityRef.current = now;
    localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, String(now));

    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      setUser(data.user);
      return { success: true };
    } else {
      // Login em modo Mock
      let mockUsers: Array<{ email: string; password: string }> = [];
      try {
        mockUsers = JSON.parse(localStorage.getItem('pastelaria_mock_users') || '[]');
      } catch {
        mockUsers = [];
      }
      const matchedUser = mockUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === pass
      );

      if ((email === 'admin@pastelaria.com' || email === 'admin') && pass === 'admin123' || matchedUser) {
        const mockUser = { email: matchedUser?.email || 'admin@pastelaria.com', id: 'mock-admin-id' };
        setUser(mockUser);
        localStorage.setItem(STORAGE_KEY_MOCK_SESSION, 'true');
        return { success: true };
      }
      return {
        success: false,
        error: 'Credenciais inválidas. Verifique o e-mail e senha informados.',
      };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: Boolean(user),
        loading,
        rememberMe,
        logoutReason,
        clearLogoutReason,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
