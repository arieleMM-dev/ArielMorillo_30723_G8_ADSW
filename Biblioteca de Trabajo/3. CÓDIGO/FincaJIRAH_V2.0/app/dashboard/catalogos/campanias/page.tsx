'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Comprador = { id: string; nombre: string; tipo: string };
type Campana = {
  id: string; codigo: string; nombre: string; funda: string;
  taraBase: number; isActive: boolean; createdAt: string;
  comprador: Comprador | null;
};

type ModalState = 'crear' | 'editar' | 'cerrar' | null;

const FUNDA_COLORS = [
  { value: 'Amarilla',  hex: '#FCD34D' },
  { value: 'Azul',      hex: '#60A5FA' },
  { value: 'Verde',     hex: '#4ADE80' },
  { value: 'Roja',      hex: '#F87171' },
  { value: 'Blanca',    hex: '#E4E4E7' },
  { value: 'Naranja',   hex: '#FB923C' },
];

function FundaDot({ color }: { color: string }) {
  const c = FUNDA_COLORS.find(f => f.value === color);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: '50%', background: c?.hex ?? '#ccc', border: '1px solid rgba(0,0,0,0.1)', flexShrink: 0, display: 'inline-block' }} />
      {color}
    </span>
  );
}

export default function CampaniasPage() {
  const [campanas, setCampanas] = useState<Campana[]>([]);
  const [compradores, setCompradores] = useState<Comprador[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [selected, setSelected] = useState<Campana | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const [form, setForm] = useState({
    codigo: '', nombre: '', funda: 'Amarilla', taraBase: '1.70', compradorId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, comp] = await Promise.all([
        fetch('/api/catalogos/campanias').then(r => r.json()),
        fetch('/api/catalogos/compradores').then(r => r.json()),
      ]);
      setCampanas(c.campanas ?? []);
      setCompradores((comp.compradores ?? []).filter((c: any) => c.isActive));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCrear() {
    setForm({ codigo: '', nombre: '', funda: 'Amarilla', taraBase: '1.70', compradorId: '' });
    setErrors({});
    setSelected(null);
    setModal('crear');
  }

  function openEditar(c: Campana) {
    setForm({ codigo: c.codigo, nombre: c.nombre, funda: c.funda, taraBase: String(c.taraBase), compradorId: c.comprador?.id ?? '' });
    setErrors({});
    setSelected(c);
    setModal('editar');
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.codigo.trim())  e.codigo  = 'El código es obligatorio';
    if (!form.nombre.trim())  e.nombre  = 'El nombre es obligatorio';
    if (!form.funda)          e.funda   = 'Selecciona un color de funda';
    const tara = parseFloat(form.taraBase);
    if (isNaN(tara) || tara <= 0 || tara > 10) e.taraBase = 'Tara inválida (0–10 kg)';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleGuardar() {
    if (!validate()) return;
    setSaving(true);
    try {
      const body = {
        codigo: form.codigo.trim().toUpperCase(),
        nombre: form.nombre.trim(),
        funda:  form.funda,
        taraBase: parseFloat(form.taraBase),
        compradorId: form.compradorId || undefined,
      };
      const url  = modal === 'editar' ? `/api/catalogos/campanias/${selected!.id}` : '/api/catalogos/campanias';
      const method = modal === 'editar' ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setErrors({ general: data.error }); return; }
      setModal(null);
      showToast(modal === 'editar' ? 'Campaña actualizada' : 'Campaña registrada');
      load();
    } finally { setSaving(false); }
  }

  async function handleCerrar() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/catalogos/campanias/${selected.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { showToast(data.error, 'error'); setModal(null); return; }
      setModal(null);
      showToast('Campaña cerrada exitosamente');
      load();
    } finally { setSaving(false); }
  }

  return (
    <div>
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}

      <div className="page-header">
        <div>
          <Link href="/dashboard/catalogos" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
            ← Catálogos
          </Link>
          <h1>Campañas</h1>
        </div>
        <button className="btn btn-primary" onClick={openCrear}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nueva Campaña
        </button>
      </div>

      <div style={{ marginBottom: 16, position: 'relative', maxWidth: 400 }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="Buscar campaña por código o nombre..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '36px' }}
        />
        <svg style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="table-empty">Cargando campañas...</div>
        ) : campanas.length === 0 ? (
          <div className="empty-state">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>
            <h3>No existen campañas registradas</h3>
            <p>Comience creando una nueva campaña de cosecha.</p>
          </div>
        ) : campanas.filter(c => 
            c.codigo.toLowerCase().includes(searchQuery.toLowerCase()) || 
            c.nombre.toLowerCase().includes(searchQuery.toLowerCase())
          ).length === 0 ? (
          <div className="empty-state">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <h3>No se encontraron coincidencias</h3>
            <p>Intente con otro término de búsqueda.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Funda</th>
                <th>Tara (kg)</th>
                <th>Comprador</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {campanas.filter(c => 
                c.codigo.toLowerCase().includes(searchQuery.toLowerCase()) || 
                c.nombre.toLowerCase().includes(searchQuery.toLowerCase())
              ).map(c => (
                <tr key={c.id} onClick={() => openEditar(c)}>
                  <td><span className="mono fw-600">{c.codigo}</span></td>
                  <td>{c.nombre}</td>
                  <td><FundaDot color={c.funda} /></td>
                  <td>{c.taraBase.toFixed(2)} kg</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.comprador?.nombre ?? '—'}</td>
                  <td>
                    <span className={`badge ${c.isActive ? 'badge-green' : 'badge-zinc'}`}>
                      {c.isActive ? 'Activa' : 'Cerrada'}
                    </span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    {c.isActive && (
                      <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(c); setModal('cerrar'); }}>
                        Cerrar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {(modal === 'crear' || modal === 'editar') && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">{modal === 'crear' ? 'Nueva Campaña' : 'Editar Campaña'}</div>

            {errors.general && <div className="alert alert-error" style={{ marginBottom: 14 }}>{errors.general}</div>}

            <div className="form-group">
              <label className="form-label">Código *</label>
              <input className="form-input" placeholder="Ej: 2026-A" value={form.codigo}
                onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                readOnly={modal === 'editar'} style={modal === 'editar' ? { background: 'var(--bg-page)', color: 'var(--text-muted)' } : {}} />
              {errors.codigo && <div className="form-error">{errors.codigo}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input className="form-input" placeholder="Ej: Cosecha Verano 2026" value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
              {errors.nombre && <div className="form-error">{errors.nombre}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Color de Funda *</label>
                <select className="form-input form-select" value={form.funda}
                  onChange={e => setForm(f => ({ ...f, funda: e.target.value }))}>
                  {FUNDA_COLORS.map(fc => (
                    <option key={fc.value} value={fc.value}>{fc.value}</option>
                  ))}
                </select>
                {errors.funda && <div className="form-error">{errors.funda}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Tara Gaveta (kg) *</label>
                <input className="form-input" type="number" step="0.01" min="0.1" max="10"
                  value={form.taraBase} onChange={e => setForm(f => ({ ...f, taraBase: e.target.value }))} />
                <div className="form-hint">Por defecto: 1.70 kg</div>
                {errors.taraBase && <div className="form-error">{errors.taraBase}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Comprador Asignado</label>
              <select className="form-input form-select" value={form.compradorId}
                onChange={e => setForm(f => ({ ...f, compradorId: e.target.value }))}>
                <option value="">— Sin comprador asignado —</option>
                {compradores.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleGuardar} disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cerrar */}
      {modal === 'cerrar' && selected && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">¿Cerrar campaña {selected.codigo}?</div>
            <div className="modal-body">
              Una vez cerrada, ya no se podrán registrar más pesajes con este código. El historial de cosechas se mantendrá intacto.
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleCerrar} disabled={saving}>
                {saving ? 'Cerrando...' : 'Confirmar Cierre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
