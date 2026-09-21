import { randomUUID } from 'node:crypto';

/**
 * Registra un error inesperado en el servidor (consola) con un identificador
 * corto, y devuelve ese identificador para mostrarlo al usuario como
 * referencia de soporte. El detalle completo (mensaje, stack) nunca sale de
 * aqui: el resto de la aplicacion solo ve el id, nunca el error original.
 */
export function registrarErrorServidor(contexto: string, error: unknown): string {
	const errorId = randomUUID();
	console.error(`[${errorId}] ${new Date().toISOString()} ${contexto}`, error);
	return errorId;
}
