'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Comprador = {
  id: string; nombre: string; ruc: string | null;
  tipo: 'EXPORTADOR' | 'MAYORISTA'; contacto: string | null;
  toleranciaPct: number; isActive: boolean; createdAt: string;
};

type ModalState = 'crear' | 'editar' | 'eliminar' | null;

export default function CompradoresPage() {
  const [compradores, setCompradores] = useState<Comprador[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalState>(null);
  const [selected, setSelected] = useState<Comprador | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [form, setForm] = useState({
    nombre: '', ruc: '', tipo: 'EXPORTADOR' as 'EXPORTADOR' | 'MAYORISTA',
    contacto: '', toleranciaPct: '4',
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
      const r = await fetch('/api/catalogos/compradores').then(r => r.json());
      setCompradores(r.compradores ?? []);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCrear() {
    setForm({ nombre: '', ruc: '', tipo: 'EXPORTADOR', contacto: '', toleranciaPct: '4' });
    setErrors({});
    setSelected(null);
    setModal('crear');
  }

  function openEditar(c: Comprador) {
    setForm({ nombre: c.nombre, ruc: c.ruc ?? '', tipo: c.tipo, contacto: c.contacto ?? '', toleranciaPct: String(c.toleranciaPct) });
    setErrors({});
    setSelected(c);
    setModal('editar');
  }

  function validate() {
    const e: Record<string, string> = {};
    
    const nom = form.nombre.trim();
    if (!nom || !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nom) || nom.length < 2 || nom.length > 50) {
      e.nombre = 'Este campo solo puede contener letras y espacios';
    }

    const rucVal = form.ruc.trim();
    if (rucVal && !/^\d{10}001$/.test(rucVal)) {
      e.ruc = 'El documento de identidad no es válido';
    }

    const tol = parseFloat(form.toleranciaPct);
    if (isNaN(tol) || tol < 0 || tol > 100) e.toleranciaPct = 'La tolerancia debe estar entre 0% y 100%';
    
    const contactoVal = form.contacto.trim();
    if (contactoVal && !/^09\d{8}$/.test(contactoVal)) {
      e.contacto = 'El teléfono debe tener 10 dígitos y empezar con 09';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleGuardar() {
    if (!validate()) return;
    setSaving(true);
    try {
      const body = {
        nombre: form.nombre.trim(),
        ruc: form.ruc.trim() || undefined,
        tipo: form.tipo,
        contacto: form.contacto.trim() || undefined,
        toleranciaPct: parseFloat(form.toleranciaPct),
      };
      const url    = modal === 'editar' ? `/api/catalogos/compradores/${selected!.id}` : '/api/catalogos/compradores';
      const method = modal === 'editar' ? 'PATCH' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setErrors({ general: data.error }); return; }
      setModal(null);
      showToast(modal === 'editar' ? 'Comprador actualizado' : 'Comprador registrado');
      load();
    } finally { setSaving(false); }
  }

  async function handleEliminar() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/catalogos/compradores/${selected.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) { showToast(data.error, 'error'); setModal(null); return; }
      setModal(null);
      showToast('Comprador eliminado del directorio');
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
          <h1>Compradores</h1>
        </div>
        <button className="btn btn-primary" onClick={openCrear}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo Comprador
        </button>
      </div>

      <div style={{ marginBottom: 16, position: 'relative', maxWidth: 400 }}>
        <input 
          type="text" 
          className="form-input" 
          placeholder="Buscar por nombre, RUC o contacto..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '36px' }}
        />
        <svg style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-muted)' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="table-empty">Cargando compradores...</div>
        ) : compradores.length === 0 ? (
          <div className="empty-state">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <h3>No existen compradores registrados</h3>
            <p>Agregue los exportadores o mayoristas que compran la pitahaya.</p>
          </div>
        ) : compradores.filter(c => 
            c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
            (c.ruc && c.ruc.includes(searchQuery)) || 
            (c.contacto && c.contacto.includes(searchQuery))
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
                <th>Razón Social</th>
                <th>RUC</th>
                <th>Tipo</th>
                <th>Contacto</th>
                <th>Tolerancia</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {compradores.filter(c => 
                c.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                (c.ruc && c.ruc.includes(searchQuery)) || 
                (c.contacto && c.contacto.includes(searchQuery))
              ).map(c => (
                <tr key={c.id} onClick={() => c.isActive && openEditar(c)}>
                  <td className="fw-600">{c.nombre}</td>
                  <td className="mono" style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>{c.ruc ?? '—'}</td>
                  <td>
                    <span className={`badge ${c.tipo === 'EXPORTADOR' ? 'badge-blue' : 'badge-amber'}`}>
                      {c.tipo}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.contacto ?? '—'}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>±{c.toleranciaPct}%</td>
                  <td>
                    <span className={`badge ${c.isActive ? 'badge-green' : 'badge-zinc'}`}>
                      {c.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    {c.isActive && (
                      <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(c); setModal('eliminar'); }}>
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
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">{modal === 'crear' ? 'Nuevo Comprador' : 'Editar Comprador'}</div>

            {errors.general && <div className="alert alert-error" style={{ marginBottom: 14 }}>{errors.general}</div>}

            <div className="form-group">
              <label className="form-label">Razón Social *</label>
              <input className="form-input" placeholder="Ej: Agroexport Cía. Ltda." value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
              {errors.nombre && <div className="form-error">{errors.nombre}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">RUC (13 dígitos)</label>
                <input className="form-input mono" placeholder="Ej: 1791234567001" maxLength={13}
                  value={form.ruc} onChange={e => setForm(f => ({ ...f, ruc: e.target.value.replace(/\D/g, '') }))} />
                {errors.ruc && <div className="form-error">{errors.ruc}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Tipo *</label>
                <select className="form-input form-select" value={form.tipo}
                  onChange={e => setForm(f => ({ ...f, tipo: e.target.value as 'EXPORTADOR' | 'MAYORISTA' }))}>
                  <option value="EXPORTADOR">Exportador</option>
                  <option value="MAYORISTA">Mayorista</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Celular de Contacto</label>
                <input className="form-input" placeholder="09XXXXXXXX" maxLength={10}
                  value={form.contacto} onChange={e => setForm(f => ({ ...f, contacto: e.target.value.replace(/\D/g, '') }))} />
                {errors.contacto && <div className="form-error">{errors.contacto}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Tolerancia de Merma (%)</label>
                <input className="form-input" type="number" step="0.5" min="0" max="100"
                  value={form.toleranciaPct} onChange={e => setForm(f => ({ ...f, toleranciaPct: e.target.value }))} />
                <div className="form-hint">Estándar ±4%</div>
                {errors.toleranciaPct && <div className="form-error">{errors.toleranciaPct}</div>}
              </div>
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
            <div className="modal-title">¿Eliminar comprador?</div>
            <div className="modal-body">
              <strong>{selected.nombre}</strong> será ocultado del directorio comercial. Las ventas históricas asociadas a este cliente se mantendrán intactas.
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleEliminar} disabled={saving}>
                {saving ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
