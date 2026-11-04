import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createAdminUser,
  getLocalAdminUsers,
  removeAdminUser,
  saveLocalAdminUsers,
} from '../src/lib/userManagement';

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

describe('userManagement', () => {
  beforeEach(() => {
    const mockStorage = createStorageMock();
    vi.stubGlobal('localStorage', mockStorage);
  });

  it('valida e-mail inválido', async () => {
    const res = await createAdminUser('emailinvalido', '123456');
    expect(res.success).toBe(false);
    expect(res.error).toContain('e-mail válido');
  });

  it('valida senha muito curta (< 6 caracteres)', async () => {
    const res = await createAdminUser('admin2@pastelaria.com', '123');
    expect(res.success).toBe(false);
    expect(res.error).toContain('mínimo 6 caracteres');
  });

  it('cria novo administrador com sucesso em modo mock', async () => {
    const res = await createAdminUser('gerente@pastelaria.com', 'gerente123');
    expect(res.success).toBe(true);
    expect(res.user?.email).toBe('gerente@pastelaria.com');
    expect(res.user?.role).toBe('Administrador');

    const list = getLocalAdminUsers();
    expect(list.some((u) => u.email === 'gerente@pastelaria.com')).toBe(true);
  });

  it('rejeita e-mail duplicado', async () => {
    await createAdminUser('sócia@pastelaria.com', 'senha123');
    const duplicate = await createAdminUser('sócia@pastelaria.com', 'outrasenha');
    expect(duplicate.success).toBe(false);
    expect(duplicate.error).toContain('já está cadastrado');
  });

  it('permite remover usuário cadastrado', async () => {
    const res = await createAdminUser('temp@pastelaria.com', 'senha123');
    expect(res.success).toBe(true);

    if (res.user) {
      removeAdminUser(res.user.id);
      const list = getLocalAdminUsers();
      expect(list.some((u) => u.id === res.user?.id)).toBe(false);
    }
  });
});
