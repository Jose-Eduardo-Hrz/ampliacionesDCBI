import { fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { loginAdministradorSchema } from '$lib/validation/administrador';
import { iniciarSesionAdministrador } from '$lib/server/auth/login';
import { NOMBRE_COOKIE_SESION, opcionesCookieSesion } from '$lib/server/auth/session';
import {
	estaBloqueado,
	registrarIntentoExitoso,
	registrarIntentoFallido
} from '$lib/server/auth/rateLimit';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.administrador) {
		redirect(303, resolve('/administrador/datos'));
	}
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		console.log('Accediendo a /administrador con metodo POST');
		const datos = Object.fromEntries(await request.formData());
		const resultado = loginAdministradorSchema.safeParse(datos);

		if (!resultado.success) {
			return fail(400, { error: 'Ingresa tu numero economico y tu contrasena.' });
		}

		const { numeroEconomico } = resultado.data;

		// Limite de intentos (Fase 28): bloquea intentos de fuerza bruta contra
		// una misma cuenta, sin importar si el password es correcto o no.
		if (estaBloqueado(numeroEconomico)) {
			return fail(429, {
				error: 'Demasiados intentos fallidos. Intenta de nuevo en unos minutos.'
			});
		}

		const login = await iniciarSesionAdministrador(numeroEconomico, resultado.data.password);

		if (!login.ok) {
			registrarIntentoFallido(numeroEconomico);
			// Fase 28: mensaje generico independientemente de la razon interna
			// (login.razon), para no revelar si un numeroEconomico existe.
			return fail(401, { error: 'Usuario o contraseña incorrectos.' });
		}

		console.log(`Administrador ${numeroEconomico} ha iniciado sesion correctamente.`);

		registrarIntentoExitoso(numeroEconomico);
		cookies.set(NOMBRE_COOKIE_SESION, login.token, opcionesCookieSesion);
		const redirectUrl = resolve('/administrador/datos');
		console.log(`Redirigiendo a ${redirectUrl}`);
		redirect(303, redirectUrl);
	}
};
