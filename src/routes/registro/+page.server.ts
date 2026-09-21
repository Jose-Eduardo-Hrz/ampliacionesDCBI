import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	NOMBRE_COOKIE_PROCESO_ALUMNO,
	verificarTokenProcesoAlumno
} from '$lib/server/auth/procesoAlumno';
import { verificarDisponibilidadAlumno } from '$lib/server/repositories/alumno';
import { listarUeasConHorarios, listarAmpliacionesPorAlumno } from '$lib/server/repositories/uea';
import { MAX_PDF_SIZE_MB } from '$lib/server/config';
import { enviarRegistro } from '$lib/server/flujo/enviarRegistro';
import { registroEstaAbierto } from '$lib/server/flujo/periodoRegistro';
import { registrarErrorServidor } from '$lib/server/logging';

/**
 * Guard de /registro (Fase 12/14): la matricula nunca se toma de un
 * parametro de la URL ni de un campo del formulario, solo del token firmado
 * emitido por /. Ademas se vuelve a comprobar disponibilidad contra la base
 * de datos (no solo la validez del token) por si el estado del alumno
 * cambio despues de emitido.
 */
export const load: PageServerLoad = async ({ cookies }) => {
	const token = cookies.get(NOMBRE_COOKIE_PROCESO_ALUMNO);
	const proceso = verificarTokenProcesoAlumno(token);

	if (!proceso) {
		redirect(303, '/ampliaciones/ampliaciones');
	}

	const disponibilidad = await verificarDisponibilidadAlumno(proceso.matricula);

	// Si el alumno ya no existe, el token no sirve para nada: fuera, a /.
	if (disponibilidad.estado === 'no_existe') {
		redirect(303, '/ampliaciones/ampliaciones');
	}

	// Si ya esta registrado (porque termino su registro, o porque perdio una
	// carrera de doble envio contra otra solicitud concurrente), se muestra
	// un mensaje claro en esta misma pagina en vez de redirigir en silencio a
	// / - el formulario no debe reaparecer (Fase 19).
	if (disponibilidad.estado === 'ya_registrado') {
		return { yaRegistrado: true as const, periodoCerrado: false as const };
	}

	// Condicion adicional (seccion 8 de /administrador/configuracion): no
	// basta con ocultar el formulario en /, tambien se revisa aqui aunque el
	// alumno tenga un token valido y llegue por URL directa.
	if (!(await registroEstaAbierto())) {
		return { yaRegistrado: false as const, periodoCerrado: true as const };
	}

	// const ueas = await listarUeasConHorarios();

	const ueas = await listarAmpliacionesPorAlumno(proceso.matricula);

	return {
		yaRegistrado: false as const,
		periodoCerrado: false as const,
		alumno: disponibilidad.alumno,
		ueas,
		// ampliaciones,
		maxPdfSizeMb: MAX_PDF_SIZE_MB
	};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		// 1. Validar sesion/proceso: la matricula de confianza sale unicamente
		// de este token, nunca de un campo del formulario.
		const token = cookies.get(NOMBRE_COOKIE_PROCESO_ALUMNO);
		const proceso = verificarTokenProcesoAlumno(token);

		if (!proceso) {
			redirect(303, '/ampliaciones/ampliaciones');
		}

		const formData = await request.formData();


		let resultado;
		try {
			resultado = await enviarRegistro({
				matricula: proceso.matricula,
				correo: formData.get('correo'),
				telefono: formData.get('telefono'),
				idUeas: formData.getAll('idUeas'),
				credencial: formData.get('credencial'),
				solicitud: formData.get('solicitud')
			});
		} catch (error) {
			const errorId = registrarErrorServidor(
				`POST /ampliaciones/registro (matricula=${proceso.matricula})`,
				error
			);
			return fail(500, {
				error: `Ocurrió un error al procesar tu solicitud. Intenta de nuevo. (Referencia: ${errorId})`
			});
		}

		if (!resultado.ok) {
			return fail(400, { error: resultado.mensaje, campo: resultado.campo });
		}

		cookies.delete(NOMBRE_COOKIE_PROCESO_ALUMNO, { path: '/ampliaciones' });
		redirect(303, '/ampliaciones/registro/exito');
	}
};
