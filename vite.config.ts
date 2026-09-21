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
				// Reemplaza checkOrigin por trustedOrigins e incluye tu IP
				trustedOrigins: ['http://192.168.100.24/:3000', 'http://localhost:3000']
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
