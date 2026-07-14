'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { offlineService } from '@/lib/services/offline.service';

type Pesaje = {
  id: string; fechaRegistro: string; pesoBrutoKg: number; numGavetas: number; pesoNetoKg: number;
  campana: { codigo: string; nombre: string; taraBase: number };
  lote:    { codigo: string; nombre: string };
  agricultor: { nombres: string; apellidos: string };
};

export default function ClasificacionPage() {
  const [pendientes, setPendientes]   = useState<Pesaje[]>([]);
  const [selected,   setSelected]     = useState<Pesaje | null>(null);
  const [loading,    setLoading]      = useState(true);
  const [saving,     setSaving]       = useState(false);
  const [toast,      setToast]        = useState<{ msg: string; type: string } | null>(null);
  const { data: session } = useSession();

  // Formulario clasificación
  const [gvExp,  setGvExp]  = useState('');
  const [pbExp,  setPbExp]  = useState('');
  const [gvNac,  setGvNac]  = useState('');
  const [pbNac,  setPbNac]  = useState('');
  const [desce,  setDesce]  = useState('');
  const [obs,    setObs]    = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estado de verificación
  const [verificado, setVerificado] = useState(false);
  const [calculo, setCalculo]       = useState<{
    netoExp: number; netoNac: number; total: number; margen: number; ok: boolean;
  } | null>(null);
  const [descuadreAlerta, setDescuadreAlerta] = useState<number | null>(null);
  const [forzar, setForzar]                   = useState(false);

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/campo/clasificaciones').then(r => r.json());
      setPendientes(r.pendientes ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function resetForm() {
    setGvExp(''); setPbExp(''); setGvNac(''); setPbNac(''); setDesce(''); setObs('');
    setErrors({}); setVerificado(false); setCalculo(null); setDescuadreAlerta(null); setForzar(false);
  }

  function seleccionar(p: Pesaje) {
    setSelected(p);
    resetForm();
  }

  function calcular() {
    const e: Record<string, string> = {};
    const gve = parseInt(gvExp); const pbe = parseFloat(pbExp);
    const gvn = parseInt(gvNac); const pbn = parseFloat(pbNac);
    const desc = parseFloat(desce || '0');

    if (!gvExp || isNaN(gve) || gve < 0)  e.gvExp = 'Número de gavetas inválido';
    if (!pbExp || isNaN(pbe) || pbe < 0)  e.pbExp = 'Peso bruto inválido';
    if (!gvNac || isNaN(gvn) || gvn < 0)  e.gvNac = 'Número de gavetas inválido';
    if (!pbNac || isNaN(pbn) || pbn < 0)  e.pbNac = 'Peso bruto inválido';
    if (isNaN(desc) || desc < 0)          e.desce = 'Descarte inválido';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const tara     = selected!.campana.taraBase;
    const netoExp  = +(pbe - gve * tara).toFixed(3);
    const netoNac  = +(pbn - gvn * tara).toFixed(3);
    const total    = +(netoExp + netoNac + desc).toFixed(3);
    const base     = selected!.pesoNetoKg;
    const margen   = base > 0 ? +((Math.abs(total - base) / base) * 100).toFixed(2) : 0;
    const ok       = margen <= 4.0;

    setCalculo({ netoExp, netoNac, total, margen, ok });
    setVerificado(true);
    setDescuadreAlerta(ok ? null : margen);
    setForzar(false);
  }

  async function handleGuardar() {
    if (!selected || !calculo) return;
    setSaving(true);
    try {
      if (!navigator.onLine) {
        // Modo offline
        const localId = await offlineService.saveClasificacion({
          pesaje_local_id: selected.id, // Esto puede ser el ID real si el pesaje ya estaba en DB, o local si se creó offline (el backend asume que se envían pesajes primero)
          exportacion_kg: calculo.netoExp,
          nacional_kg: calculo.netoNac,
          descarte_kg: parseFloat(desce || '0'),
          clasificador_id: (session?.user as any)?.id || '',
          observaciones: obs || undefined,
        });
        showToast('Sin conexión. Clasificación guardada localmente.', 'info');
        setSelected(null);
        resetForm();
        return;
      }

      const body = {
        pesajeBrutoId: selected.id,
        gavetasExportacion: parseInt(gvExp),
        pesoExportacionBruto: parseFloat(pbExp),
        gavetasNacional: parseInt(gvNac),
        pesoNacionalBruto: parseFloat(pbNac),
        pesoDescarte: parseFloat(desce || '0'),
        observaciones: obs || undefined,
        forzar,
      };
      const res = await fetch('/api/campo/clasificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.descuadre) {
          setDescuadreAlerta(data.margenPct);
          return;
        }
        showToast(data.error, 'error');
        return;
      }
      showToast('Clasificación guardada exitosamente');
      setSelected(null);
      resetForm();
      load();
    } finally { setSaving(false); }
  }

  const margenColor = calculo
    ? calculo.ok ? 'var(--green-600)' : calculo.margen <= 6 ? 'var(--amber-600)' : 'var(--red-600)'
    : 'var(--text-muted)';

  return (
    <div>
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>Clasificación Poscosecha</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 2, fontSize: '0.875rem' }}>
            Desglose por categoría y verificación ±4% — CU-05.2
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '340px 1fr' : '1fr', gap: 20, alignItems: 'start' }}>
        {/* Lista pendientes */}
        <div className="table-container">
          <div className="table-header">
            <span className="card-title">Pesajes pendientes</span>
            <span className="badge badge-amber">{pendientes.length}</span>
          </div>
          {loading ? (
            <div className="table-empty">Cargando...</div>
          ) : pendientes.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              <h3>Todo clasificado</h3>
              <p>No hay pesajes pendientes de clasificar.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {pendientes.map(p => (
                <div
                  key={p.id}
                  onClick={() => seleccionar(p)}
                  style={{
                    padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border)',
                    background: selected?.id === p.id ? 'var(--accent-light)' : 'transparent',
                    transition: 'background var(--transition)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.lote.codigo} — {p.lote.nombre}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {p.campana.codigo} · {new Date(p.fechaRegistro).toLocaleDateString('es-EC')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{p.pesoNetoKg.toFixed(2)} kg</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>neto</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Formulario clasificación */}
        {selected && (
          <div>
            <div className="card">
              <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700 }}>Clasificando: {selected.lote.nombre} ({selected.campana.codigo})</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  Peso Neto Base: <strong>{selected.pesoNetoKg.toFixed(2)} kg</strong> · Tara: {selected.campana.taraBase} kg/gaveta
                </div>
              </div>

              {/* Exportación */}
              <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--blue-600)', marginBottom: 8 }}>
                Exportación (G ≥280g, P 180–279g)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Gavetas Exportación</label>
                  <input className="form-input" type="number" min="0" step="1" value={gvExp}
                    onChange={e => { setGvExp(e.target.value); setVerificado(false); }} />
                  {errors.gvExp && <div className="form-error">{errors.gvExp}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Peso Bruto Exportación (kg)</label>
                  <input className="form-input" type="number" min="0" step="0.1" value={pbExp}
                    onChange={e => { setPbExp(e.target.value); setVerificado(false); }} />
                  {errors.pbExp && <div className="form-error">{errors.pbExp}</div>}
                </div>
              </div>

              {/* Nacional */}
              <div style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--amber-600)', marginBottom: 8 }}>
                Nacional (N1, N2, N3)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Gavetas Nacional</label>
                  <input className="form-input" type="number" min="0" step="1" value={gvNac}
                    onChange={e => { setGvNac(e.target.value); setVerificado(false); }} />
                  {errors.gvNac && <div className="form-error">{errors.gvNac}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Peso Bruto Nacional (kg)</label>
                  <input className="form-input" type="number" min="0" step="0.1" value={pbNac}
                    onChange={e => { setPbNac(e.target.value); setVerificado(false); }} />
                  {errors.pbNac && <div className="form-error">{errors.pbNac}</div>}
                </div>
              </div>

              <div className="form-group" style={{ maxWidth: 200 }}>
                <label className="form-label">Descarte / Merma (kg)</label>
                <input className="form-input" type="number" min="0" step="0.1" value={desce}
                  onChange={e => { setDesce(e.target.value); setVerificado(false); }} />
                {errors.desce && <div className="form-error">{errors.desce}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Observaciones</label>
                <input className="form-input" value={obs} onChange={e => setObs(e.target.value)} />
              </div>

              <button className="btn btn-secondary" style={{ width: '100%' }} onClick={calcular}>
                Calcular y Verificar
              </button>

              {/* Resultado verificación */}
              {verificado && calculo && (
                <div style={{ marginTop: 16, background: 'var(--bg-page)', borderRadius: 'var(--radius-md)', padding: 16, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Neto Exportación</span>
                      <span className="fw-600">{calculo.netoExp.toFixed(3)} kg</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Neto Nacional</span>
                      <span className="fw-600">{calculo.netoNac.toFixed(3)} kg</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      <span className="fw-600">Total Clasificado</span>
                      <span className="fw-600">{calculo.total.toFixed(3)} kg</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Peso Neto Base</span>
                      <span>{selected.pesoNetoKg.toFixed(3)} kg</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: calculo.ok ? 'var(--green-50)' : 'var(--red-50)', border: `1px solid ${calculo.ok ? 'var(--green-200)' : 'var(--red-100)'}` }}>
                      <span style={{ fontWeight: 700, color: margenColor }}>Margen de Error</span>
                      <span style={{ fontWeight: 700, color: margenColor }}>{calculo.margen.toFixed(2)}% {calculo.ok ? '✓ Dentro del ±4%' : '✗ Fuera del límite'}</span>
                    </div>
                  </div>

                  {/* Alerta descuadre */}
                  {!calculo.ok && (
                    <div className="alert alert-warn" style={{ marginTop: 12 }}>
                      <div>
                        <strong>Alerta de descuadre:</strong> El margen ({calculo.margen}%) supera el límite permitido de ±4%. Verifique los pesos ingresados.
                        <div style={{ marginTop: 8 }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.82rem' }}>
                            <input type="checkbox" checked={forzar} onChange={e => setForzar(e.target.checked)} />
                            Confirmo que los datos son correctos y deseo guardar con bandera de auditoría.
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 14, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn-secondary" onClick={() => setSelected(null)}>Cancelar</button>
                    <button className="btn btn-primary"
                      onClick={handleGuardar}
                      disabled={saving || (!calculo.ok && !forzar)}>
                      {saving ? 'Guardando...' : 'Guardar Clasificación'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
