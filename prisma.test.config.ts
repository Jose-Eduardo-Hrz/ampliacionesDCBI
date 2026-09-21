import { config } from 'dotenv';

// Config de Prisma exclusiva para `pnpm test`: usa .env.test (prisma/test.db)
// en vez de .env (prisma/dev.db), para que las pruebas nunca toquen los
// datos de desarrollo.
config({ path: '.env.test', override: true });

import { defineConfig } from 'prisma/config';

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations'
	},
	datasource: {
		url: process.env['DATABASE_URL']
	}
});
