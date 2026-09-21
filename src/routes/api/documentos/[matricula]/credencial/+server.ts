import type { RequestHandler } from './$types';
import { requireAdministrador } from '$lib/server/auth/guard';
import { leerDocumentoAlumno } from '$lib/server/files/servirDocumento';

export const GET: RequestHandler = async ({ params, locals }) => {
	requireAdministrador(locals);

	const { buffer, nombreArchivo } = await leerDocumentoAlumno(params.matricula, 'credencial');

	return new Response(new Uint8Array(buffer), {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${nombreArchivo}"`
		}
	});
};
