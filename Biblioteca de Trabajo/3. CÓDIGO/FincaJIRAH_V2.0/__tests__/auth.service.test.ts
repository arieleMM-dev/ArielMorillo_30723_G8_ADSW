/**
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  SUITE DE PRUEBAS — AuthService                                 │
 * │  Casos: TC-01.1.1 / TC-01.1.2 / TC-01.1.3                      │
 * │         TC-01.2.1 / TC-01.2.2 / TC-01.2.3                      │
 * │  Técnica: Mocking manual del UserRepository y Prisma            │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '@/lib/services/auth.service';

// ─── Mock: UserRepository ────────────────────────────────────────
vi.mock('@/lib/repositories', () => ({
  UserRepository: {
    findByEmailWithPassword: vi.fn(),
    findByEmail: vi.fn(),
    update: vi.fn().mockResolvedValue({}),
    create: vi.fn(),
    findById: vi.fn(),
    existsByEmail: vi.fn(),
    existsByCedula: vi.fn(),
    search: vi.fn(),
    softDelete: vi.fn(),
  },
}));

// ─── Mock: Prisma (PasswordResetToken) ───────────────────────────
vi.mock('@/lib/prisma', () => ({
  prisma: {
    passwordResetToken: {
      create: vi.fn().mockResolvedValue({ id: 'tok-1' }),
      findMany: vi.fn().mockResolvedValue([]),
      update: vi.fn().mockResolvedValue({}),
      deleteMany: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { UserRepository } from '@/lib/repositories';
import bcrypt from 'bcryptjs';

// ─── Datos de prueba base ─────────────────────────────────────────
const HASH_CORRECTO = await bcrypt.hash('Password1', 10);

const USER_ACTIVO = {
  id: 'usr-001',
  email: 'juan@finca.ec',
  passwordHash: HASH_CORRECTO,
  isActive: true,
  nombres: 'Juan',
  apellidos: 'Lara',
};

const USER_INACTIVO = { ...USER_ACTIVO, isActive: false };

// ─────────────────────────────────────────────────────────────────
// CU-01: Acceder al Sistema
// ─────────────────────────────────────────────────────────────────
describe('CU-01 — AuthService.login()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Limpiar observadores y blacklist entre pruebas
    AuthService._revokedUserIds.clear();
  });

  // TC-01.1.1 — Iniciar sesión (Flujo Normal)
  it('TC-01.1.1: Retorna datos del usuario sin passwordHash cuando las credenciales son correctas', async () => {
    vi.mocked(UserRepository.findByEmailWithPassword).mockResolvedValue(USER_ACTIVO as any);

    const resultado = await AuthService.login('juan@finca.ec', 'Password1');

    expect(resultado).not.toBeNull();
    expect(resultado).not.toHaveProperty('passwordHash');
    expect(resultado?.id).toBe('usr-001');
    expect(resultado?.email).toBe('juan@finca.ec');
  });

  // TC-01.1.2 — Credenciales inválidas
  it('TC-01.1.2: Retorna null cuando la contraseña es incorrecta', async () => {
    vi.mocked(UserRepository.findByEmailWithPassword).mockResolvedValue(USER_ACTIVO as any);

    const resultado = await AuthService.login('juan@finca.ec', 'ClaveErronea1');

    expect(resultado).toBeNull();
  });

  // TC-01.1.2 (variante) — Email inexistente
  it('TC-01.1.2b: Retorna null cuando el usuario no existe', async () => {
    vi.mocked(UserRepository.findByEmailWithPassword).mockResolvedValue(null as any);

    const resultado = await AuthService.login('noexiste@finca.ec', 'Password1');

    expect(resultado).toBeNull();
  });

  // TC-01.1.3 — Cuenta inactiva
  it('TC-01.1.3: Lanza ACCOUNT_INACTIVE cuando la cuenta está desactivada', async () => {
    vi.mocked(UserRepository.findByEmailWithPassword).mockResolvedValue(USER_INACTIVO as any);

    await expect(AuthService.login('juan@finca.ec', 'Password1')).rejects.toThrow('ACCOUNT_INACTIVE');
  });
});

// ─────────────────────────────────────────────────────────────────
// CU-01: Recuperación de contraseña
// ─────────────────────────────────────────────────────────────────
describe('CU-01 — AuthService.generarTokenRecuperacion()', () => {
  beforeEach(() => vi.clearAllMocks());

  // TC-01.2.1 — Flujo normal
  it('TC-01.2.1: Genera un token y lo retorna cuando el correo existe', async () => {
    vi.mocked(UserRepository.findByEmail).mockResolvedValue({ id: 'usr-001', email: 'juan@finca.ec' } as any);

    const token = await AuthService.generarTokenRecuperacion('juan@finca.ec');

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token!.length).toBeGreaterThan(10);
  });

  // TC-01.2.2 — Correo inexistente (seguridad: no revelar existencia)
  it('TC-01.2.2: Retorna null silenciosamente cuando el correo no está registrado', async () => {
    vi.mocked(UserRepository.findByEmail).mockResolvedValue(null as any);

    const resultado = await AuthService.generarTokenRecuperacion('noexiste@finca.ec');

    expect(resultado).toBeNull();
  });

  // TC-01.2.3 — Token caducado
  it('TC-01.2.3: Lanza TOKEN_EXPIRADO cuando el token fue generado hace más de 1 hora', async () => {
    const tokenPlano = 'test-token-valido';
    const tokenHash = await bcrypt.hash(tokenPlano, 10);
    const expirado = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 horas atrás

    const { prisma } = await import('@/lib/prisma');
    vi.mocked(prisma.passwordResetToken.findMany).mockResolvedValue([
      {
        id: 'rt-001',
        token: tokenHash,
        userId: 'usr-001',
        expiresAt: expirado,
        usedAt: null,
        user: USER_ACTIVO as any,
        createdAt: new Date(),
      },
    ] as any);

    await expect(AuthService.resetearPassword(tokenPlano, 'NuevaPass1')).rejects.toThrow('TOKEN_EXPIRADO');
  });
});

// ─────────────────────────────────────────────────────────────────
// Funciones puras de AuthService
// ─────────────────────────────────────────────────────────────────
describe('CU-01 — AuthService.validarFortaleza()', () => {
  it('Rechaza contraseñas con menos de 8 caracteres', () => {
    expect(AuthService.validarFortaleza('Ab1').ok).toBe(false);
  });
  it('Rechaza contraseñas sin mayúsculas', () => {
    expect(AuthService.validarFortaleza('password1').ok).toBe(false);
  });
  it('Rechaza contraseñas sin números', () => {
    expect(AuthService.validarFortaleza('Password').ok).toBe(false);
  });
  it('Aprueba una contraseña que cumple todos los requisitos', () => {
    expect(AuthService.validarFortaleza('Seguro123').ok).toBe(true);
  });
});

describe('CU-01 — AuthService: Blacklist de sesiones', () => {
  beforeEach(() => AuthService._revokedUserIds.clear());

  it('isRevoked() retorna false para un usuario no revocado', () => {
    expect(AuthService.isRevoked('usr-001')).toBe(false);
  });

  it('revokeUser() y isRevoked() funcionan correctamente', () => {
    AuthService.revokeUser('usr-001');
    expect(AuthService.isRevoked('usr-001')).toBe(true);
  });
});
