import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { evaluarIngresoAlumno } from '$lib/server/flujo/ingresoAlumno';
import { registroEstaAbierto } from '$lib/server/flujo/periodoRegistro';
import {
	NOMBRE_COOKIE_PROCESO_ALUMNO,
	opcionesCookieProcesoAlumno
} from '$lib/server/auth/procesoAlumno';

const MENSAJES = {
	formato_invalido: 'La matricula debe tener exactamente 10 digitos numericos.',
	no_existe: 'El alumno no tiene autorización para solicitar ampliación.',
	ya_registrado: 'El alumno ya realizó la solicitud.'
} as const;

const MENSAJE_PERIODO_CERRADO = 'El periodo de registro no está disponible actualmente.';

export const load: PageServerLoad = async () => {
	return { registroAbierto: await registroEstaAbierto() };
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		// Condicion adicional al formato/autorizacion de la matricula (seccion
		// 9/10 de /administrador/configuracion): nunca se confia en que el
		// formulario haya estado oculto en el navegador, se vuelve a comprobar
		// aqui en el servidor.
		if (!(await registroEstaAbierto())) {
			return fail(403, { error: MENSAJE_PERIODO_CERRADO });
		}

		const datos = await request.formData();
		const matricula = String(datos.get('matricula') ?? '');

		const resultado = await evaluarIngresoAlumno(matricula);

		if (!resultado.ok) {
			const status = resultado.razon === 'formato_invalido' ? 400 : 403;
			return fail(status, { error: MENSAJES[resultado.razon] });
		}

		cookies.set(NOMBRE_COOKIE_PROCESO_ALUMNO, resultado.token, opcionesCookieProcesoAlumno);
		redirect(303, '/ampliaciones/registro');
	}
};
