import 'dotenv/config';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter(),
			csrf: {
				// Misma variable ORIGIN que ya usa @sveltejs/adapter-node para su
				// propio origen (ver .env.example): una sola fuente de verdad para
				// la URL real de despliegue, sin IPs sueltas en el codigo fuente.
				// OJO: a diferencia de adapter-node (que lee ORIGIN en cada arranque
				// del servidor), esto se incrusta en el build: si cambia ORIGIN hay
				// que correr `pnpm run build` de nuevo, no solo reiniciar el proceso.
				trustedOrigins: process.env.ORIGIN ? [process.env.ORIGIN] : []
			},
			paths: {
				base: '/ampliaciones'
			}
		})
	],
	test: {
		environment: 'node',
		include: ['src/**/*.test.ts']
	}
});
