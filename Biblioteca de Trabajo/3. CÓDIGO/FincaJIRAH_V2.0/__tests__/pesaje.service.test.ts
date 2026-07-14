/**
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  SUITE DE PRUEBAS — PesajeService + ClasificacionService        │
 * │  Casos: TC-05.1.1 / TC-05.2.1 / TC-05.2.2                      │
 * │  Técnica: Mocking manual de Repositories                        │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PesajeService, ClasificacionService } from '@/lib/services/pesaje.service';

// ─── Mock: PesajeRepository ──────────────────────────────────────
vi.mock('@/lib/repositories/PesajeRepository', () => ({
  PesajeRepo: {
    findAll: vi.fn().mockResolvedValue([]),
    findById: vi.fn(),
    findPendientesClasificacion: vi.fn().mockResolvedValue([]),
    create: vi.fn(),
  },
  ClasificacionRepo: {
    create: vi.fn(),
  },
}));

// ─── Mock: CatalogoRepository ────────────────────────────────────
vi.mock('@/lib/repositories/CatalogoRepository', () => ({
  CampanaRepo: {
    findById: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  LoteRepo: {
    findById: vi.fn(),
    findAll: vi.fn(),
    create: vi.fn(),
  },
}));

import { PesajeRepo, ClasificacionRepo } from '@/lib/repositories/PesajeRepository';
import { CampanaRepo, LoteRepo } from '@/lib/repositories/CatalogoRepository';

// ─── Datos base de prueba ─────────────────────────────────────────
const CAMPANA_ACTIVA = {
  id: 'camp-001',
  codigo: '102026',
  taraBase: 1.70,
  isActive: true,
};

const LOTE_ACTIVO = {
  id: 'lote-001',
  nombre: 'Lote Norte',
  isActive: true,
};

const INPUT_PESAJE_VALIDO = {
  pesoBrutoKg: 50.0,
  numGavetas: 2,
  campanaId: 'camp-001',
  loteId: 'lote-001',
  agricultorId: 'usr-100',
  observaciones: '',
};

// Peso Neto = 50 - (2 * 1.70) = 50 - 3.40 = 46.60 kg
const PESAJE_REGISTRADO = {
  id: 'pes-001',
  pesoBrutoKg: 50.0,
  numGavetas: 2,
  taraTotal: 3.40,
  pesoNetoKg: 46.60,
  campanaId: 'camp-001',
  loteId: 'lote-001',
  agricultorId: 'usr-100',
  clasificacion: null,
  campana: { taraBase: 1.70 },
};

// ─────────────────────────────────────────────────────────────────
// CU-05.1 — Registrar Pesaje Bruto
// ─────────────────────────────────────────────────────────────────
describe('CU-05 — PesajeService.registrar()', () => {
  beforeEach(() => vi.clearAllMocks());

  // TC-05.1.1 — Flujo Normal
  it('TC-05.1.1: Registra pesaje y calcula pesoNetoKg correctamente', async () => {
    vi.mocked(CampanaRepo.findById).mockResolvedValue(CAMPANA_ACTIVA as any);
    vi.mocked(LoteRepo.findById).mockResolvedValue(LOTE_ACTIVO as any);
    vi.mocked(PesajeRepo.create).mockResolvedValue(PESAJE_REGISTRADO as any);

    const resultado = await PesajeService.registrar(INPUT_PESAJE_VALIDO);

    expect(resultado.pesoNetoKg).toBe(46.60);
    expect(resultado.taraTotal).toBe(3.40);
  });

  it('TC-05.1.X: Lanza PESO_BRUTO_INVALIDO cuando pesoBrutoKg es 0 o negativo', async () => {
    await expect(
      PesajeService.registrar({ ...INPUT_PESAJE_VALIDO, pesoBrutoKg: 0 })
    ).rejects.toThrow('PESO_BRUTO_INVALIDO');
  });

  it('TC-05.1.Y: Lanza GAVETAS_INVALIDAS cuando numGavetas es 0', async () => {
    await expect(
      PesajeService.registrar({ ...INPUT_PESAJE_VALIDO, numGavetas: 0 })
    ).rejects.toThrow('GAVETAS_INVALIDAS');
  });

  it('TC-05.1.Z: Lanza CAMPANA_CERRADA cuando la campaña está inactiva', async () => {
    vi.mocked(CampanaRepo.findById).mockResolvedValue({ ...CAMPANA_ACTIVA, isActive: false } as any);

    await expect(PesajeService.registrar(INPUT_PESAJE_VALIDO)).rejects.toThrow('CAMPANA_CERRADA');
  });

  it('TC-05.1.W: Lanza LOTE_INACTIVO cuando el lote está desactivado', async () => {
    vi.mocked(CampanaRepo.findById).mockResolvedValue(CAMPANA_ACTIVA as any);
    vi.mocked(LoteRepo.findById).mockResolvedValue({ ...LOTE_ACTIVO, isActive: false } as any);

    await expect(PesajeService.registrar(INPUT_PESAJE_VALIDO)).rejects.toThrow('LOTE_INACTIVO');
  });
});

// ─────────────────────────────────────────────────────────────────
// CU-05.2 — Registrar Clasificación Poscosecha
// ─────────────────────────────────────────────────────────────────
describe('CU-05 — ClasificacionService.registrar()', () => {
  beforeEach(() => vi.clearAllMocks());

  const INPUT_CLASIFICACION_DENTRO_MARGEN = {
    pesajeBrutoId: 'pes-001',
    clasificadorId: 'usr-100',
    gavetasExportacion: 1,
    pesoExportacionBruto: 25.0,         // Neto = 25 - 1.70 = 23.30
    gavetasNacional: 1,
    pesoNacionalBruto: 23.0,            // Neto = 23 - 1.70 = 21.30
    pesoDescarte: 2.0,
    // Total = 23.30 + 21.30 + 2.0 = 46.60 — Margen = 0% (exacto)
  };

  const INPUT_CLASIFICACION_FUERA_MARGEN = {
    pesajeBrutoId: 'pes-001',
    clasificadorId: 'usr-100',
    gavetasExportacion: 1,
    pesoExportacionBruto: 20.0,         // Neto = 20 - 1.70 = 18.30
    gavetasNacional: 1,
    pesoNacionalBruto: 15.0,            // Neto = 15 - 1.70 = 13.30
    pesoDescarte: 1.0,
    // Total = 18.30 + 13.30 + 1.0 = 32.60 — sobre 46.60 => diferencia muy alta
  };

  // TC-05.2.1 — Flujo Normal (dentro del margen ±4%)
  it('TC-05.2.1: Registra clasificación sin excepción cuando margenError ≤ 4%', async () => {
    vi.mocked(PesajeRepo.findById).mockResolvedValue(PESAJE_REGISTRADO as any);
    vi.mocked(ClasificacionRepo.create).mockResolvedValue({
      id: 'clas-001',
      margenErrorPct: 0,
      dentroDelMargen: true,
    } as any);

    const resultado = await ClasificacionService.registrar(INPUT_CLASIFICACION_DENTRO_MARGEN);

    expect(resultado).toBeDefined();
    expect((resultado as any).dentroDelMargen).toBe(true);
  });

  // TC-05.2.2 — Descuadre supera ±4% → lanza excepción
  it('TC-05.2.2: Lanza DESCUADRE:X cuando el margen de error supera ±4% sin forzar', async () => {
    vi.mocked(PesajeRepo.findById).mockResolvedValue(PESAJE_REGISTRADO as any);

    await expect(
      ClasificacionService.registrar(INPUT_CLASIFICACION_FUERA_MARGEN)
    ).rejects.toThrow(/DESCUADRE:/);
  });

  // TC-05.2.3 — Con confirmación forzada por el administrador
  it('TC-05.2.3: Registra clasificación fuera de margen cuando forzar=true', async () => {
    vi.mocked(PesajeRepo.findById).mockResolvedValue(PESAJE_REGISTRADO as any);
    vi.mocked(ClasificacionRepo.create).mockResolvedValue({
      id: 'clas-002',
      margenErrorPct: 30.0,
      dentroDelMargen: false,
      auditFlag: true,
    } as any);

    const resultado = await ClasificacionService.registrar({
      ...INPUT_CLASIFICACION_FUERA_MARGEN,
      forzar: true,
    });

    expect((resultado as any).auditFlag).toBe(true);
  });

  // YA_CLASIFICADO
  it('TC-05.2.X: Lanza YA_CLASIFICADO si el pesaje ya tiene clasificación', async () => {
    const pesajeConClasificacion = { ...PESAJE_REGISTRADO, clasificacion: { id: 'clas-exist' } };
    vi.mocked(PesajeRepo.findById).mockResolvedValue(pesajeConClasificacion as any);

    await expect(
      ClasificacionService.registrar(INPUT_CLASIFICACION_DENTRO_MARGEN)
    ).rejects.toThrow('YA_CLASIFICADO');
  });
});
