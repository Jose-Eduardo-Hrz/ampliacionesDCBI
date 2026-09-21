import { error } from '@sveltejs/kit';

/**
 * Verificacion de autenticacion centralizada para endpoints administrativos
 * (Fase 10, y cualquier otro endpoint /api/* que lo requiera despues). No se
 * basa en nada que envie el cliente: locals.administrador ya fue resuelto
 * en hooks.server.ts contra la cookie de sesion firmada y la base de datos.
 */
export function requireAdministrador(locals: App.Locals) {
	if (!locals.administrador) {
		error(401, 'Se requiere iniciar sesion como administrador.');
	}
	return locals.administrador;
}
