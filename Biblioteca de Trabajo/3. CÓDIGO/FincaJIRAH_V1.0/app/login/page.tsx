'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        if (result.error === 'ACCOUNT_INACTIVE') {
          setError('Su cuenta se encuentra desactivada. Comuníquese con el administrador de la finca.');
        } else {
          setError('Correo o contraseña incorrectos');
        }
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      {/* Panel izquierdo — Hero */}
      <div className="auth-hero">
        <div style={{ marginBottom: '2.5rem', textAlign: 'center', marginTop: '2rem' }}>
          <img 
            src="/Logo.jpeg" 
            alt="Logo Finca Jirah" 
            style={{ 
              maxWidth: '240px', 
              height: 'auto', 
              borderRadius: '12px', 
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              margin: '0 auto',
              display: 'block'
            }} 
          />
        </div>

        <h1 className="auth-hero-title" style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>
          Gestión Integral<br />de Producción
        </h1>
        <p className="auth-hero-subtitle" style={{ fontSize: '1.1rem', lineHeight: '1.6', maxWidth: '400px' }}>
          Sistema especializado para el control operativo de Finca Jirah. Administre la recolección, acopio y comercialización de pitahaya de exportación, manteniendo un registro preciso del rendimiento por lote y la trazabilidad del personal de campo.
        </p>
      </div>

      {/* Panel derecho — Formulario */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2 className="auth-form-title">Iniciar sesión</h2>
            <p className="auth-form-desc">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <form onSubmit={handleSubmit} id="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Correo electrónico</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="tu@correo.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label htmlFor="password" className="form-label" style={{ margin: 0 }}>Contraseña</label>
                <Link href="/recuperar" className="link" style={{ fontSize: '0.8rem' }}>
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="form-error" style={{ marginBottom: '1rem', fontSize: '0.875rem', padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button
              id="btn-ingresar"
              type="submit"
              className={`btn btn-primary btn-full ${loading ? 'btn-loading' : ''}`}
              disabled={loading}
            >
              {!loading && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
              )}
              {loading ? 'Verificando...' : 'Ingresar'}
            </button>
          </form>

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(16,185,129,0.06)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(16,185,129,0.12)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              💡 Credenciales de prueba
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Ejecuta <code style={{ background: 'var(--bg-input)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>npm run db:seed</code> para crear el usuario admin de prueba.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-5deg); }
          50%       { transform: translateY(-20px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}
