import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { env } from '$env/dynamic/private';
import { PrismaClient } from './generated/prisma/client';

// En desarrollo, Vite recarga modulos con cada cambio (HMR). Sin este cacheo
// en globalThis, cada recarga crearia una nueva conexion a SQLite y agotaria
// los manejadores de archivo. Patron estandar recomendado por Prisma.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
	const adapter = new PrismaBetterSqlite3({
		url: env.DATABASE_URL ?? 'file:./prisma/dev.db'
	});
	return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (import.meta.env.DEV) {
	globalForPrisma.prisma = prisma;
}
