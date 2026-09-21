import { z } from 'zod';

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const PATRON_HORA = /^\d{2}:\d{2}$/;

// Los inputs date + time nativos llegan como texto separado; se combinan en
// una cadena de fecha-hora local ("YYYY-MM-DDTHH:MM", sin sufijo "Z") para
// que new Date() la interprete como hora local del servidor de forma
// consistente con el resto de la comparacion (ver periodoRegistro.ts).
function combinarFechaHora(fecha: string, hora: string): Date {
	return new Date(`${fecha}T${hora}`);
}

export const configuracionRegistroSchema = z
	.object({
		fechaInicio: z.string().regex(PATRON_FECHA, 'La fecha de inicio no es válida.'),
		horaInicio: z.string().regex(PATRON_HORA, 'La hora de inicio no es válida.'),
		fechaFin: z.string().regex(PATRON_FECHA, 'La fecha de finalización no es válida.'),
		horaFin: z.string().regex(PATRON_HORA, 'La hora de finalización no es válida.')
	})
	.transform((datos) => ({
		inicio: combinarFechaHora(datos.fechaInicio, datos.horaInicio),
		fin: combinarFechaHora(datos.fechaFin, datos.horaFin)
	}))
	.refine((datos) => !Number.isNaN(datos.inicio.getTime()) && !Number.isNaN(datos.fin.getTime()), {
		message: 'La fecha y hora no son válidas.'
	})
	.refine((datos) => Number.isNaN(datos.inicio.getTime()) || datos.fin > datos.inicio, {
		message: 'La fecha y hora de finalización debe ser posterior a la de inicio.',
		path: ['fechaFin']
	});
