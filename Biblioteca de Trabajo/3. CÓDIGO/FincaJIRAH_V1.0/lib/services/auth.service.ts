/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  CAPA DE LÓGICA DE NEGOCIO — AuthService                    ║
 * ║  Arquitectura de Tres Capas: Capa 2 (Negocio)               ║
 * ║                                                             ║
 * ║  Responsabilidad: implementa las reglas de autenticación.   ║
 * ║  NO conoce Prisma — delega al UserRepository (Capa 3).      ║
 * ║  Usa el Patrón Observer para notificar cambios de sesión.   ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import bcrypt from 'bcryptjs';
import { UserRepository } from '@/lib/repositories';

// ─── Patrón Observer — interfaz del suscriptor de autenticación ─
export interface AuthObserver {
  onLoginSuccess(userId: string): void;
  onLoginFailure(email: string): void;
}

const observers: AuthObserver[] = [];

export const AuthService = {
  // ── Patrón Observer: registrar/quitar observadores ────────────
  subscribe(observer: AuthObserver) {
    observers.push(observer);
  },
  unsubscribe(observer: AuthObserver) {
    const idx = observers.indexOf(observer);
    if (idx >= 0) observers.splice(idx, 1);
  },

  /**
   * Valida credenciales de un usuario.
   * CU-01.1 — Autenticación con correo y contraseña.
   *
   * @returns El usuario público si las credenciales son correctas, null si no.
   * @throws 'ACCOUNT_INACTIVE' si la cuenta existe pero está desactivada.
   */
  async login(email: string, password: string) {
    // Capa 3: obtener el hash almacenado
    const user = await UserRepository.findByEmailWithPassword(email);

    if (!user) {
      observers.forEach(o => o.onLoginFailure(email));
      return null;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      observers.forEach(o => o.onLoginFailure(email));
      return null;
    }

    if (!user.isActive) {
      throw new Error('ACCOUNT_INACTIVE');
    }

    // Registrar el último acceso (sin bloquear la respuesta)
    UserRepository.update(user.id, { lastLoginAt: new Date() }).catch(() => null);

    observers.forEach(o => o.onLoginSuccess(user.id));

    // Devolvemos el usuario sin el hash
    const { passwordHash: _, ...publicUser } = user;
    return publicUser;
  },

  /**
   * Genera y almacena un token de recuperación de contraseña.
   * CU-01.2 — Recuperación de contraseña por correo.
   *
   * Retorna el token en DEV para pruebas (en producción se enviaría por email).
   */
  async generarTokenRecuperacion(email: string): Promise<string | null> {
    const user = await UserRepository.findByEmail(email);
    if (!user) return null; // No revelar si existe

    const token = crypto.randomUUID();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await UserRepository.update(user.id, {
      // Los campos token se pueden agregar al schema; por ahora lo almacenamos como comentario
      // resetToken: token, resetTokenExpiry: expiry,
    });

    // TODO (producción): enviar email con enlace de recuperación
    console.log(`[DEV] Token de recuperación para ${email}: ${token} (expira: ${expiry.toISOString()})`);

    return token;
  },

  /**
   * Valida la fortaleza de una contraseña nueva.
   * Mínimo 8 caracteres, 1 mayúscula, 1 número.
   */
  validarFortaleza(password: string): { ok: boolean; mensaje?: string } {
    if (password.length < 8)       return { ok: false, mensaje: 'Mínimo 8 caracteres' };
    if (!/[A-Z]/.test(password))   return { ok: false, mensaje: 'Debe tener al menos 1 letra mayúscula' };
    if (!/[0-9]/.test(password))   return { ok: false, mensaje: 'Debe tener al menos 1 número' };
    return { ok: true };
  },

  /**
   * Genera una contraseña temporal alfanumérica de 10 caracteres.
   * Usada al crear nuevos agricultores (CU-03.1).
   */
  generarPasswordTemporal(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    return Array.from(crypto.getRandomValues(new Uint8Array(10)))
      .map(b => chars[b % chars.length])
      .join('');
  },

  /**
   * Hashea una contraseña con bcrypt (cost factor 12).
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  },
};
