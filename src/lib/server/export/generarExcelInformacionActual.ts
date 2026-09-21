import * as XLSX from 'xlsx';
import { ETIQUETAS_ESTADO_AMPLIACION } from '$lib/estados';
import { listarAmpliacionesParaExportar } from '$lib/server/repositories/ampliacion';

const ENCABEZADOS: string[] = ['Matricula', 'Alumno', 'Clave', 'UEA', 'Grupo', 'Ampliacion'];

/**
 * Excel de /administrador/datos (boton "Descargar informacion actual").
 * "Registros" incluye todas las Ampliacion; "Solicitudes" es el mismo
 * conjunto filtrado por Ampliacion.solicitud === 'Aceptar'. En ambas hojas
 * la columna "Ampliacion" siempre muestra Ampliacion.estado (nunca
 * solicitud), usando la misma etiqueta legible que StatusBadge.
 */
export async function generarExcelInformacionActual(): Promise<Buffer> {
	const ampliaciones = await listarAmpliacionesParaExportar();

	const filas = ampliaciones.map((ampliacion) => [
		ampliacion.matricula,
		ampliacion.alumno.nombre,
		ampliacion.uea.clave,
		ampliacion.uea.nombre,
		ampliacion.uea.grupo,
		ETIQUETAS_ESTADO_AMPLIACION[ampliacion.estado] ?? ampliacion.estado
	]);

	const filasSolicitudes = ampliaciones
		.filter((ampliacion) => ampliacion.solicitud === 'Aceptar')
		.map((ampliacion) => [
			ampliacion.matricula,
			ampliacion.alumno.nombre,
			ampliacion.uea.clave,
			ampliacion.uea.nombre,
			ampliacion.uea.grupo,
			ETIQUETAS_ESTADO_AMPLIACION[ampliacion.estado] ?? ampliacion.estado
		]);

	const libro = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(
		libro,
		XLSX.utils.aoa_to_sheet([ENCABEZADOS, ...filas]),
		'Registros'
	);
	XLSX.utils.book_append_sheet(
		libro,
		XLSX.utils.aoa_to_sheet([ENCABEZADOS, ...filasSolicitudes]),
		'Solicitudes'
	);

	return XLSX.write(libro, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}
