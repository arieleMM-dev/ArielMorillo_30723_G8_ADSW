/**
 * ══════════════════════════════════════════════════════════════
 *  SUITE: CU-06 — Dashboard / Analítica
 *  Cubre: DashboardRepo.getStats() — agregaciones y métricas
 *  Patrón: Pruebas unitarias con mock de Prisma
 * ══════════════════════════════════════════════════════════════
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── MOCK DE PRISMA ──────────────────────────────────────────────────
vi.mock('@/lib/prisma', () => ({
  prisma: {
    pesajeBruto: {
      aggregate:  vi.fn(),
      findMany:   vi.fn(),
    },
    campana: {
      findFirst:  vi.fn(),
      findMany:   vi.fn(),
    },
    clasificacion: {
      count: vi.fn(),
    },
    lote: {
      findMany: vi.fn(),
    },
  },
}));

import { DashboardRepo } from '@/lib/repositories/DashboardRepository';
import { prisma } from '@/lib/prisma';

// ════════════════════════════════════════════════════════════════
//  CU-06 — DashboardRepo.getStats()
// ════════════════════════════════════════════════════════════════
describe('CU-06 — DashboardRepo.getStats()', () => {
  beforeEach(() => vi.clearAllMocks());

  // Datos base para los mocks
  const mockAggregate = { _sum: { pesoNetoKg: 1250.50 }, _count: { id: 28 } };
  const mockCampanaActiva = { id: 'c1', codigo: 'CA-2026', nombre: 'Campaña 2026', isActive: true };
  const mockAlertasMargen = 3;
  const mockLotesConActividad = [{ loteId: 'l1' }, { loteId: 'l2' }];
  const mockActividadReciente = [
    { id: 'pb1', pesoNetoKg: 48.5, fechaRegistro: new Date(), agricultor: { nombres: 'Juan', apellidos: 'Pérez' }, campana: { codigo: 'CA-2026' }, lote: { codigo: 'LT-01', nombre: 'Lote Norte' }, clasificacion: { dentroDelMargen: true, auditFlag: false } },
    { id: 'pb2', pesoNetoKg: 32.2, fechaRegistro: new Date(), agricultor: { nombres: 'Ana', apellidos: 'García' }, campana: { codigo: 'CA-2026' }, lote: { codigo: 'LT-02', nombre: 'Lote Sur' }, clasificacion: { dentroDelMargen: false, auditFlag: true } },
  ];
  const mockPesajesRaw = [
    { loteId: 'l1', pesoNetoKg: 48.5, lote: { codigo: 'LT-01' }, clasificacion: { dentroDelMargen: true } },
    { loteId: 'l2', pesoNetoKg: 32.2, lote: { codigo: 'LT-02' }, clasificacion: { dentroDelMargen: false } },
    { loteId: 'l1', pesoNetoKg: 50.0, lote: { codigo: 'LT-01' }, clasificacion: { dentroDelMargen: true } },
  ];

  function setupMocks() {
    vi.mocked(prisma.pesajeBruto.aggregate).mockResolvedValue(mockAggregate as any);
    vi.mocked(prisma.campana.findFirst).mockResolvedValue(mockCampanaActiva as any);
    vi.mocked(prisma.clasificacion.count).mockResolvedValue(mockAlertasMargen);
    vi.mocked(prisma.pesajeBruto.findMany)
      .mockResolvedValueOnce(mockLotesConActividad as any) // primera llamada: distinct
      .mockResolvedValueOnce(mockActividadReciente as any) // segunda llamada: actividadReciente
      .mockResolvedValueOnce(mockPesajesRaw as any);      // tercera llamada: kgPorLote
  }

  // ─── TC-06.1: Estadísticas globales ─────────────────────────
  it('TC-06.1: Retorna kgTotal y totalPesajes correctamente desde la agregación', async () => {
    setupMocks();
    const stats = await DashboardRepo.getStats();

    expect(stats.kgTotal).toBeCloseTo(1250.50, 2);
    expect(stats.totalPesajes).toBe(28);
  });

  // ─── TC-06.2: Campaña activa ─────────────────────────────────
  it('TC-06.2: Incluye campanaActiva en el resultado', async () => {
    setupMocks();
    const stats = await DashboardRepo.getStats();

    expect(stats.campanaActiva).toBeDefined();
    expect(stats.campanaActiva?.codigo).toBe('CA-2026');
    expect(stats.campanaActiva?.isActive).toBe(true);
  });

  // ─── TC-06.3: Lotes con actividad ───────────────────────────
  it('TC-06.3: Cuenta correctamente los lotes con actividad en el periodo', async () => {
    setupMocks();
    const stats = await DashboardRepo.getStats();

    expect(stats.lotesConActividad).toBe(2); // 2 lotes distintos en mockLotesConActividad
  });

  // ─── TC-06.4: Alertas de margen ─────────────────────────────
  it('TC-06.4: Retorna el número de alertas de margen (auditFlag=true)', async () => {
    setupMocks();
    const stats = await DashboardRepo.getStats();

    expect(stats.alertasMargen).toBe(3);
  });

  // ─── TC-06.5: kgPorLote — agrupación y ordenamiento ─────────
  it('TC-06.5: Agrupa pesajes por lote y acumula KG correctamente', async () => {
    setupMocks();
    const stats = await DashboardRepo.getStats();

    // LT-01 tiene 2 pesajes: 48.5 + 50.0 = 98.5 kg
    // LT-02 tiene 1 pesaje: 32.2 kg
    const lt01 = stats.kgPorLote.find((l: any) => l.codigo === 'LT-01');
    const lt02 = stats.kgPorLote.find((l: any) => l.codigo === 'LT-02');

    expect(lt01?.kg).toBeCloseTo(98.5, 1);
    expect(lt02?.kg).toBeCloseTo(32.2, 1);
  });

  // ─── TC-06.6: kgPorLote — alertas por lote ──────────────────
  it('TC-06.6: Cuenta alertas por lote (clasificaciones fuera del margen)', async () => {
    setupMocks();
    const stats = await DashboardRepo.getStats();

    // LT-01: ambos dentroDelMargen=true → 0 alertas
    // LT-02: dentroDelMargen=false → 1 alerta
    const lt01 = stats.kgPorLote.find((l: any) => l.codigo === 'LT-01');
    const lt02 = stats.kgPorLote.find((l: any) => l.codigo === 'LT-02');

    expect(lt01?.alertas).toBe(0);
    expect(lt02?.alertas).toBe(1);
  });

  // ─── TC-06.7: Sin campaña activa (isActive=false) ───────────
  it('TC-06.7: campanaActiva es null cuando no hay campaña activa', async () => {
    vi.mocked(prisma.pesajeBruto.aggregate).mockResolvedValue({ _sum: { pesoNetoKg: 0 }, _count: { id: 0 } } as any);
    vi.mocked(prisma.campana.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.clasificacion.count).mockResolvedValue(0);
    vi.mocked(prisma.pesajeBruto.findMany)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const stats = await DashboardRepo.getStats();
    expect(stats.campanaActiva).toBeNull();
    expect(stats.kgTotal).toBe(0);
    expect(stats.totalPesajes).toBe(0);
  });

  // ─── TC-06.8: Filtros por fechas ────────────────────────────
  it('TC-06.8: Pasa filtros de fecha al query de Prisma correctamente', async () => {
    setupMocks();
    const fechaDesde = new Date('2026-01-01');
    const fechaHasta = new Date('2026-12-31');

    await DashboardRepo.getStats({ fechaDesde, fechaHasta });

    expect(prisma.pesajeBruto.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          fechaRegistro: expect.objectContaining({
            gte: fechaDesde,
            lte: fechaHasta,
          }),
        }),
      })
    );
  });

  // ─── TC-06.9: Filtro por campaña específica ─────────────────
  it('TC-06.9: Aplica filtro por campanaId al where', async () => {
    setupMocks();
    await DashboardRepo.getStats({ campanaId: 'c1' });

    expect(prisma.pesajeBruto.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ campanaId: 'c1' }) })
    );
  });
});

// ════════════════════════════════════════════════════════════════
//  CU-06 — DashboardRepo.getCampanas() y getLotes()
// ════════════════════════════════════════════════════════════════
describe('CU-06 — DashboardRepo.getCampanas() y getLotes()', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TC-06.10: getCampanas() retorna lista de campañas para el selector', async () => {
    const mockCampanas = [
      { id: 'c1', codigo: 'CA-2026', nombre: 'Campaña 2026', isActive: true },
      { id: 'c2', codigo: 'CA-2025', nombre: 'Campaña 2025', isActive: false },
    ];
    vi.mocked(prisma.campana.findMany).mockResolvedValue(mockCampanas as any);

    const result = await DashboardRepo.getCampanas();
    expect(result).toHaveLength(2);
    expect(result[0].codigo).toBe('CA-2026');
  });

  it('TC-06.11: getLotes() retorna solo lotes activos ordenados por código', async () => {
    const mockLotes = [
      { id: 'l1', codigo: 'LT-01', nombre: 'Lote Norte' },
      { id: 'l2', codigo: 'LT-02', nombre: 'Lote Sur' },
    ];
    vi.mocked(prisma.lote.findMany).mockResolvedValue(mockLotes as any);

    const result = await DashboardRepo.getLotes();
    expect(result).toHaveLength(2);
    expect(prisma.lote.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } })
    );
  });
});
