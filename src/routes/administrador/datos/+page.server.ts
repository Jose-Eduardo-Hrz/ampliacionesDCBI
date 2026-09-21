import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { NOMBRE_COOKIE_SESION } from '$lib/server/auth/session';
import { obtenerAlumnosConAmpliaciones } from '$lib/server/repositories/alumno';
import { resolve } from '$app/paths';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.administrador) {
		redirect(303, resolve('/administrador'));
	}

	const alumnos = await obtenerAlumnosConAmpliaciones();

	return { administrador: locals.administrador, alumnos };
};

export const actions: Actions = {
	// El "path" de una cookie es un atributo de coincidencia exacta (debe ser
	// el mismo texto usado al crearla, ver opcionesCookieSesion en
	// auth/session.ts: path: '/'), no una ruta de navegacion: nunca debe
	// pasarse por resolve(). Si no coincide exactamente, el navegador no borra
	// la cookie original y la sesion queda activa.
	cerrarSesion: async ({ cookies }) => {
		cookies.delete(NOMBRE_COOKIE_SESION, { path: '/' });
		redirect(303, resolve('/administrador'));
	}
};
