import { prisma } from '$lib/server/db';
import {
	leerHojaDeCalculo,
	encontrarColumnasFaltantes
} from '$lib/server/import/leerHojaDeCalculo';
import {
	COLUMNAS_REQUERIDAS_ALUMNOS,
	filaAlumnoImportadoSchema,
	MAPA_ESTADO_AMPLIACION
} from '$lib/validation/importAlumnos';

export interface ErrorFilaImportacion {
	fila: number;
	mensaje: string;
}

export interface ResumenImportacionAlumnos {
	filasLeidas: number;
	alumnosCreados: number;
	alumnosReutilizados: number;
	ueasCreadas: number;
	ueasReutilizadas: number;
	ampliacionesCreadas: number;
	omitidas: number;
	errores: ErrorFilaImportacion[];
}

export type ResultadoImportacionAlumnos =
	{ ok: true; resumen: ResumenImportacionAlumnos } | { ok: false; mensaje: string };

interface FilaAlumnoValida {
	fila: number;
	matricula: string;
	nombreAlumno: string;
	clave: string;
	nombreUea: string;
	grupo: string;
	estadoAmpliacion: (typeof MAPA_ESTADO_AMPLIACION)[keyof typeof MAPA_ESTADO_AMPLIACION];
}

/**
 * Importa alumnos + UEA + Ampliacion desde un archivo .xlsx/.xls/.csv
 * (seccion 3-8 de la especificacion de /administrador/registro).
 *
 * Orden (seccion 16): leer -> validar columnas -> validar cada fila ->
 * SOLO despues escribir. La resolucion de relaciones (reutilizar Alumno/UEA
 * existentes, evitar Ampliacion duplicada) ocurre de forma secuencial
 * dentro de una unica transaccion: asi, si la misma UEA aparece en varias
 * filas del mismo archivo, la segunda fila reutiliza la creada por la
 * primera en vez de intentar crearla otra vez (lo que violaria la
 * restriccion unica clave+grupo). Si algo inesperado falla a mitad de
 * camino, toda la transaccion se revierte (seccion 15) - nunca se queda a
 * medias.
 */
export async function importarAlumnosConUeas(
	buffer: ArrayBuffer
): Promise<ResultadoImportacionAlumnos> {
	let hoja;
	try {
		hoja = leerHojaDeCalculo(buffer);
	} catch {
		return {
			ok: false,
			mensaje: 'No se pudo leer el archivo. Verifica que sea un Excel o CSV válido.'
		};
	}

	if (hoja.columnas.length === 0) {
		return { ok: false, mensaje: 'El archivo está vacío o no se pudo leer.' };
	}

	const columnasFaltantes = encontrarColumnasFaltantes(hoja.columnas, COLUMNAS_REQUERIDAS_ALUMNOS);
	if (columnasFaltantes.length > 0) {
		return {
			ok: false,
			mensaje: `Faltan columnas obligatorias: ${columnasFaltantes.join(', ')}.`
		};
	}

	if (hoja.filas.length === 0) {
		return { ok: false, mensaje: 'El archivo no contiene ninguna fila de datos.' };
	}

	const filasValidas: FilaAlumnoValida[] = [];
	const errores: ErrorFilaImportacion[] = [];

	hoja.filas.forEach((filaCruda, indice) => {
		const numeroFila = indice + 2; // +1 (0-index) + 1 (fila de encabezado)
		const resultado = filaAlumnoImportadoSchema.safeParse(filaCruda);

		if (!resultado.success) {
			errores.push({ fila: numeroFila, mensaje: resultado.error.issues[0].message });
			return;
		}

		filasValidas.push({
			fila: numeroFila,
			matricula: resultado.data.MATRICULA,
			nombreAlumno: resultado.data.ALUMNO,
			clave: resultado.data.CLAVE,
			nombreUea: resultado.data.UEA,
			grupo: resultado.data.GRUPO,
			estadoAmpliacion: MAPA_ESTADO_AMPLIACION[resultado.data.AMPLIACION]
		});
	});

	let alumnosCreados = 0;
	let alumnosReutilizados = 0;
	let ueasCreadas = 0;
	let ueasReutilizadas = 0;
	let ampliacionesCreadas = 0;
	let omitidas = 0;

	await prisma.$transaction(async (tx) => {
		for (const fila of filasValidas) {
			const alumnoExistente = await tx.alumno.findUnique({ where: { matricula: fila.matricula } });

			if (alumnoExistente) {
				alumnosReutilizados++;
			} else {
				await tx.alumno.create({
					data: {
						matricula: fila.matricula,
						nombre: fila.nombreAlumno,
						correo: null,
						telefono: null,
						estado: 'EnEspera'
					}
				});
				alumnosCreados++;
			}

			let uea = await tx.uea.findUnique({
				where: { clave_grupo: { clave: fila.clave, grupo: fila.grupo } }
			});

			if (uea) {
				ueasReutilizadas++;
			} else {
				uea = await tx.uea.create({
					data: { clave: fila.clave, nombre: fila.nombreUea, grupo: fila.grupo }
				});
				ueasCreadas++;
			}

			const ampliacionExistente = await tx.ampliacion.findUnique({
				where: { matricula_idUea: { matricula: fila.matricula, idUea: uea.id } }
			});

			if (ampliacionExistente) {
				omitidas++;
				continue;
			}

			await tx.ampliacion.create({
				data: { matricula: fila.matricula, idUea: uea.id, estado: fila.estadoAmpliacion }
			});
			ampliacionesCreadas++;
		}
	});

	return {
		ok: true,
		resumen: {
			filasLeidas: hoja.filas.length,
			alumnosCreados,
			alumnosReutilizados,
			ueasCreadas,
			ueasReutilizadas,
			ampliacionesCreadas,
			omitidas,
			errores
		}
	};
}
