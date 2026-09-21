import { z } from 'zod';

// Regla de negocio: exactamente 10 caracteres, unicamente numeros.
export const matriculaSchema = z
	.string()
	.trim()
	.regex(/^\d{10}$/, 'La matricula debe tener exactamente 10 digitos numericos.');
