import { z } from 'zod';

export const COLUMNAS_REQUERIDAS_HORARIOS = [
	'UEA',
	'GRUPO',
	'LUNES_I',
	'LUNES_F',
	'MARTES_I',
	'MARTES_F',
	'MIERC_I',
	'MIERC_F',
	'JUEVES_I',
	'JUEVES_F',
	'VIERNES_I',
	'VIERNES_F'
] as const;

// Corresponde exactamente a la tabla de la seccion 12. No incluye
// Sabado/Domingo porque el archivo de horarios no trae esas columnas.
export const DIAS_HORARIO = [
	{ dia: 'Lunes', inicio: 'LUNES_I', fin: 'LUNES_F' },
	{ dia: 'Martes', inicio: 'MARTES_I', fin: 'MARTES_F' },
	{ dia: 'Miercoles', inicio: 'MIERC_I', fin: 'MIERC_F' },
	{ dia: 'Jueves', inicio: 'JUEVES_I', fin: 'JUEVES_F' },
	{ dia: 'Viernes', inicio: 'VIERNES_I', fin: 'VIERNES_F' }
] as const;

export type DiaHorarioImportado = (typeof DIAS_HORARIO)[number]['dia'];

export const filaHorarioImportadaSchema = z.object({
	UEA: z.string().trim().min(1, 'El nombre de la UEA no puede estar vacío.'),
	GRUPO: z.string().trim().min(1, 'El grupo no puede estar vacío.')
});

const PATRON_HORA = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i;

/**
 * Acepta formatos comunes al exportar celdas de hora desde Excel ("11:30",
 * "11:30:00", "11:30 AM") y los normaliza a "HH:MM" de 24 horas, el mismo
 * formato que ya usa Horario.inicio/fin en el resto de la aplicacion.
 * Devuelve null si el valor no tiene un formato de hora reconocible.
 */
export function normalizarHora(valor: string): string | null {
	const coincidencia = PATRON_HORA.exec(valor.trim());
	if (!coincidencia) {
		return null;
	}

	let horas = Number(coincidencia[1]);
	const minutos = coincidencia[2];
	const meridiano = coincidencia[3]?.toUpperCase();

	if (meridiano === 'PM' && horas < 12) horas += 12;
	if (meridiano === 'AM' && horas === 12) horas = 0;

	if (horas > 23 || Number(minutos) > 59) {
		return null;
	}

	return `${String(horas).padStart(2, '0')}:${minutos}`;
}
