import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireAdministrador } from '$lib/server/auth/guard';
import { registrarErrorServidor } from '$lib/server/logging';
import { generarExcelInformacionActual } from '$lib/server/export/generarExcelInformacionActual';

export const GET: RequestHandler = async ({ locals }) => {
	requireAdministrador(locals);

	let buffer: Buffer;
	try {
		buffer = await generarExcelInformacionActual();
	} catch (err) {
		const errorId = registrarErrorServidor('GET /ampliaciones/api/administrador/excel', err);
		error(500, `No se pudo generar el archivo. Intenta de nuevo. (Referencia: ${errorId})`);
	}

	return new Response(new Uint8Array(buffer), {
		headers: {
			'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'Content-Disposition': 'attachment; filename="informacion_actual.xlsx"'
		}
	});
};
