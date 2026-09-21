import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { archivoImportacionSchema } from '$lib/validation/importArchivo';
import { importarAlumnosConUeas } from '$lib/server/flujo/importarAlumnosConUeas';
import { importarHorarios } from '$lib/server/flujo/importarHorarios';
import { registrarErrorServidor } from '$lib/server/logging';

// Protegida igual que el resto del area administrativa: mismo mecanismo de
// sesion resuelto en hooks.server.ts, sin un segundo sistema de autenticacion.
export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.administrador) {
		redirect(303, '/administrador');
	}

	return { administrador: locals.administrador };
};

export const actions: Actions = {
	importarAlumnos: async ({ request }) => {
		const formData = await request.formData();
		const archivoValidado = archivoImportacionSchema.safeParse(formData.get('archivoAlumnos'));

		if (!archivoValidado.success) {
			return fail(400, {
				seccion: 'alumnos' as const,
				error: archivoValidado.error.issues[0].message
			});
		}

		try {
			const buffer = await archivoValidado.data.arrayBuffer();
			const resultado = await importarAlumnosConUeas(buffer);

			if (!resultado.ok) {
				return fail(400, { seccion: 'alumnos' as const, error: resultado.mensaje });
			}

			return { seccion: 'alumnos' as const, success: true as const, resumen: resultado.resumen };
		} catch (error) {
			const errorId = registrarErrorServidor('POST /administrador/registro (alumnos)', error);
			return fail(500, {
				seccion: 'alumnos' as const,
				error: `Ocurrió un error al procesar el archivo. Intenta de nuevo. (Referencia: ${errorId})`
			});
		}
	},

	importarHorarios: async ({ request }) => {
		const formData = await request.formData();
		const archivoValidado = archivoImportacionSchema.safeParse(formData.get('archivoHorarios'));

		if (!archivoValidado.success) {
			return fail(400, {
				seccion: 'horarios' as const,
				error: archivoValidado.error.issues[0].message
			});
		}

		try {
			const buffer = await archivoValidado.data.arrayBuffer();
			const resultado = await importarHorarios(buffer);

			if (!resultado.ok) {
				return fail(400, { seccion: 'horarios' as const, error: resultado.mensaje });
			}

			return { seccion: 'horarios' as const, success: true as const, resumen: resultado.resumen };
		} catch (error) {
			const errorId = registrarErrorServidor('POST /administrador/registro (horarios)', error);
			return fail(500, {
				seccion: 'horarios' as const,
				error: `Ocurrió un error al procesar el archivo. Intenta de nuevo. (Referencia: ${errorId})`
			});
		}
	}
};
