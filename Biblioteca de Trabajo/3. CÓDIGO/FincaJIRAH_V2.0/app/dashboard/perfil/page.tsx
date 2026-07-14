'use client';

import { useState, useEffect } from 'react';
import { useSession, SessionProvider } from 'next-auth/react';

function PerfilContent() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const [tab, setTab] = useState<'datos' | 'password' | 'preferencias'>('datos');

  // CU-02.1 — Actualizar datos
  const [telefono, setTelefono] = useState('');
  const [savingDatos, setSavingDatos] = useState(false);
  const [toastDatos, setToastDatos] = useState('');

  // CU-02.2 — Cambiar contraseña
  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwOk, setPwOk] = useState(false);

  // CU-02.3 — Preferencias (tema)
  const [tema, setTema] = useState<'CLARO' | 'OSCURO'>('OSCURO');

  // Avatar local simulation (UI only for now)
  const [localAvatar, setLocalAvatar] = useState<string | null>(null);
  
  useEffect(() => {
    // Load local avatar from localStorage if available
    const savedAvatar = localStorage.getItem('jirah-avatar');
    if (savedAvatar) setLocalAvatar(savedAvatar);
    
    fetch('/api/perfil').then(r => r.json()).then(d => {
      setTelefono(d.user?.telefono ?? '');
      setTema(d.user?.tema ?? 'OSCURO');
      if (d.user?.avatar) {
        setLocalAvatar(d.user.avatar);
        localStorage.setItem('jirah-avatar', d.user.avatar);
      }
    });
  }, []);

  // Aplicar tema al DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema === 'CLARO' ? 'light' : 'dark');
    localStorage.setItem('jirah-tema', tema);
  }, [tema]);

  async function saveDatos(e: React.FormEvent) {
    e.preventDefault();
    const tel = telefono.trim();
    if (tel && !/^09\d{8}$/.test(tel)) {
      setToastDatos('error:El teléfono debe tener 10 dígitos y empezar con 09');
      return;
    }
    setSavingDatos(true);
    const res = await fetch('/api/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefono }),
    });
    setSavingDatos(false);
    if (res.ok) {
      setToastDatos('ok:Datos actualizados correctamente');
    } else {
      const d = await res.json();
      setToastDatos(`error:${d.error}`);
    }
    setTimeout(() => setToastDatos(''), 3500);
  }

  async function saveTema(newTema: 'CLARO' | 'OSCURO') {
    setTema(newTema);
    // Optimistic update — guardamos localmente y sincronizamos en segundo plano (CU-02.3)
    await fetch('/api/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tema: newTema }),
    }).catch(() => {/* Si no hay internet, el localStorage persiste */});
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    if (pwForm.new !== pwForm.confirm) { setPwError('Las contraseñas nuevas no coinciden'); return; }
    setSavingPw(true);
    const res = await fetch('/api/perfil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.new }),
    });
    const data = await res.json();
    setSavingPw(false);
    if (res.ok) {
      setPwOk(true);
      setPwForm({ current: '', new: '', confirm: '' });
      setTimeout(() => setPwOk(false), 4000);
    } else {
      setPwError(data.error);
    }
  }

  const initials = user ? `${user.nombres?.[0] ?? ''}${user.apellidos?.[0] ?? ''}`.toUpperCase() : '?';
  const [toastType, toastMsg] = toastDatos.startsWith('ok:') ? ['success', toastDatos.slice(3)] : toastDatos.startsWith('error:') ? ['error', toastDatos.slice(6)] : ['', ''];

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* Toast */}
      {toastDatos && (
        <div className="toast-container">
          <div className={`toast toast-${toastType}`}>{toastMsg}</div>
        </div>
      )}

      <div className="page-header">
        <div className="page-header-info">
          <h1>Mi Perfil</h1>
          <p>Gestiona tu información personal y preferencias — CU-02</p>
        </div>
      </div>

      {/* Avatar + info */}
      <div className="card" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div className="profile-avatar-large" style={{ fontSize: '2.25rem', fontWeight: 700, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent)', color: '#fff', width: 72, height: 72, borderRadius: '50%' }}>
          {localAvatar ? (
            <img src={localAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            initials
          )}
        </div>
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>{user?.nombres} {user?.apellidos}</h2>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span className="badge badge-emerald">{user?.rol}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '4px' }}>
        {[
          { key: 'datos', label: 'Datos de Contacto' },
          { key: 'password', label: 'Contraseña' },
          { key: 'preferencias', label: 'Preferencias' },
        ].map(t => (
          <button
            key={t.key}
            className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1 }}
            onClick={() => setTab(t.key as any)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CU-02.1 — Datos mutables */}
      {tab === 'datos' && (
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem' }}>Datos de Contacto</h3>
          <form onSubmit={saveDatos} id="form-perfil-datos">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label className="form-label">Nombres (bloqueado)</label>
                <input className="form-input form-input-readonly" value={user?.nombres ?? ''} readOnly />
              </div>
              <div>
                <label className="form-label">Apellidos (bloqueado)</label>
                <input className="form-input form-input-readonly" value={user?.apellidos ?? ''} readOnly />
              </div>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Cédula (bloqueada)</label>
              <input className="form-input form-input-readonly" value="**********" readOnly />
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="telefono" className="form-label">Teléfono</label>
              <input id="telefono" type="tel" className="form-input" placeholder="Ej: 0987654321"
                value={telefono} onChange={e => setTelefono(e.target.value.replace(/\D/g, ''))} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Solo dígitos, 7 a 15 caracteres</p>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Avatar / Foto</label>
              <div 
                style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-md)', padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', cursor: 'pointer', transition: 'border-color var(--transition)' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                onClick={() => document.getElementById('avatar-upload')?.click()}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '0.5rem' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <p style={{ fontSize: '0.85rem' }}>Haz clic aquí para cambiar tu foto</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>PNG o JPG — máximo 2MB</p>
                <input 
                  id="avatar-upload" 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  style={{ display: 'none' }} 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        setToastDatos('error:La imagen supera los 2MB permitidos');
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = async () => {
                        const b64 = reader.result as string;
                        setLocalAvatar(b64);
                        
                        // CU-02.1: Persistir en servidor
                        const res = await fetch('/api/perfil', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ avatar: b64 }),
                        });
                        
                        if (res.ok) {
                          localStorage.setItem('jirah-avatar', b64);
                          setToastDatos('ok:Avatar actualizado correctamente en el servidor');
                        } else {
                          const errorData = await res.json();
                          setToastDatos(`error:${errorData.error}`);
                          setLocalAvatar(localStorage.getItem('jirah-avatar')); // Revertir
                        }
                        setTimeout(() => setToastDatos(''), 3500);
                      };
                      reader.readAsDataURL(file);
                    }
                  }} 
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button id="btn-guardar-datos" type="submit" className={`btn btn-primary ${savingDatos ? 'btn-loading' : ''}`} disabled={savingDatos}>
                {!savingDatos && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>}
                {savingDatos ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CU-02.2 — Cambiar contraseña */}
      {tab === 'password' && (
        <div className="card">
          <h3 style={{ marginBottom: '0.5rem' }}>Cambiar Contraseña</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Mínimo 8 caracteres, 1 mayúscula y 1 número</p>

          {pwOk && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--emerald-400)', fontSize: '0.875rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              Contraseña actualizada exitosamente
            </div>
          )}

          <form onSubmit={savePassword} id="form-cambiar-password">
            {pwError && <div className="form-error" style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)' }}>{pwError}</div>}
            <div className="form-group">
              <label htmlFor="current-pw" className="form-label">Contraseña actual</label>
              <input id="current-pw" type="password" className="form-input" placeholder="••••••••"
                value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label htmlFor="new-pw" className="form-label">Nueva contraseña</label>
              <input id="new-pw" type="password" className="form-input" placeholder="••••••••"
                value={pwForm.new} onChange={e => setPwForm(f => ({ ...f, new: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-pw" className="form-label">Confirmar nueva contraseña</label>
              <input id="confirm-pw" type="password" className="form-input" placeholder="••••••••"
                value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
              {pwForm.new && pwForm.confirm && pwForm.new !== pwForm.confirm && (
                <div className="form-error">Las contraseñas no coinciden</div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button id="btn-cambiar-password" type="submit" className={`btn btn-primary ${savingPw ? 'btn-loading' : ''}`} disabled={savingPw}>
                {!savingPw && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                {savingPw ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CU-02.3 — Preferencias */}
      {tab === 'preferencias' && (
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Preferencias de Apariencia</h3>
          <p className="form-label" style={{ marginBottom: '1rem' }}>Tema de la interfaz</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {(['OSCURO', 'CLARO'] as const).map(t => (
              <button
                key={t}
                id={`btn-tema-${t.toLowerCase()}`}
                onClick={() => saveTema(t)}
                style={{
                  padding: '1.25rem',
                  border: `2px solid ${tema === t ? 'var(--emerald-500)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-lg)',
                  background: tema === t ? 'rgba(16,185,129,0.08)' : 'var(--bg-input)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all var(--transition)',
                  color: 'var(--text-primary)',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{t === 'OSCURO' ? '🌙' : '☀️'}</div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Tema {t === 'OSCURO' ? 'Oscuro' : 'Claro'}</div>
                {tema === t && <div style={{ fontSize: '0.75rem', color: 'var(--emerald-400)', marginTop: '0.25rem' }}>✓ Activo</div>}
              </button>
            ))}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
            La preferencia se guarda localmente y se sincroniza con el servidor cuando hay conexión.
          </p>
        </div>
      )}
    </div>
  );
}

export default function PerfilPage() {
  return <SessionProvider><PerfilContent /></SessionProvider>;
}
