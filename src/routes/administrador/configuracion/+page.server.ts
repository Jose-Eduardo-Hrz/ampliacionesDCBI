import { fail, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Actions, PageServerLoad } from './$types';
import { configuracionRegistroSchema } from '$lib/validation/periodoRegistro';
import {
	obtenerConfiguracionRegistro,
	guardarConfiguracionRegistro
} from '$lib/server/repositories/configuracionRegistro';
import { calcularEstadoPeriodo } from '$lib/server/flujo/periodoRegistro';
import { registrarErrorServidor } from '$lib/server/logging';

// "Ahora" y las fechas guardadas se formatean con los getters LOCALES de
// Date (no los UTC): esto se hace en el servidor, no en el navegador del
// administrador, para que el formulario y la comparacion de apertura/cierre
// usen siempre la misma hora local del servidor (seccion 14), sin importar
// en que zona horaria este el navegador de quien administra.
function formatearFecha(fecha: Date): string {
	const anio = fecha.getFullYear();
	const mes = String(fecha.getMonth() + 1).padStart(2, '0');
	const dia = String(fecha.getDate()).padStart(2, '0');
	return `${anio}-${mes}-${dia}`;
}

function formatearHora(fecha: Date): string {
	const horas = String(fecha.getHours()).padStart(2, '0');
	const minutos = String(fecha.getMinutes()).padStart(2, '0');
	return `${horas}:${minutos}`;
}

// Protegida igual que el resto del area administrativa (mismo mecanismo de
// sesion resuelto en hooks.server.ts, sin un segundo sistema de
// autenticacion).
export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.administrador) {
		redirect(303, resolve('/administrador'));
	}

	const configuracion = await obtenerConfiguracionRegistro();

	return {
		administrador: locals.administrador,
		configuracion: configuracion
			? {
					fechaInicio: formatearFecha(configuracion.inicio),
					horaInicio: formatearHora(configuracion.inicio),
					fechaFin: formatearFecha(configuracion.fin),
					horaFin: formatearHora(configuracion.fin)
				}
			: null,
		estado: calcularEstadoPeriodo(configuracion)
	};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const datos = Object.fromEntries(await request.formData());
		const resultado = configuracionRegistroSchema.safeParse(datos);

		if (!resultado.success) {
			return fail(400, { error: resultado.error.issues[0].message });
		}

		try {
			await guardarConfiguracionRegistro(resultado.data);
		} catch (error) {
			const errorId = registrarErrorServidor('POST /administrador/configuracion', error);
			return fail(500, {
				error: `Ocurrió un error al guardar la configuración. Intenta de nuevo. (Referencia: ${errorId})`
			});
		}

		return { success: true };
	}
};
