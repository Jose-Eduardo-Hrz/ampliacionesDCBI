import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { crearAdministradorSchema } from '$lib/validation/administrador';
import { crearCuentaAdministrador } from '$lib/server/auth/crearAdministrador';

// Protegida igual que /administrador/datos: sin sesion de administrador,
// fuera a /administrador.
export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.administrador) {
		redirect(303, '/ampliaciones/administrador');
	}

	return { administrador: locals.administrador };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const datos = Object.fromEntries(await request.formData());
		const resultado = crearAdministradorSchema.safeParse(datos);

		if (!resultado.success) {
			return fail(400, { error: resultado.error.issues[0].message });
		}

		const creado = await crearCuentaAdministrador(resultado.data);

		if (!creado.ok) {
			// Fase 28 no aplica aqui: quien crea la cuenta ya es un administrador
			// autenticado, no un actor anonimo intentando enumerar usuarios, asi
			// que confirmar que el numero economico ya existe es informacion
			// util y no sensible.
			return fail(409, { error: 'Ya existe una cuenta con ese número económico.' });
		}

		return { success: true };
	}
};
