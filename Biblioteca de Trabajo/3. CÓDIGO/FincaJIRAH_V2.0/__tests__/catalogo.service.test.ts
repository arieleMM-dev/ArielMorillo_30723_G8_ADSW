/**
 * ══════════════════════════════════════════════════════════════
 *  SUITE: CU-04 — Gestión de Catálogos
 *  Cubre: CampanaService, LoteService, CompradorService
 *  Patrón: Pruebas unitarias de servicio con mocks de repositorio
 * ══════════════════════════════════════════════════════════════
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── MOCKS ──────────────────────────────────────────────────────────
vi.mock('@/lib/repositories/CatalogoRepository', () => ({
  CampanaRepo: {
    findAll:       vi.fn(),
    findById:      vi.fn(),
    findByCodigo:  vi.fn(),
    create:        vi.fn(),
    update:        vi.fn(),
    cerrar:        vi.fn(),
    countPesajes:  vi.fn(),
  },
  LoteRepo: {
    findAll:       vi.fn(),
    findById:      vi.fn(),
    findByCodigo:  vi.fn(),
    create:        vi.fn(),
    update:        vi.fn(),
    softDelete:    vi.fn(),
  },
  CompradorRepo: {
    findAll:       vi.fn(),
    findById:      vi.fn(),
    findByRuc:     vi.fn(),
    create:        vi.fn(),
    update:        vi.fn(),
    softDelete:    vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    pesajeBruto: {
      count:     vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import { CampanaService, LoteService, CompradorService } from '@/lib/services/catalogo.service';
import { CampanaRepo, LoteRepo, CompradorRepo } from '@/lib/repositories/CatalogoRepository';
import { prisma } from '@/lib/prisma';

// ════════════════════════════════════════════════════════════════
//  CU-04.1 — CampanaService
// ════════════════════════════════════════════════════════════════
describe('CU-04 — CampanaService', () => {
  beforeEach(() => vi.clearAllMocks());

  // ─── TC-04.1.1: Crear campaña — Flujo Normal ────────────────
  describe('crear()', () => {
    it('TC-04.1.1: Crea campaña con datos válidos y tara por defecto (1.70)', async () => {
      vi.mocked(CampanaRepo.findByCodigo).mockResolvedValue(null);
      const mockCampana = { id: 'c1', codigo: 'CA-2026', nombre: 'Campaña 2026', funda: 'F1', taraBase: 1.70, isActive: true };
      vi.mocked(CampanaRepo.create).mockResolvedValue(mockCampana as any);

      const result = await CampanaService.crear({ codigo: 'ca-2026', nombre: 'Campaña 2026', funda: 'F1' });

      expect(CampanaRepo.findByCodigo).toHaveBeenCalledWith('CA-2026'); // uppercase
      expect(CampanaRepo.create).toHaveBeenCalledWith(expect.objectContaining({ taraBase: 1.70 }));
      expect(result.codigo).toBe('CA-2026');
    });

    it('TC-04.1.2: Lanza CODIGO_DUPLICADO si ya existe esa campaña', async () => {
      vi.mocked(CampanaRepo.findByCodigo).mockResolvedValue({ id: 'x' } as any);
      await expect(
        CampanaService.crear({ codigo: 'CA-2026', nombre: 'Dup', funda: 'F1' })
      ).rejects.toThrow('CODIGO_DUPLICADO');
    });

    it('TC-04.1.3: Lanza CODIGO_REQUERIDO si el código es vacío', async () => {
      await expect(
        CampanaService.crear({ codigo: '  ', nombre: 'X', funda: 'F1' })
      ).rejects.toThrow('CODIGO_REQUERIDO');
    });

    it('TC-04.1.4: Lanza TARA_INVALIDA si taraBase > 10', async () => {
      vi.mocked(CampanaRepo.findByCodigo).mockResolvedValue(null);
      await expect(
        CampanaService.crear({ codigo: 'CA-X', nombre: 'X', funda: 'F1', taraBase: 15 })
      ).rejects.toThrow('TARA_INVALIDA');
    });

    it('TC-04.1.5: Lanza TARA_INVALIDA si taraBase <= 0', async () => {
      vi.mocked(CampanaRepo.findByCodigo).mockResolvedValue(null);
      await expect(
        CampanaService.crear({ codigo: 'CA-X', nombre: 'X', funda: 'F1', taraBase: 0 })
      ).rejects.toThrow('TARA_INVALIDA');
    });
  });

  // ─── TC-04.1.2: Actualizar campaña ──────────────────────────
  describe('actualizar()', () => {
    const mockCampana = { id: 'c1', codigo: 'CA-2026', nombre: 'Campaña 2026', funda: 'F1', taraBase: 1.70, isActive: true };

    it('TC-04.2.1: Actualiza nombre sin restricciones', async () => {
      vi.mocked(CampanaRepo.findById).mockResolvedValue(mockCampana as any);
      vi.mocked(CampanaRepo.update).mockResolvedValue({ ...mockCampana, nombre: 'Nuevo Nombre' } as any);

      const result = await CampanaService.actualizar('c1', { nombre: 'Nuevo Nombre' });
      expect(result.nombre).toBe('Nuevo Nombre');
    });

    it('TC-04.2.2: Lanza CAMPANA_INACTIVA si se intenta actualizar una campaña cerrada', async () => {
      vi.mocked(CampanaRepo.findById).mockResolvedValue({ ...mockCampana, isActive: false } as any);
      await expect(CampanaService.actualizar('c1', { nombre: 'X' })).rejects.toThrow('CAMPANA_INACTIVA');
    });

    it('TC-04.2.3: Lanza TARA_BLOQUEADA si ya hay pesajes registrados', async () => {
      vi.mocked(CampanaRepo.findById).mockResolvedValue(mockCampana as any);
      vi.mocked(CampanaRepo.countPesajes).mockResolvedValue(5);
      await expect(CampanaService.actualizar('c1', { taraBase: 2.0 })).rejects.toThrow('TARA_BLOQUEADA');
    });

    it('TC-04.2.4: Permite actualizar taraBase si no hay pesajes', async () => {
      vi.mocked(CampanaRepo.findById).mockResolvedValue(mockCampana as any);
      vi.mocked(CampanaRepo.countPesajes).mockResolvedValue(0);
      vi.mocked(CampanaRepo.update).mockResolvedValue({ ...mockCampana, taraBase: 2.0 } as any);

      const result = await CampanaService.actualizar('c1', { taraBase: 2.0 });
      expect(CampanaRepo.update).toHaveBeenCalled();
    });
  });

  // ─── TC-04.1.3: Cerrar campaña ──────────────────────────────
  describe('cerrar()', () => {
    it('TC-04.3.1: Cierra campaña sin pesajes pendientes', async () => {
      vi.mocked(CampanaRepo.findById).mockResolvedValue({ id: 'c1', isActive: true } as any);
      vi.mocked(prisma.pesajeBruto.count).mockResolvedValue(0);
      vi.mocked(CampanaRepo.cerrar).mockResolvedValue({ id: 'c1', isActive: false } as any);

      const result = await CampanaService.cerrar('c1');
      expect(result.isActive).toBe(false);
    });

    it('TC-04.3.2: Lanza SYNC_PENDIENTE si hay pesajes sin sincronizar', async () => {
      vi.mocked(CampanaRepo.findById).mockResolvedValue({ id: 'c1', isActive: true } as any);
      vi.mocked(prisma.pesajeBruto.count).mockResolvedValue(3);
      await expect(CampanaService.cerrar('c1')).rejects.toThrow('SYNC_PENDIENTE');
    });

    it('TC-04.3.3: Lanza CAMPANA_YA_CERRADA si ya está cerrada', async () => {
      vi.mocked(CampanaRepo.findById).mockResolvedValue({ id: 'c1', isActive: false } as any);
      await expect(CampanaService.cerrar('c1')).rejects.toThrow('CAMPANA_YA_CERRADA');
    });
  });
});

// ════════════════════════════════════════════════════════════════
//  CU-04.2 — LoteService
// ════════════════════════════════════════════════════════════════
describe('CU-04 — LoteService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('crear()', () => {
    it('TC-04.L1: Crea lote con datos válidos (código normalizado a uppercase)', async () => {
      vi.mocked(LoteRepo.findByCodigo).mockResolvedValue(null);
      vi.mocked(LoteRepo.create).mockResolvedValue({ id: 'l1', codigo: 'LT-01', nombre: 'Lote Norte', isActive: true } as any);

      const result = await LoteService.crear({ codigo: 'lt-01', nombre: 'Lote Norte' });
      expect(LoteRepo.findByCodigo).toHaveBeenCalledWith('LT-01');
      expect(result.codigo).toBe('LT-01');
    });

    it('TC-04.L2: Lanza CODIGO_DUPLICADO si el código ya existe', async () => {
      vi.mocked(LoteRepo.findByCodigo).mockResolvedValue({ id: 'x' } as any);
      await expect(LoteService.crear({ codigo: 'LT-01', nombre: 'Dup' })).rejects.toThrow('CODIGO_DUPLICADO');
    });

    it('TC-04.L3: Lanza NOMBRE_REQUERIDO si nombre es vacío', async () => {
      await expect(LoteService.crear({ codigo: 'LT-02', nombre: '  ' })).rejects.toThrow('NOMBRE_REQUERIDO');
    });
  });

  describe('eliminar()', () => {
    it('TC-04.L4: Soft-delete de lote sin campaña activa', async () => {
      vi.mocked(LoteRepo.findById).mockResolvedValue({ id: 'l1', isActive: true } as any);
      vi.mocked(prisma.pesajeBruto.findFirst).mockResolvedValue(null);
      vi.mocked(LoteRepo.softDelete).mockResolvedValue({ id: 'l1', isActive: false } as any);

      const result = await LoteService.eliminar('l1');
      expect(result.isActive).toBe(false);
    });

    it('TC-04.L5: Lanza LOTE_EN_USO si hay campaña activa con pesajes en ese lote', async () => {
      vi.mocked(LoteRepo.findById).mockResolvedValue({ id: 'l1', isActive: true } as any);
      vi.mocked(prisma.pesajeBruto.findFirst).mockResolvedValue({ id: 'pb1' } as any);
      await expect(LoteService.eliminar('l1')).rejects.toThrow('LOTE_EN_USO');
    });
  });
});

// ════════════════════════════════════════════════════════════════
//  CU-04.3 — CompradorService
// ════════════════════════════════════════════════════════════════
describe('CU-04 — CompradorService', () => {
  beforeEach(() => vi.clearAllMocks());

  describe('crear()', () => {
    it('TC-04.C1: Crea comprador con RUC único y tolerancia por defecto (4%)', async () => {
      vi.mocked(CompradorRepo.findByRuc).mockResolvedValue(null);
      vi.mocked(CompradorRepo.create).mockResolvedValue({ id: 'cp1', nombre: 'Agro SA', ruc: '1790012345001', toleranciaPct: 4.0, tipo: 'LOCAL', isActive: true } as any);

      const result = await CompradorService.crear({ nombre: 'Agro SA', ruc: '1790012345001', tipo: 'LOCAL' });
      expect(result.toleranciaPct).toBe(4.0);
      expect(CompradorRepo.findByRuc).toHaveBeenCalledWith('1790012345001');
    });

    it('TC-04.C2: Lanza RUC_DUPLICADO si RUC ya existe', async () => {
      vi.mocked(CompradorRepo.findByRuc).mockResolvedValue({ id: 'x' } as any);
      await expect(
        CompradorService.crear({ nombre: 'Dup', ruc: '1790012345001', tipo: 'EXPORTADOR' })
      ).rejects.toThrow('RUC_DUPLICADO');
    });

    it('TC-04.C3: Lanza NOMBRE_REQUERIDO si nombre es vacío', async () => {
      await expect(
        CompradorService.crear({ nombre: '', tipo: 'LOCAL' })
      ).rejects.toThrow('NOMBRE_REQUERIDO');
    });

    it('TC-04.C4: Lanza TOLERANCIA_INVALIDA si toleranciaPct > 100', async () => {
      await expect(
        CompradorService.crear({ nombre: 'X', tipo: 'LOCAL', toleranciaPct: 120 })
      ).rejects.toThrow('TOLERANCIA_INVALIDA');
    });

    it('TC-04.C5: Crea comprador sin RUC (RUC opcional)', async () => {
      vi.mocked(CompradorRepo.create).mockResolvedValue({ id: 'cp2', nombre: 'Sin RUC', toleranciaPct: 4.0, tipo: 'LOCAL', isActive: true } as any);

      const result = await CompradorService.crear({ nombre: 'Sin RUC', tipo: 'LOCAL' });
      expect(CompradorRepo.findByRuc).not.toHaveBeenCalled();
      expect(result.nombre).toBe('Sin RUC');
    });
  });

  describe('actualizar()', () => {
    it('TC-04.C6: Actualiza nombre (RUC es inmutable — no se puede cambiar)', async () => {
      vi.mocked(CompradorRepo.findById).mockResolvedValue({ id: 'cp1', nombre: 'Agro SA', tipo: 'LOCAL', isActive: true } as any);
      vi.mocked(CompradorRepo.update).mockResolvedValue({ id: 'cp1', nombre: 'Agro Updated', tipo: 'LOCAL', isActive: true } as any);

      const result = await CompradorService.actualizar('cp1', { nombre: 'Agro Updated' });
      expect(result.nombre).toBe('Agro Updated');
    });

    it('TC-04.C7: Lanza COMPRADOR_NO_ENCONTRADO si no existe', async () => {
      vi.mocked(CompradorRepo.findById).mockResolvedValue(null);
      await expect(CompradorService.actualizar('x', { nombre: 'Y' })).rejects.toThrow('COMPRADOR_NO_ENCONTRADO');
    });
  });
});
