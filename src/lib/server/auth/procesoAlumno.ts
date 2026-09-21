import { crearTokenFirmado, verificarTokenFirmado } from './token';
import { COOKIE_SECURE } from '$lib/server/config';

export const NOMBRE_COOKIE_PROCESO_ALUMNO = 'alumno_proceso';

// La especificacion no fija una duracion; se elige un tiempo corto (30 min)
// suficiente para completar /registro (llenar datos y subir 2 PDF) sin dejar
// una "sesion" de alumno abierta indefinidamente. Decision tecnica menor.
const PROCESO_MAX_AGE_SEGUNDOS = 30 * 60;

interface PayloadProcesoAlumno {
	matricula: string;
	exp: number;
}

function esPayloadProcesoAlumno(payload: unknown): payload is PayloadProcesoAlumno {
	return (
		typeof payload === 'object' &&
		payload !== null &&
		typeof (payload as PayloadProcesoAlumno).matricula === 'string'
	);
}

/**
 * Token que certifica que esta matricula ya fue validada (existe y aun no
 * se ha registrado) en /. /registro y el envio final del formulario deben
 * leer la matricula de este token, nunca de un campo oculto ni de un
 * parametro que el navegador pueda alterar libremente.
 */
export function crearTokenProcesoAlumno(matricula: string): string {
	return crearTokenFirmado({ matricula }, PROCESO_MAX_AGE_SEGUNDOS);
}

export function verificarTokenProcesoAlumno(
	token: string | undefined | null
): { matricula: string } | null {
	const payload = verificarTokenFirmado(token, esPayloadProcesoAlumno);
	return payload ? { matricula: payload.matricula } : null;
}

export const opcionesCookieProcesoAlumno = {
	path: '/',
	httpOnly: true,
	sameSite: 'lax' as const,
	secure: COOKIE_SECURE,
	maxAge: PROCESO_MAX_AGE_SEGUNDOS
};
