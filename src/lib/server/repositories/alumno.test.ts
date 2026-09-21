import { describe, it, expect } from 'vitest';
import { verificarDisponibilidadAlumno } from './alumno';

// Fixtures del seed (prisma/seed.ts): Ana esta en espera (disponible para
// registrarse), Luis ya completo su registro.
const MATRICULA_INEXISTENTE = '0000000000';
const MATRICULA_DISPONIBLE = '2181012345'; // Ana Garcia Lopez, EnEspera
const MATRICULA_YA_REGISTRADA = '2181012346'; // Luis Fernandez Ruiz, Registrado

describe('verificarDisponibilidadAlumno', () => {
	it('alumno inexistente -> no_existe', async () => {
		const resultado = await verificarDisponibilidadAlumno(MATRICULA_INEXISTENTE);
		expect(resultado.estado).toBe('no_existe');
	});

	it('alumno autorizado sin registrar -> disponible', async () => {
		const resultado = await verificarDisponibilidadAlumno(MATRICULA_DISPONIBLE);
		expect(resultado.estado).toBe('disponible');
	});

	it('alumno ya registrado -> ya_registrado', async () => {
		const resultado = await verificarDisponibilidadAlumno(MATRICULA_YA_REGISTRADA);
		expect(resultado.estado).toBe('ya_registrado');
	});
});
