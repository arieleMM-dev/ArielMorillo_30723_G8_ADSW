export default function CatalogosPage() {
  const catalogos = [
    {
      title: 'Campañas',
      desc: 'Gestiona las campañas de cosecha (código, funda, tara base de gaveta 1.70kg)',
      icon: '🗓️',
      status: 'Próximamente — CU-04.1',
      count: 0,
    },
    {
      title: 'Lotes',
      desc: 'Mantén el catálogo de áreas de cultivo (código, nombre, hectáreas)',
      icon: '🌿',
      status: 'Próximamente — CU-04.2',
      count: 0,
    },
    {
      title: 'Compradores',
      desc: 'Registro de exportadores y mayoristas con su información de contacto',
      icon: '🤝',
      status: 'Próximamente — CU-04.3',
      count: 0,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-info">
          <h1>Catálogos de la Finca</h1>
          <p>Configuración y mantenimiento de datos maestros — CU-04</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {catalogos.map(cat => (
          <div key={cat.title} className="card" style={{ opacity: 0.75 }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{cat.icon}</div>
            <h3 style={{ marginBottom: '0.5rem' }}>{cat.title}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>{cat.desc}</p>
            <div className="divider" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
              <span className="badge badge-gray">{cat.status}</span>
              <button className="btn btn-secondary btn-sm" disabled>Gestionar</button>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '1.5rem', background: 'linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(245,158,11,0.03) 100%)', border: '1px solid rgba(16,185,129,0.15)' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div style={{ fontSize: '2rem' }}>📋</div>
          <div>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--emerald-400)' }}>Módulo CU-04 en desarrollo</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Los catálogos de campañas, lotes y compradores están preparados en el esquema de base de datos
              (<strong>Prisma schema</strong>) y listos para implementar las pantallas CRUD completas.
              Los modelos <code>Campana</code>, <code>Lote</code> y <code>Comprador</code> ya existen en la BD.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
