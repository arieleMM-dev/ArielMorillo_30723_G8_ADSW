/**
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  SUITE DE PRUEBAS — AgricultorService                           │
 * │  Casos: TC-03.1.1 / TC-03.1.2 / TC-03.2.1                      │
 * │         TC-03.3.1 / TC-03.3.2 / TC-03.4.1 / TC-03.4.2          │
 * │  Técnica: Mocking manual del UserRepository                     │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AgricultorService } from '@/lib/services/agricultor.service';

// ─── Mock: UserRepository ────────────────────────────────────────
vi.mock('@/lib/repositories', () => ({
  UserRepository: {
    findByEmailWithPassword: vi.fn(),
    findByEmail: vi.fn(),
    update: vi.fn().mockResolvedValue({ id: 'usr-001', isActive: true }),
    create: vi.fn(),
    findById: vi.fn(),
    existsByEmail: vi.fn(),
    existsByCedula: vi.fn(),
    search: vi.fn(),
    softDelete: vi.fn(),
  },
}));

// ─── Mock: AuthService (evitar dependencia circular) ─────────────
vi.mock('@/lib/services/auth.service', () => ({
  AuthService: {
    generarPasswordTemporal: vi.fn().mockReturnValue('TempPass123'),
    hashPassword: vi.fn().mockResolvedValue('$2b$12$hasheado'),
    revokeUser: vi.fn(),
    _revokedUserIds: new Set<string>(),
    isRevoked: vi.fn().mockReturnValue(false),
  },
}));

// ─── Mock: Prisma (para editar agricultor) ────────────────────────
vi.mock('@/lib/prisma', () => ({
  prisma: {
    passwordResetToken: {
      deleteMany: vi.fn().mockResolvedValue({}),
    },
  },
}));

import { UserRepository } from '@/lib/repositories';

// ─── Datos de prueba ──────────────────────────────────────────────
// Cédula ecuatoriana válida: 1714397104
// Verificación: coef=[2,1,2,1,2,1,2,1,2] → sum=46 → residuo=6 → dígito=4 ✓
const INPUT_VALIDO = {
  nombres: 'Pedro',
  apellidos: 'Guamán',
  cedula: '1714397104', // Cédula válida de Pichincha (verificada)
  email: 'pedro@finca.ec',
  telefono: '0991234567',
  rol: 'AGRICULTOR' as const,
};

const USER_CREADO = {
  id: 'usr-100',
  ...INPUT_VALIDO,
  isActive: true,
  passwordHash: '$2b$12$hasheado',
};

// ─────────────────────────────────────────────────────────────────
// CU-03.1 — Crear Agricultor
// ─────────────────────────────────────────────────────────────────
describe('CU-03 — AgricultorService.crear()', () => {
  beforeEach(() => vi.clearAllMocks());

  // TC-03.1.1 — Flujo Normal
  it('TC-03.1.1: Crea agricultor correctamente y retorna usuario + contraseña temporal', async () => {
    vi.mocked(UserRepository.existsByEmail).mockResolvedValue(false);
    vi.mocked(UserRepository.existsByCedula).mockResolvedValue(false);
    vi.mocked(UserRepository.create).mockResolvedValue(USER_CREADO as any);

    const resultado = await AgricultorService.crear(INPUT_VALIDO);

    expect(resultado.user).toBeDefined();
    expect(resultado._dev_password).toBe('TempPass123');
    expect(resultado.user.id).toBe('usr-100');
  });

  // TC-03.1.2 — Cédula duplicada
  it('TC-03.1.2: Lanza CEDULA_EN_USO cuando la cédula ya está registrada', async () => {
    vi.mocked(UserRepository.existsByEmail).mockResolvedValue(false);
    vi.mocked(UserRepository.existsByCedula).mockResolvedValue(true);

    await expect(AgricultorService.crear(INPUT_VALIDO)).rejects.toThrow('CEDULA_EN_USO');
  });

  // Validación de cédula ecuatoriana
  it('TC-03.1.X: Lanza CEDULA_INVALIDA cuando la cédula no es válida', async () => {
    const inputCedulaMala = { ...INPUT_VALIDO, cedula: '9999999999' };

    await expect(AgricultorService.crear(inputCedulaMala)).rejects.toThrow('CEDULA_INVALIDA');
  });

  // Email duplicado
  it('TC-03.1.Y: Lanza EMAIL_EN_USO cuando el email ya existe', async () => {
    vi.mocked(UserRepository.existsByEmail).mockResolvedValue(true);

    await expect(AgricultorService.crear(INPUT_VALIDO)).rejects.toThrow('EMAIL_EN_USO');
  });
});

// ─────────────────────────────────────────────────────────────────
// CU-03.2 — Consultar Agricultor
// ─────────────────────────────────────────────────────────────────
describe('CU-03 — AgricultorService.buscar()', () => {
  beforeEach(() => vi.clearAllMocks());

  // TC-03.2.1 — Flujo Normal
  it('TC-03.2.1: Devuelve lista de coincidencias al buscar por nombre o cédula', async () => {
    const mockLista = [USER_CREADO];
    vi.mocked(UserRepository.search).mockResolvedValue(mockLista as any);

    const resultado = await AgricultorService.buscar('Pedro');

    expect(resultado).toHaveLength(1);
    expect(resultado[0].nombres).toBe('Pedro');
  });
});

// ─────────────────────────────────────────────────────────────────
// CU-03.3 — Editar Agricultor
// ─────────────────────────────────────────────────────────────────
describe('CU-03 — AgricultorService.editar()', () => {
  beforeEach(() => vi.clearAllMocks());

  // TC-03.3.1 — Flujo Normal
  it('TC-03.3.1: Actualiza campos permitidos y retorna agricultor actualizado', async () => {
    vi.mocked(UserRepository.existsByEmail).mockResolvedValue(false);
    vi.mocked(UserRepository.update).mockResolvedValue({ ...USER_CREADO, nombres: 'Pedro Modificado' } as any);

    const resultado = await AgricultorService.editar('usr-100', { nombres: 'Pedro Modificado' });

    expect((resultado as any).nombres).toBe('Pedro Modificado');
  });

  // TC-03.3.2 — Correo duplicado
  it('TC-03.3.2: Lanza EMAIL_EN_USO cuando el email ya pertenece a otro usuario', async () => {
    vi.mocked(UserRepository.existsByEmail).mockResolvedValue(true);

    await expect(
      AgricultorService.editar('usr-100', { email: 'otro@finca.ec' })
    ).rejects.toThrow('EMAIL_EN_USO');
  });
});

// ─────────────────────────────────────────────────────────────────
// CU-03.4 — Desactivar Agricultor
// ─────────────────────────────────────────────────────────────────
describe('CU-03 — AgricultorService.desactivar()', () => {
  beforeEach(() => vi.clearAllMocks());

  // TC-03.4.1 — Flujo Normal
  it('TC-03.4.1: Realiza soft-delete y retorna usuario con isActive = false', async () => {
    vi.mocked(UserRepository.softDelete).mockResolvedValue({ ...USER_CREADO, isActive: false } as any);

    const resultado = await AgricultorService.desactivar('usr-100', 'admin-001');

    expect((resultado as any).isActive).toBe(false);
  });

  // TC-03.4.2 — Auto-desactivación bloqueada
  it('TC-03.4.2: Lanza SELF_DEACTIVATION cuando el admin intenta desactivar su propia cuenta', async () => {
    await expect(AgricultorService.desactivar('admin-001', 'admin-001')).rejects.toThrow('SELF_DEACTIVATION');
  });
});

// ─────────────────────────────────────────────────────────────────
// Regla pura: Validación de cédula ecuatoriana
// ─────────────────────────────────────────────────────────────────
describe('AgricultorService.validarCedulaEC() — Algoritmo dígito verificador', () => {
  it('Acepta cédula válida de Pichincha (17xxxxxxxx)', () => {
    // Cédula 1714397104: coeficientes [2,1,2,1,2,1,2,1,2] → suma=46 → residuo=6 → digito=4
    expect(AgricultorService.validarCedulaEC('1714397104')).toBe(true);
  });

  it('Rechaza cédula con dígito verificador incorrecto', () => {
    expect(AgricultorService.validarCedulaEC('1723456780')).toBe(false);
  });

  it('Rechaza cédula con menos de 10 dígitos', () => {
    expect(AgricultorService.validarCedulaEC('123456789')).toBe(false);
  });

  it('Rechaza cédula con código de provincia inválido (>24)', () => {
    expect(AgricultorService.validarCedulaEC('9923456789')).toBe(false);
  });

  it('Rechaza cédula con letras', () => {
    expect(AgricultorService.validarCedulaEC('17ABCD6789')).toBe(false);
  });
});
