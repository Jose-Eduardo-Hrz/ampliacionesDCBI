import type { Handle, HandleServerError } from '@sveltejs/kit';
import { NOMBRE_COOKIE_SESION, verificarTokenSesion } from '$lib/server/auth/session';
import { buscarAdministradorPorNumeroEconomico } from '$lib/server/repositories/administrador';
import { registrarErrorServidor } from '$lib/server/logging';

/**
 * Resuelve la sesion del administrador en cada request y la deja en
 * event.locals, para que ninguna ruta tenga que leer la cookie por su
 * cuenta. Se vuelve a consultar la base de datos (no solo se confia en el
 * contenido del token) para que, si la cuenta ya no existe, la sesion deje
 * de ser valida de inmediato.
 */
export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(NOMBRE_COOKIE_SESION);
	const payload = verificarTokenSesion(token);

	if (payload) {
		const administrador = await buscarAdministradorPorNumeroEconomico(payload.numeroEconomico);
		event.locals.administrador = administrador
			? { numeroEconomico: administrador.numeroEconomico, nombre: administrador.nombre }
			: null;
	} else {
		event.locals.administrador = null;
	}

	const response = await resolve(event);

	// Cabeceras de seguridad basicas (Fase 28). No hay {@html} en toda la app
	// (verificado), pero estas son defensa adicional de bajo costo.
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	return response;
};

/**
 * Red de seguridad global (Fase 24): cualquier error que no haya sido
 * capturado y convertido en un mensaje amigable en el codigo (excepciones
 * inesperadas de Prisma, del sistema de archivos, etc.) pasa por aqui antes
 * de llegar al usuario. Se registra el detalle completo solo en el servidor
 * (consola) y al usuario se le devuelve un mensaje generico + un id de
 * referencia corto, nunca el mensaje ni la pila de la excepcion original
 * (que podrian contener rutas internas, fragmentos de SQL, etc.).
 */
export const handleError: HandleServerError = ({ error, event }) => {
	const errorId = registrarErrorServidor(`${event.request.method} ${event.url.pathname}`, error);

	return {
		message: 'Ocurrió un error inesperado. Intenta de nuevo más tarde.',
		errorId
	};
};
