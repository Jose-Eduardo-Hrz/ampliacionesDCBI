import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { env } from '$env/dynamic/private';
import { PrismaClient } from './generated/prisma/client';

// En desarrollo, Vite recarga modulos con cada cambio (HMR). Sin este cacheo
// en globalThis, cada recarga crearia una nueva conexion a SQLite y agotaria
// los manejadores de archivo. Patron estandar recomendado por Prisma.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

async function createPrismaClient(): Promise<PrismaClient> {
	const adapter = new PrismaBetterSqlite3({
		url: env.DATABASE_URL ?? 'file:./prisma/dev.db',
		// Si el archivo esta bloqueado por otra conexion, espera hasta 5s antes
		// de lanzar SQLITE_BUSY en vez de fallar de inmediato. No deberia
		// ocurrir con un solo proceso Node (una sola conexion, sin contencion
		// interna), pero es defensa barata ante picos de solicitudes.
		timeout: 5000
	});
	const client = new PrismaClient({ adapter });

	// WAL evita que las escrituras bloqueen las lecturas (a diferencia del
	// modo "rollback journal" por defecto). Tampoco es indispensable con un
	// solo proceso, pero protege si en el futuro otro proceso (una migracion,
	// un script) llega a tocar el mismo archivo mientras el servidor corre.
	// Se guarda en el propio archivo de la base de datos (no hay que repetirlo
	// en cada arranque), asi que si un arranque puntual lo encuentra ocupado
	// no vale la pena tumbar el servidor por eso: se reintentara solo en el
	// siguiente arranque.
	try {
		await client.$executeRawUnsafe('PRAGMA journal_mode = WAL;');
	} catch (error) {
		console.warn('No se pudo activar el modo WAL en SQLite, se reintentará en el próximo arranque.', error);
	}

	return client;
}

export const prisma = globalForPrisma.prisma ?? (await createPrismaClient());

if (import.meta.env.DEV) {
	globalForPrisma.prisma = prisma;
}
