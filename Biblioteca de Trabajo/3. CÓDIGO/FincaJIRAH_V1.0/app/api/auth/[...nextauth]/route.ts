/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CAPA DE PRESENTACIÓN — Route Handler /api/auth/[...nextauth]║
 * ║  Arquitectura de Tres Capas: Capa 1 (Presentación)          ║
 * ║                                                             ║
 * ║  Responsabilidad: entry point HTTP para NextAuth.           ║
 * ║  Delega TODA la lógica a AuthController (Capa 2).           ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import NextAuth from 'next-auth';
import { authOptions } from '@/lib/controllers/AuthController';

// Exportar authOptions para uso en getServerSession en otros Route Handlers
export { authOptions };

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
