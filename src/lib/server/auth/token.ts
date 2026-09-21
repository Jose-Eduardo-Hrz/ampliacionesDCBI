import { createHmac, timingSafeEqual } from 'node:crypto';
import { SESSION_SECRET } from '$lib/server/config';

/**
 * Primitivo generico de token firmado (HMAC-SHA256), sin estado en el
 * servidor: el contenido y su expiracion viajan en el propio token. La firma
 * impide que el navegador pueda fabricar o alterar un token valido sin
 * conocer SESSION_SECRET. Usado tanto por la sesion de administrador
 * (Fase 10/11) como por el proceso de registro del alumno (Fase 12).
 */

function firmar(datos: string): string {
	return createHmac('sha256', SESSION_SECRET).update(datos).digest('base64url');
}

export function crearTokenFirmado<T extends object>(payload: T, maxAgeSegundos: number): string {
	const conExpiracion = { ...payload, exp: Math.floor(Date.now() / 1000) + maxAgeSegundos };
	const datos = Buffer.from(JSON.stringify(conExpiracion)).toString('base64url');
	return `${datos}.${firmar(datos)}`;
}

export function verificarTokenFirmado<T extends object>(
	token: string | undefined | null,
	esPayloadValido: (payload: unknown) => payload is T
): T | null {
	if (!token) return null;

	const [datos, firma] = token.split('.');
	if (!datos || !firma) return null;

	const firmaEsperada = firmar(datos);
	const firmaBuffer = Buffer.from(firma);
	const firmaEsperadaBuffer = Buffer.from(firmaEsperada);
	if (
		firmaBuffer.length !== firmaEsperadaBuffer.length ||
		!timingSafeEqual(firmaBuffer, firmaEsperadaBuffer)
	) {
		return null;
	}

	let payload: unknown;
	try {
		payload = JSON.parse(Buffer.from(datos, 'base64url').toString('utf-8'));
	} catch {
		return null;
	}

	if (!esPayloadValido(payload)) {
		return null;
	}

	const conExp = payload as T & { exp: unknown };
	if (typeof conExp.exp !== 'number' || conExp.exp < Math.floor(Date.now() / 1000)) {
		return null;
	}

	return payload;
}
