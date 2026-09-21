import { z } from 'zod';

// Al menos una UEA, sin repetidos (regla de negocio: no seleccionar la misma
// UEA dos veces). Que los ids realmente existan en la base de datos se
// verifica aparte, contra Prisma (ver src/lib/server/repositories/uea.ts).
export const seleccionUeasSchema = z
	.array(z.coerce.number().int().positive())
	.min(1, 'Debes seleccionar al menos una UEA.')
	.refine((ids) => new Set(ids).size === ids.length, {
		message: 'No puedes seleccionar la misma UEA mas de una vez.'
	});
