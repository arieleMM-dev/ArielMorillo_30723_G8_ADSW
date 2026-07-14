'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Force dark mode for login
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

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
        // Obtener rol del usuario para redirección (CU-01.1)
        const res = await fetch('/api/perfil');
        const data = await res.json();
        
        if (data.user?.rol === 'ADMIN') {
          router.push('/dashboard');
        } else {
          router.push('/dashboard/campo/pesaje');
        }
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div style={{ width: 64, height: 64, borderRadius: 'var(--radius-lg)', background: '#fff', margin: '0 auto 16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
            <img src="/Logo.jpeg" alt="Finca Jirah" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <h1 className="login-title">Bienvenido a Jirah</h1>
          <p className="login-subtitle">Gestión Integral de Producción</p>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label htmlFor="password" className="form-label" style={{ margin: 0 }}>Contraseña</label>
              <Link href="/recuperar" style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textDecoration: 'none' }}>
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
            <div className="alert alert-error" style={{ marginBottom: '16px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <button
            id="btn-ingresar"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
            disabled={loading}
          >
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            ¿Necesitas acceso? Contacta al administrador
          </p>
        </div>
      </div>
    </div>
  );
}
