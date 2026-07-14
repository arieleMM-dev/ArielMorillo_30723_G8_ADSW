/**
 * ══════════════════════════════════════════════════════════════
 *  SUITE: CU-05.3 — AjusteService (Ajuste de Comprador)
 *  Cubre: Registrar ajuste, validar peso rechazado, fruta efectiva
 *  Patrón: Pruebas unitarias de servicio con mocks de Prisma
 * ══════════════════════════════════════════════════════════════
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── MOCKS ──────────────────────────────────────────────────────────
vi.mock('@/lib/repositories/AjusteRepository', () => ({
  AjusteRepo: {
    findAll:             vi.fn(),
    findById:            vi.fn(),
    findByClasificacion: vi.fn(),
    create:              vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    clasificacion: {
      findUnique: vi.fn(),
    },
    comprador: {
      findUnique: vi.fn(),
    },
    ajusteComprador: {
      findMany:   vi.fn(),
      findUnique: vi.fn(),
      create:     vi.fn(),
    },
  },
}));

import { AjusteService } from '@/lib/services/ajuste.service';
import { AjusteRepo } from '@/lib/repositories/AjusteRepository';
import { prisma } from '@/lib/prisma';

// Datos base reutilizables
const mockClasificacion = {
  id: 'clf1',
  pesoExportacionKg: 46.60,
  dentroDelMargen: true,
  auditFlag: false,
  ajusteComprador: null, // Sin ajuste previo
  pesajeBruto: {
    campana: { compradorId: 'cp1' },
  },
};

const mockComprador = {
  id: 'cp1',
  nombre: 'AgroExport SA',
  tipo: 'EXPORTADOR',
  isActive: true,
};

// ════════════════════════════════════════════════════════════════
//  CU-05.3 — AjusteService.registrar()
// ════════════════════════════════════════════════════════════════
describe('CU-05.3 — AjusteService.registrar()', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── TC-05.3.1: Flujo Normal ────────────────────────────────
  it('TC-05.3.1: Registra ajuste y calcula pesoEfectivo y %FrutaEfectiva correctamente', async () => {
    vi.mocked(prisma.clasificacion.findUnique).mockResolvedValue(mockClasificacion as any);
    vi.mocked(prisma.comprador.findUnique).mockResolvedValue(mockComprador as any);

    const mockAjuste = { id: 'aj1', pesoRechazado: 2.5, ajusteKg: 44.1, clasificacionId: 'clf1', compradorId: 'cp1' };
    vi.mocked(AjusteRepo.create).mockResolvedValue(mockAjuste as any);

    const result = await AjusteService.registrar({
      clasificacionId: 'clf1',
      compradorId: 'cp1',
      pesoRechazado: 2.5,
      motivoRechazo: 'Daño mecánico',
    });

    expect(result.ajuste).toBeDefined();
    expect(result.metricas.pesoEfectivo).toBeCloseTo(44.1, 2);
    // 44.1 / 46.60 * 100 ≈ 94.64%
    expect(result.metricas.pctFrutaEfectiva).toBeGreaterThan(90);
    expect(result.metricas.pesoExportacionOriginal).toBe(46.60);
    expect(result.metricas.pesoRechazado).toBe(2.5);
  });

  // ─── TC-05.3.2: Ajuste = 0 (rechazo cero, sin descuento) ───
  it('TC-05.3.2: Permite pesoRechazado = 0 (sin descuento de comprador)', async () => {
    vi.mocked(prisma.clasificacion.findUnique).mockResolvedValue(mockClasificacion as any);
    vi.mocked(prisma.comprador.findUnique).mockResolvedValue(mockComprador as any);

    const mockAjuste = { id: 'aj2', pesoRechazado: 0, ajusteKg: 46.60, clasificacionId: 'clf1', compradorId: 'cp1' };
    vi.mocked(AjusteRepo.create).mockResolvedValue(mockAjuste as any);

    const result = await AjusteService.registrar({
      clasificacionId: 'clf1',
      compradorId: 'cp1',
      pesoRechazado: 0,
    });

    expect(result.metricas.pesoEfectivo).toBeCloseTo(46.60, 2);
    expect(result.metricas.pctFrutaEfectiva).toBeCloseTo(100, 1);
  });

  // ─── TC-05.3.3: Error — Clasificación no existe ─────────────
  it('TC-05.3.3: Lanza CLASIFICACION_NO_ENCONTRADA si no existe la clasificación', async () => {
    vi.mocked(prisma.clasificacion.findUnique).mockResolvedValue(null);

    await expect(AjusteService.registrar({
      clasificacionId: 'noexiste',
      compradorId: 'cp1',
      pesoRechazado: 1.0,
    })).rejects.toThrow('CLASIFICACION_NO_ENCONTRADA');
  });

  // ─── TC-05.3.4: Error — Ajuste duplicado ────────────────────
  it('TC-05.3.4: Lanza AJUSTE_YA_REGISTRADO si ya existe un ajuste para esa clasificación', async () => {
    const conAjustePrevio = {
      ...mockClasificacion,
      ajusteComprador: { id: 'aj-prev', pesoRechazado: 1.0 }, // Ya tiene ajuste
    };
    vi.mocked(prisma.clasificacion.findUnique).mockResolvedValue(conAjustePrevio as any);

    await expect(AjusteService.registrar({
      clasificacionId: 'clf1',
      compradorId: 'cp1',
      pesoRechazado: 2.0,
    })).rejects.toThrow('AJUSTE_YA_REGISTRADO');
  });

  // ─── TC-05.3.5: Error — Rechazo excede exportación ──────────
  it('TC-05.3.5: Lanza RECHAZO_EXCEDE_EXPORTACION si pesoRechazado > pesoExportacionKg', async () => {
    vi.mocked(prisma.clasificacion.findUnique).mockResolvedValue(mockClasificacion as any);

    await expect(AjusteService.registrar({
      clasificacionId: 'clf1',
      compradorId: 'cp1',
      pesoRechazado: 50.0, // Excede los 46.60 kg de exportación
    })).rejects.toThrow('RECHAZO_EXCEDE_EXPORTACION');
  });

  // ─── TC-05.3.6: Error — Comprador no existe ─────────────────
  it('TC-05.3.6: Lanza COMPRADOR_NO_ENCONTRADO si el comprador no existe en BD', async () => {
    vi.mocked(prisma.clasificacion.findUnique).mockResolvedValue(mockClasificacion as any);
    vi.mocked(prisma.comprador.findUnique).mockResolvedValue(null);

    await expect(AjusteService.registrar({
      clasificacionId: 'clf1',
      compradorId: 'noexiste',
      pesoRechazado: 2.0,
    })).rejects.toThrow('COMPRADOR_NO_ENCONTRADO');
  });

  // ─── TC-05.3.7: Error — Peso rechazado negativo ─────────────
  it('TC-05.3.7: Lanza PESO_RECHAZADO_INVALIDO si pesoRechazado < 0', async () => {
    vi.mocked(prisma.clasificacion.findUnique).mockResolvedValue(mockClasificacion as any);

    await expect(AjusteService.registrar({
      clasificacionId: 'clf1',
      compradorId: 'cp1',
      pesoRechazado: -1.5,
    })).rejects.toThrow('PESO_RECHAZADO_INVALIDO');
  });

  // ─── TC-05.3.8: Cálculo exacto (ajusteKg = 3 decimales) ────
  it('TC-05.3.8: El ajusteKg se redondea a 3 decimales correctamente', async () => {
    vi.mocked(prisma.clasificacion.findUnique).mockResolvedValue(mockClasificacion as any);
    vi.mocked(prisma.comprador.findUnique).mockResolvedValue(mockComprador as any);

    // Forzar que AjusteRepo.create capture el ajusteKg calculado
    let capturedAjusteKg = 0;
    vi.mocked(AjusteRepo.create).mockImplementation(async (data: any) => {
      capturedAjusteKg = data.ajusteKg;
      return { id: 'aj3', ...data } as any;
    });

    await AjusteService.registrar({
      clasificacionId: 'clf1',
      compradorId: 'cp1',
      pesoRechazado: 1.333,
    });

    // 46.60 - 1.333 = 45.267 (3 decimales exactos)
    expect(capturedAjusteKg).toBe(45.267);
  });
});
