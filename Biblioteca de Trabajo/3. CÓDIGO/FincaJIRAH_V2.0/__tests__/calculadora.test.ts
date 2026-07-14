/**
 * ┌─────────────────────────────────────────────────────────────────┐
 * │  SUITE DE PRUEBAS — CalculadoraCosecha (Patrón Strategy)        │
 * │  Casos: TC-05.2.2 (lógica de margen) + validación de Strategy   │
 * │  Técnica: Prueba unitaria pura (sin mocks)                      │
 * └─────────────────────────────────────────────────────────────────┘
 */

import { describe, it, expect } from 'vitest';
import {
  CalculadoraCosecha,
  CalculoMargenPitahayaNormalStrategy,
  CalculoMargenPitahayaExportacionStrategy,
  CalculoTaraGavetaStrategy,
} from '@/lib/services/calculo/ICalculoMargen';

// ─────────────────────────────────────────────────────────────────
// Estrategia Normal (±4%)
// ─────────────────────────────────────────────────────────────────
describe('CalculoMargenPitahayaNormalStrategy (±4%)', () => {
  const estrategia = new CalculoMargenPitahayaNormalStrategy();

  it('calcularMargen() devuelve 0 cuando pesoBruto = totalClasificado', () => {
    expect(estrategia.calcularMargen(100, 100)).toBe(0);
  });

  it('calcularMargen() devuelve 4 cuando diferencia es exactamente el 4%', () => {
    expect(estrategia.calcularMargen(100, 96)).toBeCloseTo(4, 1);
  });

  it('estaDentroDelMargen() retorna true para margen = 4%', () => {
    expect(estrategia.estaDentroDelMargen(4)).toBe(true);
  });

  it('estaDentroDelMargen() retorna false para margen > 4%', () => {
    expect(estrategia.estaDentroDelMargen(4.01)).toBe(false);
  });

  it('getMargenPermitido() retorna 4', () => {
    expect(estrategia.getMargenPermitido()).toBe(4);
  });

  it('calcularMargen() retorna 0 cuando pesoBruto = 0 (evitar división por cero)', () => {
    expect(estrategia.calcularMargen(0, 50)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// Estrategia Exportación (±2%)
// ─────────────────────────────────────────────────────────────────
describe('CalculoMargenPitahayaExportacionStrategy (±2%)', () => {
  const estrategia = new CalculoMargenPitahayaExportacionStrategy();

  it('getMargenPermitido() retorna 2', () => {
    expect(estrategia.getMargenPermitido()).toBe(2);
  });

  it('estaDentroDelMargen() retorna false para margen = 2.5%', () => {
    expect(estrategia.estaDentroDelMargen(2.5)).toBe(false);
  });

  it('estaDentroDelMargen() retorna true para margen = 1.5%', () => {
    expect(estrategia.estaDentroDelMargen(1.5)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────
// Estrategia de Tara
// ─────────────────────────────────────────────────────────────────
describe('CalculoTaraGavetaStrategy', () => {
  it('calcularTara() con peso por defecto (1.70 kg/gaveta)', () => {
    const estrategia = new CalculoTaraGavetaStrategy();
    expect(estrategia.calcularTara(5)).toBeCloseTo(8.5, 2);
  });

  it('calcularTara() con peso personalizado', () => {
    const estrategia = new CalculoTaraGavetaStrategy(2.0);
    expect(estrategia.calcularTara(3)).toBe(6.0);
  });

  it('getPesoGaveta() retorna el valor configurado', () => {
    const estrategia = new CalculoTaraGavetaStrategy(1.70);
    expect(estrategia.getPesoGaveta()).toBe(1.70);
  });
});

// ─────────────────────────────────────────────────────────────────
// CalculadoraCosecha — Patrón Strategy: cambio dinámico
// ─────────────────────────────────────────────────────────────────
describe('CalculadoraCosecha — Contexto del Patrón Strategy', () => {
  it('calcularPesaje() calcula tara y peso neto correctamente con estrategia por defecto', () => {
    const calculadora = new CalculadoraCosecha();
    const resultado = calculadora.calcularPesaje(50.0, 2);

    // Tara = 2 * 1.70 = 3.40; Neto = 50 - 3.40 = 46.60
    expect(resultado.taraTotal).toBeCloseTo(3.40, 2);
    expect(resultado.pesoNetoKg).toBeCloseTo(46.60, 2);
  });

  it('validarClasificacion() detecta clasificación dentro del margen (±4%)', () => {
    const calculadora = new CalculadoraCosecha();
    const resultado = calculadora.validarClasificacion(100, 97);

    expect(resultado.dentroDelMargen).toBe(true);
    expect(resultado.margenPct).toBeCloseTo(3, 0);
  });

  it('validarClasificacion() detecta clasificación FUERA del margen (±4%)', () => {
    const calculadora = new CalculadoraCosecha();
    const resultado = calculadora.validarClasificacion(100, 90);

    expect(resultado.dentroDelMargen).toBe(false);
    expect(resultado.margenPct).toBeCloseTo(10, 0);
  });

  // Criterio de aceptación: setEstrategiaMargen — Mutabilidad dinámica
  it('setEstrategiaMargen() cambia la estrategia en tiempo de ejecución (±4% → ±2%)', () => {
    const calculadora = new CalculadoraCosecha();

    // Con estrategia Normal (±4%), 3% es válido
    let resultado = calculadora.validarClasificacion(100, 97);
    expect(resultado.dentroDelMargen).toBe(true);

    // Cambiar a Exportación (±2%) — ahora 3% NO es válido
    calculadora.setEstrategiaMargen(new CalculoMargenPitahayaExportacionStrategy());
    resultado = calculadora.validarClasificacion(100, 97);

    expect(resultado.dentroDelMargen).toBe(false);
    expect(resultado.margenPermitido).toBe(2);
  });

  it('setEstrategiaTara() permite configurar una tara diferente', () => {
    const calculadora = new CalculadoraCosecha();
    calculadora.setEstrategiaTara(new CalculoTaraGavetaStrategy(2.0));

    const resultado = calculadora.calcularPesaje(50.0, 2);
    // Tara = 2 * 2.0 = 4.0; Neto = 50 - 4.0 = 46.0
    expect(resultado.taraTotal).toBe(4.0);
    expect(resultado.pesoNetoKg).toBe(46.0);
  });
});
