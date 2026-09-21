import { config } from 'dotenv';

// Carga .env.test ANTES de que seed.ts cargue su propio .env: dotenv no
// sobrescribe variables ya definidas, asi que esta debe ejecutarse primero.
config({ path: '.env.test', override: true });

await import('./seed.ts');
