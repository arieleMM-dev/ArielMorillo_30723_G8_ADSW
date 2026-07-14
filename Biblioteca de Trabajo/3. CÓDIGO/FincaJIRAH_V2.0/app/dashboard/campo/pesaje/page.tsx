'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { offlineService } from '@/lib/services/offline.service';

type Campana = { id: string; codigo: string; nombre: string; taraBase: number };
type Lote    = { id: string; codigo: string; nombre: string };

export default function PesajePage() {
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [lotes,    setLotes]    = useState<Lote[]>([]);
  const [form, setForm] = useState({
    campanaId: '', loteId: '', numGavetas: '', pesoBrutoKg: '', observaciones: '',
  });
  const [calc, setCalc]    = useState<{ taraTotal: number; pesoNeto: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast,  setToast]  = useState<{ msg: string; type: string } | null>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const { data: session } = useSession();

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    const [c, l, h] = await Promise.all([
      fetch('/api/catalogos/campanias').then(r => r.json()),
      fetch('/api/catalogos/lotes').then(r => r.json()),
      fetch('/api/campo/pesajes').then(r => r.json()),
    ]);
    setCampanas((c.campanas ?? []).filter((c: any) => c.isActive));
    setLotes((l.lotes ?? []).filter((l: any) => l.isActive));
    setHistorial(h.pesajes?.slice(0, 10) ?? []);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Recalcular en tiempo real
  useEffect(() => {
    const campana = campanas.find(c => c.id === form.campanaId);
    const gavetas  = parseInt(form.numGavetas);
    const pesoBruto = parseFloat(form.pesoBrutoKg);
    if (campana && gavetas > 0 && pesoBruto > 0) {
      const taraTotal = +(gavetas * campana.taraBase).toFixed(3);
      const pesoNeto  = +(pesoBruto - taraTotal).toFixed(3);
      setCalc({ taraTotal, pesoNeto });
    } else {
      setCalc(null);
    }
  }, [form.campanaId, form.numGavetas, form.pesoBrutoKg, campanas]);

  function validate() {
    const e: Record<string, string> = {};
    if (!form.campanaId)                                    e.campanaId   = 'Selecciona una campaña';
    if (!form.loteId)                                       e.loteId      = 'Selecciona un lote';
    const gv = parseInt(form.numGavetas);
    if (!form.numGavetas || isNaN(gv) || gv <= 0)          e.numGavetas  = 'Ingresa un número de gavetas válido (entero > 0)';
    const pb = parseFloat(form.pesoBrutoKg);
    if (!form.pesoBrutoKg || isNaN(pb) || pb <= 0)         e.pesoBrutoKg = 'Ingresa un peso bruto válido (> 0 kg)';
    if (calc && calc.pesoNeto < 0)                          e.pesoBrutoKg = 'El peso neto resulta negativo. Verifique los datos.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleGuardar() {
    if (!validate()) return;
    setSaving(true);
    try {
      if (!navigator.onLine) {
        // Modo offline
        const localId = await offlineService.savePesaje({
          peso_bruto: parseFloat(form.pesoBrutoKg),
          num_gavetas: parseInt(form.numGavetas),
          agricultor_id: (session?.user as any)?.id || '',
          campana_codigo: form.campanaId,
          lote_codigo: form.loteId,
          observaciones: form.observaciones || undefined,
        });
        showToast('Sin conexión. Pesaje guardado localmente (sincronización pendiente).', 'info');
        setForm({ campanaId: form.campanaId, loteId: form.loteId, numGavetas: '', pesoBrutoKg: '', observaciones: '' });
        setCalc(null);
        return;
      }

      const res = await fetch('/api/campo/pesajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campanaId:   form.campanaId,
          loteId:      form.loteId,
          numGavetas:  parseInt(form.numGavetas),
          pesoBrutoKg: parseFloat(form.pesoBrutoKg),
          observaciones: form.observaciones || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErrors({ general: data.error }); return; }
      showToast('Cosecha registrada exitosamente');
      setForm({ campanaId: form.campanaId, loteId: form.loteId, numGavetas: '', pesoBrutoKg: '', observaciones: '' });
      setCalc(null);
      load();
    } finally { setSaving(false); }
  }

  const campanaSeleccionada = campanas.find(c => c.id === form.campanaId);

  return (
    <div>
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1>Registrar Cosecha</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 2, fontSize: '0.875rem' }}>
            Pesaje bruto de pitahaya por lote — CU-05.1
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
        {/* Formulario */}
        <div className="card">
          {errors.general && <div className="alert alert-error" style={{ marginBottom: 16 }}>{errors.general}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Campaña Activa *</label>
              <select className="form-input form-select" value={form.campanaId}
                onChange={e => setForm(f => ({ ...f, campanaId: e.target.value }))}>
                <option value="">— Seleccionar campaña —</option>
                {campanas.map(c => (
                  <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>
                ))}
              </select>
              {errors.campanaId && <div className="form-error">{errors.campanaId}</div>}
              {campanaSeleccionada && (
                <div className="form-hint">Tara: {campanaSeleccionada.taraBase} kg/gaveta</div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Lote *</label>
              <select className="form-input form-select" value={form.loteId}
                onChange={e => setForm(f => ({ ...f, loteId: e.target.value }))}>
                <option value="">— Seleccionar lote —</option>
                {lotes.map(l => (
                  <option key={l.id} value={l.id}>{l.codigo} — {l.nombre}</option>
                ))}
              </select>
              {errors.loteId && <div className="form-error">{errors.loteId}</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Nº de Gavetas *</label>
              <input className="form-input" type="number" min="1" step="1"
                placeholder="Ej: 8" value={form.numGavetas}
                onChange={e => setForm(f => ({ ...f, numGavetas: e.target.value }))} />
              {errors.numGavetas && <div className="form-error">{errors.numGavetas}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Peso Bruto Total (kg) *</label>
              <input className="form-input" type="number" min="0.1" step="0.1"
                placeholder="Marcado por la báscula" value={form.pesoBrutoKg}
                onChange={e => setForm(f => ({ ...f, pesoBrutoKg: e.target.value }))} />
              {errors.pesoBrutoKg && <div className="form-error">{errors.pesoBrutoKg}</div>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <input className="form-input" placeholder="Notas adicionales..." value={form.observaciones}
              onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))} />
          </div>

          <div style={{ marginTop: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={handleGuardar} disabled={saving}>
              {saving ? 'Registrando...' : 'Registrar Cosecha'}
            </button>
          </div>
        </div>

        {/* Panel de Cálculo */}
        <div>
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>Resumen de Cálculo</div>

            {calc ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Peso bruto</span>
                  <span className="fw-600">{parseFloat(form.pesoBrutoKg).toFixed(2)} kg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    Tara ({form.numGavetas} × {campanaSeleccionada?.taraBase} kg)
                  </span>
                  <span style={{ color: 'var(--red-500)' }}>−{calc.taraTotal.toFixed(2)} kg</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', background: calc.pesoNeto >= 0 ? 'var(--green-50)' : 'var(--red-50)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Peso Neto</span>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem', color: calc.pesoNeto >= 0 ? 'var(--green-600)' : 'var(--red-600)' }}>
                    {calc.pesoNeto.toFixed(2)} kg
                  </span>
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '24px 0' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                </svg>
                <p style={{ marginTop: 8, fontSize: '0.82rem' }}>Ingrese los datos para ver el cálculo automático</p>
              </div>
            )}
          </div>

          <div style={{ marginTop: 8, padding: '10px 14px', background: 'var(--zinc-100)', borderRadius: 'var(--radius-md)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Fórmula:</strong><br/>
            Peso Neto = Peso Bruto − (Gavetas × Tara)
          </div>
        </div>
      </div>

      {/* Historial reciente */}
      {historial.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Últimos registros</div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Campaña</th>
                  <th>Lote</th>
                  <th>Gavetas</th>
                  <th>Bruto (kg)</th>
                  <th>Neto (kg)</th>
                  <th>Clasificación</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((p: any) => (
                  <tr key={p.id}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                      {new Date(p.fechaRegistro).toLocaleDateString('es-EC')}
                    </td>
                    <td className="mono" style={{ fontSize: '0.82rem' }}>{p.campana.codigo}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{p.lote.codigo}</td>
                    <td>{p.numGavetas}</td>
                    <td>{p.pesoBrutoKg.toFixed(2)}</td>
                    <td className="fw-600 text-success">{p.pesoNetoKg.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${p.clasificacion ? 'badge-green' : 'badge-amber'}`}>
                        {p.clasificacion ? 'Clasificado' : 'Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
