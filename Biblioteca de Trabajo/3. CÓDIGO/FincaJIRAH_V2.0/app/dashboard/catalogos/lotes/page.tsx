'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Lote = {
  id: string; codigo: string; nombre: string;
  hectareas: number | null; descripcion: string | null;
  isActive: boolean; createdAt: string;
};

type ModalState = 'crear' | 'editar' | 'eliminar' | null;

export default function LotesPage() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [selected, setSelected] = useState<Lote | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [form, setForm] = useState({ codigo: '', nombre: '', hectareas: '', descripcion: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/catalogos/lotes').then(r => r.json());
      setLotes(r.lotes ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCrear() {
    setForm({ codigo: '', nombre: '', hectareas: '', descripcion: '' });
    setErrors({});
    setSelected(null);
    setModal('crear');
  }

  function openEditar(l: Lote) {
    setForm({ codigo: l.codigo, nombre: l.nombre, hectareas: l.hectareas ? String(l.hectareas) : '', descripcion: l.descripcion ?? '' });
    setErrors({});
    setSelected(l);
    setModal('editar');
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.codigo.trim()) e.codigo = 'El código es obligatorio';
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    if (form.hectareas && (isNaN(parseFloat(form.hectareas)) || parseFloat(form.hectareas) <= 0)) {
      e.hectareas = 'Las hectáreas deben ser un número positivo';
    }
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
        hectareas: form.hectareas ? parseFloat(form.hectareas) : undefined,
        descripcion: form.descripcion.trim() || undefined,
      };
      const url    = modal === 'editar' ? `/api/catalogos/lotes/${selected!.id}` : '/api/catalogos/lotes';
      const method = modal === 'editar' ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setErrors({ general: data.error }); return; }
      setModal(null);
      showToast(modal === 'editar' ? 'Lote actualizado' : 'Lote registrado');
      load();
    } finally { setSaving(false); }
  }

  async function handleEliminar() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/catalogos/lotes/${selected.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { showToast(data.error, 'error'); setModal(null); return; }
      setModal(null);
      showToast('Lote inactivado');
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
          <h1>Lotes</h1>
        </div>
        <button className="btn btn-primary" onClick={openCrear}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo Lote
        </button>
      </div>

      <div style={{ marginBottom: 16, position: 'relative', maxWidth: 400 }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="Buscar lote por nombre..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '36px' }}
        />
        <svg style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="table-empty">Cargando lotes...</div>
        ) : lotes.length === 0 ? (
          <div className="empty-state">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            <h3>No existen lotes registrados</h3>
            <p>Comience creando uno nuevo.</p>
          </div>
        ) : lotes.filter(l => l.nombre.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
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
                <th>Hectáreas</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {lotes.filter(l => l.nombre.toLowerCase().includes(searchQuery.toLowerCase())).map(l => (
                <tr key={l.id} onClick={() => l.isActive && openEditar(l)}>
                  <td><span className="mono fw-600">{l.codigo}</span></td>
                  <td>{l.nombre}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{l.hectareas ? `${l.hectareas} ha` : '—'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{l.descripcion ?? '—'}</td>
                  <td>
                    <span className={`badge ${l.isActive ? 'badge-green' : 'badge-zinc'}`}>
                      {l.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    {l.isActive && (
                      <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(l); setModal('eliminar'); }}>
                        Eliminar
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
            <div className="modal-title">{modal === 'crear' ? 'Nuevo Lote' : 'Editar Lote'}</div>

            {errors.general && <div className="alert alert-error" style={{ marginBottom: 14 }}>{errors.general}</div>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Código *</label>
                <input className="form-input" placeholder="Ej: L-01" value={form.codigo}
                  onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))}
                  readOnly={modal === 'editar'} style={modal === 'editar' ? { background: 'var(--bg-page)', color: 'var(--text-muted)' } : {}} />
                {errors.codigo && <div className="form-error">{errors.codigo}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Hectáreas</label>
                <input className="form-input" type="number" step="0.01" min="0.01"
                  placeholder="Ej: 2.5" value={form.hectareas}
                  onChange={e => setForm(f => ({ ...f, hectareas: e.target.value }))} />
                {errors.hectareas && <div className="form-error">{errors.hectareas}</div>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nombre *</label>
              <input className="form-input" placeholder="Ej: Lote Noreste" value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
              {errors.nombre && <div className="form-error">{errors.nombre}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Descripción</label>
              <input className="form-input" placeholder="Observaciones del área..." value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
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

      {/* Modal Eliminar */}
      {modal === 'eliminar' && selected && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">¿Inactivar lote {selected.codigo}?</div>
            <div className="modal-body">
              El lote quedará inactivo. Su historial de cosechas pasadas se mantendrá intacto para auditoría.
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleEliminar} disabled={saving}>
                {saving ? 'Eliminando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
