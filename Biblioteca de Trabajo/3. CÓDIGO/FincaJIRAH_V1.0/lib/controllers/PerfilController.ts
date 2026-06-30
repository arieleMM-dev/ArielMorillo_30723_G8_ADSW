/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CAPA DE LÓGICA DE NEGOCIO — PerfilController               ║
 * ║  Arquitectura de Tres Capas: Capa 2 (Negocio) — MVC         ║
 * ║                                                             ║
 * ║  Responsabilidad: coordina las operaciones del perfil       ║
 * ║  de usuario autenticado (CU-02).                            ║
 * ║  NO contiene lógica de datos — delega a UserRepository.     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './AuthController';
import { UserRepository } from '@/lib/repositories';
import { AuthService } from '@/lib/services/auth.service';
import bcrypt from 'bcryptjs';

export const PerfilController = {
  /**
   * GET /api/perfil
   * CU-02 — Obtener datos del perfil del usuario en sesión.
   */
  async obtener(req: NextRequest): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const user = await UserRepository.findById((session.user as any).id);
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return NextResponse.json({ user });
  },

  /**
   * PATCH /api/perfil
   * CU-02.1 — Actualizar datos de contacto (teléfono).
   * CU-02.3 — Cambiar preferencia de tema (CLARO/OSCURO).
   */
  async actualizar(req: NextRequest): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { telefono, tema } = await req.json();
    const userId = (session.user as any).id;

    // Validación de teléfono (Capa 2 — regla de negocio)
    if (telefono !== undefined && telefono !== null && telefono !== '') {
      if (!/^\d{7,15}$/.test(String(telefono))) {
        return NextResponse.json(
          { error: 'Formato de teléfono inválido (solo dígitos, 7-15 caracteres)' },
          { status: 422 }
        );
      }
    }

    // Validación de tema
    if (tema !== undefined && !['CLARO', 'OSCURO'].includes(tema)) {
      return NextResponse.json({ error: 'Tema inválido' }, { status: 422 });
    }

    const campos: Record<string, unknown> = {};
    if (telefono !== undefined) campos.telefono = telefono || null;
    if (tema !== undefined)     campos.tema = tema;

    const user = await UserRepository.update(userId, campos);
    return NextResponse.json({ message: 'Perfil actualizado', user });
  },

  /**
   * POST /api/perfil
   * CU-02.2 — Cambiar contraseña del usuario autenticado.
   * Reglas: contraseña actual válida + nueva contraseña cumple fortaleza mínima.
   */
  async cambiarPassword(req: NextRequest): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Contraseña actual y nueva son obligatorias' }, { status: 400 });
    }

    // Regla 1: Verificar contraseña actual (Capa 3 accede al hash)
    const userId = (session.user as any).id;
    const userWithHash = await UserRepository.findByEmailWithPassword((session.user as any).email ?? '');
    if (!userWithHash) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const valid = await bcrypt.compare(currentPassword, userWithHash.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 401 });
    }

    // Regla 2: Validar fortaleza de la nueva contraseña (Capa 2 — AuthService)
    const fortaleza = AuthService.validarFortaleza(newPassword);
    if (!fortaleza.ok) {
      return NextResponse.json({ error: fortaleza.mensaje }, { status: 422 });
    }

    // Regla 3: No reutilizar la misma contraseña
    const esMisma = await bcrypt.compare(newPassword, userWithHash.passwordHash);
    if (esMisma) {
      return NextResponse.json(
        { error: 'La nueva contraseña no puede ser igual a la contraseña actual' },
        { status: 422 }
      );
    }

    // Actualizar hash en la base de datos (Capa 3)
    const newHash = await AuthService.hashPassword(newPassword);
    await UserRepository.update(userId, { passwordHash: newHash });

    return NextResponse.json({ message: 'Contraseña actualizada exitosamente' });
  },
};
