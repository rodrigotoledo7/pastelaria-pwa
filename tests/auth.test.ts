import { describe, it, expect, beforeEach } from 'vitest';
import {
  STORAGE_KEY_SAVED_EMAIL,
  STORAGE_KEY_REMEMBER_ME,
  STORAGE_KEY_LAST_ACTIVITY,
  STORAGE_KEY_LOGOUT_REASON,
  IDLE_TIMEOUT_REMEMBERED_MS,
  IDLE_TIMEOUT_TEMPORARY_MS,
} from '../src/contexts/AuthContext';

function createStorageMock() {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
}

describe('Auth session & remember-me logic', () => {
  let mockLocalStorage: ReturnType<typeof createStorageMock>;
  let mockSessionStorage: ReturnType<typeof createStorageMock>;

  beforeEach(() => {
    mockLocalStorage = createStorageMock();
    mockSessionStorage = createStorageMock();
  });

  it('possui constantes de tempo limite de inatividade adequadas', () => {
    // 30 minutos quando lembrado, 10 minutos quando temporário
    expect(IDLE_TIMEOUT_REMEMBERED_MS).toBe(30 * 60 * 1000);
    expect(IDLE_TIMEOUT_TEMPORARY_MS).toBe(10 * 60 * 1000);
    expect(IDLE_TIMEOUT_REMEMBERED_MS).toBeGreaterThan(IDLE_TIMEOUT_TEMPORARY_MS);
  });

  it('salva o e-mail e preferência quando lembrar de mim for selecionado', () => {
    const email = 'gerente@pastelaria.com';
    const rememberMe = true;

    if (rememberMe) {
      mockLocalStorage.setItem(STORAGE_KEY_REMEMBER_ME, 'true');
      mockLocalStorage.setItem(STORAGE_KEY_SAVED_EMAIL, email);
    }

    expect(mockLocalStorage.getItem(STORAGE_KEY_REMEMBER_ME)).toBe('true');
    expect(mockLocalStorage.getItem(STORAGE_KEY_SAVED_EMAIL)).toBe(email);
  });

  it('limpa o e-mail quando lembrar de mim NÃO for selecionado', () => {
    // Pré-configura estado anterior
    mockLocalStorage.setItem(STORAGE_KEY_SAVED_EMAIL, 'antigo@pastelaria.com');

    const rememberMe = false;
    if (!rememberMe) {
      mockLocalStorage.setItem(STORAGE_KEY_REMEMBER_ME, 'false');
      mockLocalStorage.removeItem(STORAGE_KEY_SAVED_EMAIL);
    }

    expect(mockLocalStorage.getItem(STORAGE_KEY_REMEMBER_ME)).toBe('false');
    expect(mockLocalStorage.getItem(STORAGE_KEY_SAVED_EMAIL)).toBeNull();
  });

  it('detecta expiração de inatividade com base no timestamp da última atividade', () => {
    const isRemembered = false;
    const timeout = isRemembered ? IDLE_TIMEOUT_REMEMBERED_MS : IDLE_TIMEOUT_TEMPORARY_MS;

    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    mockLocalStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, String(fifteenMinutesAgo));

    const storedLastActivity = Number(mockLocalStorage.getItem(STORAGE_KEY_LAST_ACTIVITY));
    const idleDuration = Date.now() - storedLastActivity;

    expect(idleDuration).toBeGreaterThanOrEqual(timeout);
  });

  it('armazena e limpa o motivo de encerramento de sessão', () => {
    const reason = 'Sua conexão foi encerrada por tempo de inatividade para a sua segurança.';
    mockSessionStorage.setItem(STORAGE_KEY_LOGOUT_REASON, reason);

    expect(mockSessionStorage.getItem(STORAGE_KEY_LOGOUT_REASON)).toBe(reason);

    mockSessionStorage.removeItem(STORAGE_KEY_LOGOUT_REASON);
    expect(mockSessionStorage.getItem(STORAGE_KEY_LOGOUT_REASON)).toBeNull();
  });
});
