import { z } from 'zod';
import { matriculaSchema } from './matricula';

export const COLUMNAS_REQUERIDAS_ALUMNOS = [
	'MATRICULA',
	'ALUMNO',
	'CLAVE',
	'UEA',
	'GRUPO',
	'AMPLIACION'
] as const;

// Texto exacto que puede venir en la columna AMPLIACION del archivo
// (seccion 6), mapeado al valor real del enum EstadoAmpliacion de Prisma.
export const MAPA_ESTADO_AMPLIACION = {
	Autorizado: 'Autorizado',
	'Pasar a la Oficina de enlace': 'PasarOficinaEnlace',
	'No autorizado': 'NoAutorizado'
} as const;

const VALORES_AMPLIACION_ARCHIVO = Object.keys(MAPA_ESTADO_AMPLIACION) as [
	keyof typeof MAPA_ESTADO_AMPLIACION,
	...(keyof typeof MAPA_ESTADO_AMPLIACION)[]
];

export const filaAlumnoImportadoSchema = z.object({
	MATRICULA: matriculaSchema,
	ALUMNO: z.string().trim().min(1, 'El nombre del alumno no puede estar vacío.'),
	CLAVE: z.string().trim().min(1, 'La clave de la UEA no puede estar vacía.'),
	UEA: z.string().trim().min(1, 'El nombre de la UEA no puede estar vacío.'),
	GRUPO: z.string().trim().min(1, 'El grupo no puede estar vacío.'),
	AMPLIACION: z.enum(VALORES_AMPLIACION_ARCHIVO, {
		message: `El valor de AMPLIACION debe ser uno de: ${VALORES_AMPLIACION_ARCHIVO.join(', ')}.`
	})
});
