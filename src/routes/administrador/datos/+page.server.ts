import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { NOMBRE_COOKIE_SESION } from '$lib/server/auth/session';
import { obtenerAlumnosConAmpliaciones } from '$lib/server/repositories/alumno';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.administrador) {
		redirect(303, '/administrador');
	}

	const alumnos = await obtenerAlumnosConAmpliaciones();

	return { administrador: locals.administrador, alumnos };
};

export const actions: Actions = {
	cerrarSesion: async ({ cookies }) => {
		cookies.delete(NOMBRE_COOKIE_SESION, { path: '/' });
		redirect(303, '/administrador');
	}
};
