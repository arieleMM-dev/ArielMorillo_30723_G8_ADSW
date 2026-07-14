/**
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  SUITE DE PRUEBAS — SyncStateContext (Patrón State)             │
 * │  Casos: TC-05.4.1 / TC-05.4.2 (ciclo de vida del estado)       │
 * │  Técnica: Prueba unitaria pura (sin mocks — lógica de dominio)  │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { describe, it, expect } from 'vitest';
import { SyncStateContext } from '@/lib/state/SyncState';

// ─────────────────────────────────────────────────────────────────
// Estado PENDING (estado inicial)
// ─────────────────────────────────────────────────────────────────
describe('SyncStateContext — Estado PENDING', () => {
  it('Inicia en estado PENDING por defecto', () => {
    const ctx = new SyncStateContext();
    expect(ctx.status).toBe('PENDING');
  });

  it('PENDING: canEdit = true (se puede modificar)', () => {
    const ctx = new SyncStateContext('PENDING');
    expect(ctx.canEdit).toBe(true);
  });

  it('PENDING: canSync = true (se puede sincronizar)', () => {
    const ctx = new SyncStateContext('PENDING');
    expect(ctx.canSync).toBe(true);
  });

  it('PENDING: label = "Pendiente"', () => {
    const ctx = new SyncStateContext('PENDING');
    expect(ctx.label).toBe('Pendiente');
  });

  it('PENDING: color es amarillo/dorado', () => {
    const ctx = new SyncStateContext('PENDING');
    expect(ctx.color).toBe('#f59e0b');
  });
});

// ─────────────────────────────────────────────────────────────────
// Transición PENDING → SYNCING (TC-05.4.1)
// ─────────────────────────────────────────────────────────────────
describe('SyncStateContext — Transición PENDING → SYNCING', () => {
  it('startSync() cambia el estado a SYNCING', () => {
    const ctx = new SyncStateContext('PENDING');
    ctx.startSync();
    expect(ctx.status).toBe('SYNCING');
  });

  it('SYNCING: canEdit = false (bloquear durante sincronización)', () => {
    const ctx = new SyncStateContext('SYNCING');
    expect(ctx.canEdit).toBe(false);
  });

  it('SYNCING: canSync = false (no se puede re-sincronizar)', () => {
    const ctx = new SyncStateContext('SYNCING');
    expect(ctx.canSync).toBe(false);
  });

  it('SYNCING: label = "Sincronizando..."', () => {
    const ctx = new SyncStateContext('SYNCING');
    expect(ctx.label).toBe('Sincronizando...');
  });
});

// ─────────────────────────────────────────────────────────────────
// Transición SYNCING → SYNCED (TC-05.4.1 — éxito)
// ─────────────────────────────────────────────────────────────────
describe('SyncStateContext — Transición SYNCING → SYNCED (TC-05.4.1)', () => {
  it('completeSync() cambia el estado a SYNCED', () => {
    const ctx = new SyncStateContext('PENDING');
    ctx.startSync();
    ctx.completeSync();
    expect(ctx.status).toBe('SYNCED');
  });

  it('SYNCED: canEdit = false (inmutable)', () => {
    const ctx = new SyncStateContext('SYNCED');
    expect(ctx.canEdit).toBe(false);
  });

  it('SYNCED: color es verde esmeralda', () => {
    const ctx = new SyncStateContext('SYNCED');
    expect(ctx.color).toBe('#10b981');
  });

  it('SYNCED: label = "Sincronizado"', () => {
    const ctx = new SyncStateContext('SYNCED');
    expect(ctx.label).toBe('Sincronizado');
  });
});

// ─────────────────────────────────────────────────────────────────
// Transición SYNCING → PENDING (TC-05.4.2 — falla / backoff)
// ─────────────────────────────────────────────────────────────────
describe('SyncStateContext — Transición SYNCING → PENDING (TC-05.4.2 — falla)', () => {
  it('failSync() regresa el estado a PENDING cuando hay un error de sincronización', () => {
    const ctx = new SyncStateContext('PENDING');
    ctx.startSync();
    ctx.failSync(); // simula un error 500
    expect(ctx.status).toBe('PENDING');
  });

  it('Después de failSync(), canSync vuelve a ser true (reintentos habilitados)', () => {
    const ctx = new SyncStateContext('PENDING');
    ctx.startSync();
    ctx.failSync();
    expect(ctx.canSync).toBe(true);
  });

  it('Un estado SYNCED no retrocede: startSync() es ignorado', () => {
    const ctx = new SyncStateContext('SYNCED');
    ctx.startSync(); // No debe hacer nada
    expect(ctx.status).toBe('SYNCED');
  });
});
