import { SESSION_MAX_AGE_SEGUNDOS, COOKIE_SECURE } from '$lib/server/config';
import { crearTokenFirmado, verificarTokenFirmado } from './token';

export const NOMBRE_COOKIE_SESION = 'admin_session';

interface PayloadSesion {
	numeroEconomico: string;
	exp: number;
}

function esPayloadSesion(payload: unknown): payload is PayloadSesion {
	return (
		typeof payload === 'object' &&
		payload !== null &&
		typeof (payload as PayloadSesion).numeroEconomico === 'string'
	);
}

export function crearTokenSesion(numeroEconomico: string): string {
	return crearTokenFirmado({ numeroEconomico }, SESSION_MAX_AGE_SEGUNDOS);
}

export function verificarTokenSesion(
	token: string | undefined | null
): { numeroEconomico: string } | null {
	const payload = verificarTokenFirmado(token, esPayloadSesion);
	return payload ? { numeroEconomico: payload.numeroEconomico } : null;
}

export const opcionesCookieSesion = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: COOKIE_SECURE,
	maxAge: SESSION_MAX_AGE_SEGUNDOS
};
