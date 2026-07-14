/**
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  SUITE DE PRUEBAS — SyncObserver (Patrón Observer)              │
 * │  Casos: suscripción, notificación, des-suscripción              │
 * │  Técnica: Prueba unitaria pura con espías (vi.fn)               │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  networkSyncSubject,
  type ISyncObserver,
  type SyncEventType,
} from '@/lib/observers/SyncObserver';

// ─────────────────────────────────────────────────────────────────
// Patrón Observer — NetworkSyncSubject
// ─────────────────────────────────────────────────────────────────
describe('SyncObserver — NetworkSyncSubject (Patrón Observer)', () => {
  let eventosRecibidos: Array<{ event: SyncEventType; data?: unknown }>;
  let observador: ISyncObserver;

  beforeEach(() => {
    eventosRecibidos = [];
    observador = {
      onSyncEvent: vi.fn((event: SyncEventType, data?: unknown) => {
        eventosRecibidos.push({ event, data });
      }),
    };
  });

  it('subscribe() + notify() — el observador recibe eventos después de suscribirse', () => {
    networkSyncSubject.subscribe(observador);
    networkSyncSubject.notify('online');

    expect(observador.onSyncEvent).toHaveBeenCalledWith('online', undefined);
    networkSyncSubject.unsubscribe(observador);
  });

  it('notify("sync-complete") — el observador recibe el evento con datos opcionales', () => {
    networkSyncSubject.subscribe(observador);
    networkSyncSubject.notify('sync-complete', { count: 5 });

    expect(observador.onSyncEvent).toHaveBeenCalledWith('sync-complete', { count: 5 });
    networkSyncSubject.unsubscribe(observador);
  });

  it('unsubscribe() — el observador ya no recibe eventos tras desuscribirse', () => {
    networkSyncSubject.subscribe(observador);
    networkSyncSubject.unsubscribe(observador);
    networkSyncSubject.notify('offline');

    expect(observador.onSyncEvent).not.toHaveBeenCalled();
  });

  it('Múltiples observadores — todos reciben el mismo evento', () => {
    const observador2: ISyncObserver = { onSyncEvent: vi.fn() };

    networkSyncSubject.subscribe(observador);
    networkSyncSubject.subscribe(observador2);
    networkSyncSubject.notify('sync-failed', { error: 'timeout' });

    expect(observador.onSyncEvent).toHaveBeenCalledTimes(1);
    expect(observador2.onSyncEvent).toHaveBeenCalledTimes(1);

    networkSyncSubject.unsubscribe(observador);
    networkSyncSubject.unsubscribe(observador2);
  });

  it('Suscribir el mismo observador dos veces no duplica notificaciones (Set)', () => {
    networkSyncSubject.subscribe(observador);
    networkSyncSubject.subscribe(observador); // duplicado
    networkSyncSubject.notify('online');

    // Set<> garantiza unicidad — solo 1 notificación
    expect(observador.onSyncEvent).toHaveBeenCalledTimes(1);
    networkSyncSubject.unsubscribe(observador);
  });

  it('notify("offline") — el observador registra el tipo de evento correctamente', () => {
    networkSyncSubject.subscribe(observador);
    networkSyncSubject.notify('offline');

    expect(eventosRecibidos[0].event).toBe('offline');
    networkSyncSubject.unsubscribe(observador);
  });
});
