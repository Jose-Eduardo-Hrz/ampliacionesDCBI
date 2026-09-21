import { prisma } from '$lib/server/db';
import {
	leerHojaDeCalculo,
	encontrarColumnasFaltantes
} from '$lib/server/import/leerHojaDeCalculo';
import {
	COLUMNAS_REQUERIDAS_HORARIOS,
	DIAS_HORARIO,
	filaHorarioImportadaSchema,
	normalizarHora,
	type DiaHorarioImportado
} from '$lib/validation/importHorarios';
import type { ErrorFilaImportacion } from './importarAlumnosConUeas';

export interface ResumenImportacionHorarios {
	filasLeidas: number;
	horariosCreados: number;
	horariosOmitidos: number;
	errores: ErrorFilaImportacion[];
}

export type ResultadoImportacionHorarios =
	{ ok: true; resumen: ResumenImportacionHorarios } | { ok: false; mensaje: string };

interface FilaHorarioValida {
	fila: number;
	nombreUea: string;
	grupo: string;
	horarios: { dia: DiaHorarioImportado; inicio: string; fin: string }[];
}

/**
 * Importa horarios desde un archivo .xlsx/.xls/.csv (secciones 9-13). La
 * UEA se busca por (UEA, GRUPO) - el archivo no trae CLAVE - y su id se usa
 * como Horario.idUea (nunca se guarda el nombre de la UEA en Horario).
 * Mismo orden y misma transaccion unica que importarAlumnosConUeas.
 */
export async function importarHorarios(buffer: ArrayBuffer): Promise<ResultadoImportacionHorarios> {
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

	const columnasFaltantes = encontrarColumnasFaltantes(hoja.columnas, COLUMNAS_REQUERIDAS_HORARIOS);
	if (columnasFaltantes.length > 0) {
		return {
			ok: false,
			mensaje: `Faltan columnas obligatorias: ${columnasFaltantes.join(', ')}.`
		};
	}

	if (hoja.filas.length === 0) {
		return { ok: false, mensaje: 'El archivo no contiene ninguna fila de datos.' };
	}

	const filasValidas: FilaHorarioValida[] = [];
	const errores: ErrorFilaImportacion[] = [];

	hoja.filas.forEach((filaCruda, indice) => {
		const numeroFila = indice + 2;
		const base = filaHorarioImportadaSchema.safeParse(filaCruda);

		if (!base.success) {
			errores.push({ fila: numeroFila, mensaje: base.error.issues[0].message });
			return;
		}

		const horariosDeLaFila: FilaHorarioValida['horarios'] = [];

		for (const { dia, inicio, fin } of DIAS_HORARIO) {
			const valorInicio = filaCruda[inicio] ?? '';
			const valorFin = filaCruda[fin] ?? '';

			// Seccion 12: si ambas columnas del dia estan vacias, se omite ese
			// dia (no es un error, simplemente esa UEA no tiene clase ese dia).
			if (!valorInicio && !valorFin) {
				continue;
			}

			const horaInicio = normalizarHora(valorInicio);
			const horaFin = normalizarHora(valorFin);

			if (!horaInicio || !horaFin) {
				errores.push({
					fila: numeroFila,
					mensaje: `Horario de ${dia} con formato inválido (usa HH:MM).`
				});
				return;
			}

			horariosDeLaFila.push({ dia, inicio: horaInicio, fin: horaFin });
		}

		filasValidas.push({
			fila: numeroFila,
			nombreUea: base.data.UEA,
			grupo: base.data.GRUPO,
			horarios: horariosDeLaFila
		});
	});

	let horariosCreados = 0;
	let horariosOmitidos = 0;

	await prisma.$transaction(async (tx) => {
		for (const fila of filasValidas) {
			const uea = await tx.uea.findFirst({ where: { nombre: fila.nombreUea, grupo: fila.grupo } });

			if (!uea) {
				errores.push({
					fila: fila.fila,
					mensaje: `UEA no encontrada: "${fila.nombreUea}" grupo "${fila.grupo}".`
				});
				continue;
			}

			for (const horario of fila.horarios) {
				const existente = await tx.horario.findUnique({
					where: {
						idUea_dia_inicio_fin: {
							idUea: uea.id,
							dia: horario.dia,
							inicio: horario.inicio,
							fin: horario.fin
						}
					}
				});

				if (existente) {
					horariosOmitidos++;
					continue;
				}

				await tx.horario.create({
					data: { idUea: uea.id, dia: horario.dia, inicio: horario.inicio, fin: horario.fin }
				});
				horariosCreados++;
			}
		}
	});

	return {
		ok: true,
		resumen: { filasLeidas: hoja.filas.length, horariosCreados, horariosOmitidos, errores }
	};
}
