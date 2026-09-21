import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '$lib/server/db';

// Alumnos y UEA propios de esta prueba (no los del seed) para no interferir
// con otras pruebas ni con los datos de ejemplo, y para poder limpiar todo
// al final sin ambiguedad.
const MATRICULA_A = '9990000101';
const MATRICULA_B = '9990000102';
let idUeaUno: number;
let idUeaDos: number;

beforeAll(async () => {
	await prisma.alumno.createMany({
		data: [
			{ matricula: MATRICULA_A, nombre: 'Prueba Ampliacion A' },
			{ matricula: MATRICULA_B, nombre: 'Prueba Ampliacion B' }
		]
	});

	const ueaUno = await prisma.uea.create({
		data: { clave: '9990001', nombre: 'UEA de prueba (ampliacion) 1', grupo: '01' }
	});
	const ueaDos = await prisma.uea.create({
		data: { clave: '9990002', nombre: 'UEA de prueba (ampliacion) 2', grupo: '01' }
	});
	idUeaUno = ueaUno.id;
	idUeaDos = ueaDos.id;
});

afterAll(async () => {
	await prisma.ampliacion.deleteMany({ where: { matricula: { in: [MATRICULA_A, MATRICULA_B] } } });
	await prisma.alumno.deleteMany({ where: { matricula: { in: [MATRICULA_A, MATRICULA_B] } } });
	await prisma.uea.deleteMany({ where: { id: { in: [idUeaUno, idUeaDos] } } });
});

describe('restriccion UNIQUE(matricula, idUea) en Ampliacion', () => {
	it('misma matricula + misma UEA -> rechaza el duplicado', async () => {
		await prisma.ampliacion.create({ data: { matricula: MATRICULA_A, idUea: idUeaUno } });

		await expect(
			prisma.ampliacion.create({ data: { matricula: MATRICULA_A, idUea: idUeaUno } })
		).rejects.toThrow();
	});

	it('misma matricula + diferente UEA -> se permite', async () => {
		await expect(
			prisma.ampliacion.create({ data: { matricula: MATRICULA_A, idUea: idUeaDos } })
		).resolves.toMatchObject({ matricula: MATRICULA_A, idUea: idUeaDos });
	});

	it('diferentes alumnos + misma UEA -> se permite', async () => {
		await expect(
			prisma.ampliacion.create({ data: { matricula: MATRICULA_B, idUea: idUeaUno } })
		).resolves.toMatchObject({ matricula: MATRICULA_B, idUea: idUeaUno });
	});
});
