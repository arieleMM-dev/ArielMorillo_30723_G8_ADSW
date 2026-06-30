'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

type Agricultor = {
  id: string;
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string;
  rol: string;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export default function PersonalPage() {
  const [agricultores, setAgricultores] = useState<Agricultor[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchAgricultores = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/agricultores?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setAgricultores(data.agricultores ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  // Búsqueda en tiempo real < 1 segundo (CU-03.2)
  useEffect(() => {
    const timer = setTimeout(() => fetchAgricultores(query), 300);
    return () => clearTimeout(timer);
  }, [query, fetchAgricultores]);

  const rolLabel = (rol: string) => ({ AGRICULTOR: 'Agricultor', CLASIFICADOR: 'Clasificador', ADMIN: 'Admin' }[rol] ?? rol);
  const rolBadge = (rol: string) => ({ AGRICULTOR: 'badge-emerald', CLASIFICADOR: 'badge-blue', ADMIN: 'badge-gold' }[rol] ?? 'badge-gray');

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>}
            {toast.type === 'error'   && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>}
            {toast.msg}
          </div>
        </div>
      )}

      <div className="page-header">
        <div className="page-header-info">
          <h1>Gestión de Personal</h1>
        </div>
        <Link href="/dashboard/personal/nuevo" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nuevo Registro
        </Link>
      </div>

      <div className="table-container">
        <div className="table-header">
          {/* Búsqueda en tiempo real — CU-03.2 */}
          <div className="search-input-wrapper">
            <span className="search-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input
              id="buscar-agricultor"
              type="search"
              className="search-input"
              placeholder="Buscar por nombre, apellido o cédula..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {loading ? 'Buscando...' : `${agricultores.length} resultado${agricultores.length !== 1 ? 's' : ''}`}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Nombres y Apellidos</th>
              <th>Cédula</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Último acceso</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 18, height: 18, border: '2px solid var(--emerald-500)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    Buscando agricultores...
                  </div>
                </td>
              </tr>
            ) : agricultores.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty">
                  <div>
                    <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔍</div>
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>No se encontraron agricultores con ese criterio</p>
                    <p style={{ fontSize: '0.8rem' }}>Intenta con otro nombre, apellido o cédula</p>
                  </div>
                </td>
              </tr>
            ) : (
              agricultores.map(ag => (
                <tr key={ag.id} onClick={() => window.location.href = `/dashboard/personal/${ag.id}`}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="user-avatar" style={{ width: 34, height: 34, fontSize: '0.8rem', flexShrink: 0 }}>
                        {ag.nombres[0]}{ag.apellidos[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{ag.nombres} {ag.apellidos}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{ag.cedula}</td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{ag.email}</td>
                  <td><span className={`badge ${rolBadge(ag.rol)}`}>{rolLabel(ag.rol)}</span></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {ag.lastLoginAt ? new Date(ag.lastLoginAt).toLocaleDateString('es-EC') : 'Nunca'}
                  </td>
                  <td>
                    <span className={`badge ${ag.isActive ? 'badge-emerald' : 'badge-red'}`}>
                      {ag.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/dashboard/personal/${ag.id}`}
                      className="btn btn-ghost btn-sm"
                      onClick={e => e.stopPropagation()}
                    >
                      Ver expediente
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
