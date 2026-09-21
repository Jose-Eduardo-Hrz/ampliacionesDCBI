import { z } from 'zod';

// Regla de negocio explicita: el correo debe pertenecer al dominio institucional.
export const correoInstitucionalSchema = z
	.string()
	.trim()
	.toLowerCase()
	.email('El correo no tiene un formato valido.')
	.refine((correo) => correo.endsWith('@azc.uam.mx'), {
		message: 'El correo debe pertenecer al dominio @azc.uam.mx.'
	});

// La especificacion no fija un formato exacto de telefono. Se adopta el
// estandar de numero mexicano a 10 digitos (mismo criterio que la matricula),
// documentado aqui como decision tecnica menor.
export const telefonoSchema = z
	.string()
	.trim()
	.regex(/^\d{10}$/, 'El telefono debe tener exactamente 10 digitos numericos.');
