/**
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  SUITE DE PRUEBAS — OfflinePayloadAdapter (Patrón Adapter)      │
 * │  Casos: TC-05.4.1 (adaptación de payload offline)               │
 * │  Técnica: Prueba unitaria pura (sin mocks — lógica de dominio)  │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { describe, it, expect } from 'vitest';
import {
  OfflinePayloadAdapter,
  type OfflinePesajePayload,
  type OfflineClasificacionPayload,
} from '@/lib/adapters/OfflinePayloadAdapter';

// ─── Instancia del adaptador ──────────────────────────────────────
const adapter = new OfflinePayloadAdapter();

// ─── Payload de prueba: pesaje offline ───────────────────────────
const PAYLOAD_PESAJE: OfflinePesajePayload = {
  localId: 'local-pes-001',
  timestamp: '2026-07-13T10:00:00Z',
  peso_bruto: 50.0,
  num_gavetas: 2,
  agricultor_id: 'usr-100',
  campana_codigo: '102026',
  lote_codigo: 'LOTE-N',
  observaciones: 'Cosecha mañana',
  syncStatus: 'PENDING',
};

const RESOLVED_IDS = {
  campanaId: 'camp-001',
  loteId: 'lote-001',
};

// ─────────────────────────────────────────────────────────────────
// TC-05.4.1 — Adaptación de pesaje offline al formato Prisma
// ─────────────────────────────────────────────────────────────────
describe('TC-05.4 — OfflinePayloadAdapter.adaptPesaje()', () => {
  it('TC-05.4.1: Convierte payload offline de pesaje al formato de Prisma correctamente', () => {
    const resultado = adapter.adaptPesaje(PAYLOAD_PESAJE, RESOLVED_IDS);

    // Tara = 2 * 1.70 = 3.40; Neto = 50 - 3.40 = 46.60
    expect(resultado.pesoBrutoKg).toBe(50.0);
    expect(resultado.numGavetas).toBe(2);
    expect(resultado.taraTotal).toBeCloseTo(3.40, 2);
    expect(resultado.pesoNetoKg).toBeCloseTo(46.60, 2);
    expect(resultado.campanaId).toBe('camp-001');
    expect(resultado.loteId).toBe('lote-001');
    expect(resultado.agricultorId).toBe('usr-100');
    expect(resultado.syncStatus).toBe('SYNCED');
  });

  it('TC-05.4.2: Mapea correctamente el syncStatus a SYNCED (salida a Prisma)', () => {
    const resultado = adapter.adaptPesaje(PAYLOAD_PESAJE, RESOLVED_IDS);
    expect(resultado.syncStatus).toBe('SYNCED');
  });

  it('Preserva observaciones en la salida Prisma', () => {
    const resultado = adapter.adaptPesaje(PAYLOAD_PESAJE, RESOLVED_IDS);
    expect(resultado.observaciones).toBe('Cosecha mañana');
  });
});

// ─────────────────────────────────────────────────────────────────
// Adaptación de clasificación offline
// ─────────────────────────────────────────────────────────────────
describe('TC-05.4 — OfflinePayloadAdapter.adaptClasificacion()', () => {
  const PAYLOAD_CLASIFICACION: OfflineClasificacionPayload = {
    localId: 'local-clas-001',
    pesaje_local_id: 'local-pes-001',
    timestamp: '2026-07-13T11:00:00Z',
    exportacion_kg: 23.30,
    nacional_kg: 21.30,
    descarte_kg: 2.0,
    clasificador_id: 'usr-100',
  };

  it('Calcula totalClasificado correctamente sumando las categorías', () => {
    const resultado = adapter.adaptClasificacion(
      PAYLOAD_CLASIFICACION,
      'pes-001',
      46.60 // pesoBrutoKg de referencia
    );

    // Total = 23.30 + 21.30 + 2.0 = 46.60
    expect(resultado.totalClasificado).toBeCloseTo(46.60, 2);
  });

  it('dentroDelMargen = true cuando diferencia ≤ 4%', () => {
    const resultado = adapter.adaptClasificacion(PAYLOAD_CLASIFICACION, 'pes-001', 46.60);
    expect(resultado.dentroDelMargen).toBe(true);
    expect(resultado.margenErrorPct).toBeCloseTo(0, 1);
  });

  it('dentroDelMargen = false cuando diferencia > 4%', () => {
    // Total = 23.30 + 21.30 + 2.0 = 46.60; pesoBruto = 100 → diferencia > 4%
    const resultado = adapter.adaptClasificacion(PAYLOAD_CLASIFICACION, 'pes-001', 100);
    expect(resultado.dentroDelMargen).toBe(false);
  });

  it('Mapea clasificadorId correctamente', () => {
    const resultado = adapter.adaptClasificacion(PAYLOAD_CLASIFICACION, 'pes-001', 46.60);
    expect(resultado.clasificadorId).toBe('usr-100');
    expect(resultado.pesajeBrutoId).toBe('pes-001');
  });
});
