import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/controllers/AuthController';
import { DashboardRepo } from '@/lib/repositories/DashboardRepository';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'No autenticado' }, { status: 401 });

  const url = new URL(req.url);
  const fechaDesde = url.searchParams.get('fechaDesde');
  const fechaHasta = url.searchParams.get('fechaHasta');
  const loteId     = url.searchParams.get('loteId')    ?? undefined;
  const campanaId  = url.searchParams.get('campanaId') ?? undefined;

  try {
    const [stats, campanas, lotes] = await Promise.all([
      DashboardRepo.getStats({
        fechaDesde: fechaDesde ? new Date(fechaDesde) : undefined,
        fechaHasta: fechaHasta ? new Date(fechaHasta + 'T23:59:59') : undefined,
        loteId,
        campanaId,
      }),
      DashboardRepo.getCampanas(),
      DashboardRepo.getLotes(),
    ]);
    return NextResponse.json({ ...stats, campanas, lotes });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 });
  }
}
