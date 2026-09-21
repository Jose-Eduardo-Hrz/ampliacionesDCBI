import 'dotenv/config';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/lib/server/generated/prisma/client';
import { hashPassword } from '../src/lib/server/auth/password';

const adapter = new PrismaBetterSqlite3({
	url: process.env.DATABASE_URL ?? 'file:./prisma/dev.db'
});

const prisma = new PrismaClient({ adapter });

async function seedAdministrador() {
	await prisma.administrador.upsert({
		where: { numeroEconomico: '44251' },
		update: {},
		create: {
			numeroEconomico: '44251',
			nombre: 'Jose Eduardo Hernández',
			password: await hashPassword('AUuDcr5776')
		}
	});
}

async function seedAlumnos() {
	const alumnos = [
		{
			matricula: '2181012345',
			nombre: 'Ana García López',
			correo: null,
			telefono: null,
			estado: 'EnEspera'
		},
		{
			matricula: '2181012346',
			nombre: 'Luis Fernández Ruiz',
			correo: 'luis.fernandez@azc.uam.mx',
			telefono: '5511112222',
			estado: 'EnEspera'
		},
		{
			matricula: '2181012347',
			nombre: 'María Torres Sánchez',
			correo: 'maria.torres@azc.uam.mx',
			telefono: '5533334444',
			estado: 'EnEspera'
		},
		{
			matricula: '2181012348',
			nombre: 'Carlos Méndez Ortiz',
			correo: null,
			telefono: null,
			estado: 'EnEspera'
		}
	] as const;

	for (const alumno of alumnos) {
		await prisma.alumno.upsert({
			where: { matricula: alumno.matricula },
			update: {},
			create: alumno
		});
	}
}

async function seedUeasYHorarios() {
	const ueas = [
		{ clave: '1110001', nombre: 'Cálculo Diferencial e Integral I', grupo: '01' },
		{ clave: '1110001', nombre: 'Cálculo Diferencial e Integral I', grupo: '02' },
		{ clave: '1120003', nombre: 'Álgebra Lineal', grupo: '01' },
		{ clave: '2210007', nombre: 'Estructura de Datos', grupo: '01' },
		{ clave: '2210007', nombre: 'Estructura de Datos', grupo: '02' }
	] as const;

	const idPorClaveGrupo = new Map<string, number>();

	for (const uea of ueas) {
		const registro = await prisma.uea.upsert({
			where: { clave_grupo: { clave: uea.clave, grupo: uea.grupo } },
			update: {},
			create: uea
		});
		idPorClaveGrupo.set(`${uea.clave}-${uea.grupo}`, registro.id);
	}

	const horarios = [
		{ ueaKey: '1110001-01', dia: 'Lunes', inicio: '08:00', fin: '10:00' },
		{ ueaKey: '1110001-01', dia: 'Miercoles', inicio: '08:00', fin: '10:00' },
		{ ueaKey: '1110001-02', dia: 'Martes', inicio: '10:00', fin: '12:00' },
		{ ueaKey: '1120003-01', dia: 'Lunes', inicio: '10:00', fin: '12:00' },
		{ ueaKey: '1120003-01', dia: 'Jueves', inicio: '10:00', fin: '12:00' },
		{ ueaKey: '2210007-01', dia: 'Viernes', inicio: '08:00', fin: '10:00' },
		{ ueaKey: '2210007-02', dia: 'Sabado', inicio: '09:00', fin: '11:00' }
	] as const;

	for (const horario of horarios) {
		const idUea = idPorClaveGrupo.get(horario.ueaKey);
		if (!idUea) throw new Error(`UEA no encontrada para seed de horario: ${horario.ueaKey}`);

		await prisma.horario.upsert({
			where: {
				idUea_dia_inicio_fin: {
					idUea,
					dia: horario.dia,
					inicio: horario.inicio,
					fin: horario.fin
				}
			},
			update: {},
			create: { idUea, dia: horario.dia, inicio: horario.inicio, fin: horario.fin }
		});
	}

	return idPorClaveGrupo;
}

async function seedAmpliaciones(idPorClaveGrupo: Map<string, number>) {
	const ampliaciones = [
		{ matricula: '2181012346', ueaKey: '1110001-01', estado: 'Autorizado', solicitud: null },
		{ matricula: '2181012346', ueaKey: '2210007-01', estado: 'Autorizado', solicitud: null },
		{
			matricula: '2181012347',
			ueaKey: '1110001-01',
			estado: 'PasarOficinaEnlace',
			solicitud: 'Aceptar'
		},
		{ matricula: '2181012347', ueaKey: '1120003-01', estado: 'NoAutorizado', solicitud: null }
	] as const;

	for (const ampliacion of ampliaciones) {
		const idUea = idPorClaveGrupo.get(ampliacion.ueaKey);
		if (!idUea) throw new Error(`UEA no encontrada para seed de ampliacion: ${ampliacion.ueaKey}`);

		await prisma.ampliacion.upsert({
			where: { matricula_idUea: { matricula: ampliacion.matricula, idUea } },
			update: {},
			create: {
				matricula: ampliacion.matricula,
				idUea,
				estado: ampliacion.estado,
				solicitud: ampliacion.solicitud
			}
		});
	}
}

async function main() {
	await seedAdministrador();
	// await seedAlumnos();
	// const idPorClaveGrupo = await seedUeasYHorarios();
	// await seedAmpliaciones(idPorClaveGrupo);

	console.log('Seed completado.');
}

main()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
