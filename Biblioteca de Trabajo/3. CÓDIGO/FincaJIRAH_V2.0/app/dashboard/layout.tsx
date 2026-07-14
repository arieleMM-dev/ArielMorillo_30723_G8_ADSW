'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';
import { useSyncManager } from '@/lib/hooks/useSyncManager';

type SubItem  = { href: string; label: string };
type NavItem  = { href: string; label: string; exact: boolean; icon: React.ReactNode; subItems?: SubItem[] };
type NavGroup = { section: string; adminOnly?: boolean; items: NavItem[] };

// ─── Navigation Structure ───────────────────────────────────────
const NAV: NavGroup[] = [
  {
    section: 'General',
    items: [
      {
        href: '/dashboard', label: 'Dashboard', exact: true,
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
      },
    ],
  },
  {
    section: 'Administración',
    adminOnly: true,
    items: [
      {
        href: '/dashboard/personal', label: 'Personal', exact: false,
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      },
      {
        href: '/dashboard/catalogos', label: 'Catálogos', exact: false,
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
        subItems: [
          { href: '/dashboard/catalogos/campanias', label: 'Campañas' },
          { href: '/dashboard/catalogos/lotes',     label: 'Lotes' },
          { href: '/dashboard/catalogos/compradores', label: 'Compradores' },
        ],
      },
    ],
  },
  {
    section: 'Campo',
    items: [
      {
        href: '/dashboard/campo/pesaje', label: 'Pesaje Bruto', exact: false,
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>,
      },
      {
        href: '/dashboard/campo/clasificacion', label: 'Clasificación', exact: false,
        icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
      },
    ],
  },
];

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const user = session?.user as any;
  const initials = user ? `${user.nombres?.[0] ?? ''}${user.apellidos?.[0] ?? ''}`.toUpperCase() : '?';

  const { isOnline } = useSyncManager();

  // Aplicar tema guardado
  useEffect(() => {
    const saved = localStorage.getItem('jirah-tema');
    if (saved === 'CLARO') document.documentElement.setAttribute('data-theme', 'light');
    else if (saved === 'OSCURO') document.documentElement.setAttribute('data-theme', 'dark');
  }, []);

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  // Topbar title from current route
  const currentLabel = (() => {
    for (const group of NAV) {
      for (const item of group.items) {
        if (item.subItems) {
          for (const sub of item.subItems) {
            if (pathname.startsWith(sub.href)) return sub.label;
          }
        }
        if (isActive(item.href, item.exact)) return item.label;
      }
    }
    if (pathname.startsWith('/dashboard/perfil')) return 'Mi Perfil';
    return 'Jirah';
  })();

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div style={{ width: 32, height: 32, borderRadius: 'var(--radius-md)', overflow: 'hidden', flexShrink: 0, background: '#fff', border: '1px solid var(--border)' }}>
            <img src="/Logo.jpeg" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <div className="sidebar-brand">Finca <span>Jirah</span></div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Sistema Agrícola</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(group => {
            if (group.adminOnly && user?.rol !== 'ADMIN') return null;
            return (
              <div key={group.section}>
                <span className="nav-section-label">{group.section}</span>
                {group.items.map((item: NavItem) => {
                  const active = isActive(item.href, item.exact);
                  const subActive = item.subItems?.some((s: SubItem) => pathname.startsWith(s.href));
                  return (
                    <div key={item.href}>
                      <Link
                        href={item.href}
                        className={`nav-item ${active || subActive ? 'active' : ''}`}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                      {/* Sub-items for Catálogos */}
                      {item.subItems && (active || subActive) && (
                        <div style={{ paddingLeft: 26, display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {item.subItems!.map((sub: SubItem) => (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={`nav-item ${pathname.startsWith(sub.href) ? 'active' : ''}`}
                              style={{ fontSize: '0.82rem', padding: '5px 10px' }}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          <div style={{ marginTop: '0.5rem' }}>
            <span className="nav-section-label">Cuenta</span>
            <Link href="/dashboard/perfil" className={`nav-item ${pathname.startsWith('/dashboard/perfil') ? 'active' : ''}`}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Mi Perfil
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div className="user-card" onClick={() => signOut({ callbackUrl: '/login' })}>
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{user?.nombres} {user?.apellidos}</div>
              <div className="user-role">{user?.rol}</div>
            </div>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ flexShrink: 0 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">{currentLabel}</div>
          <div className="topbar-actions">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px', fontSize: '0.75rem', fontWeight: 600, padding: '4px 8px', borderRadius: 'var(--radius-md)', background: isOnline ? 'var(--green-50)' : 'var(--red-50)', color: isOnline ? 'var(--green-700)' : 'var(--red-600)', border: `1px solid ${isOnline ? 'var(--green-200)' : 'var(--red-200)'}` }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: isOnline ? 'var(--green-500)' : 'var(--red-500)' }} />
              {isOnline ? 'En línea' : 'Sin conexión'}
            </div>
            <Link href="/dashboard/perfil" style={{ textDecoration: 'none' }}>
              <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem', cursor: 'pointer' }}>{initials}</div>
            </Link>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  );
}
