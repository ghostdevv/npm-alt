import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter(),

		experimental: {
			remoteFunctions: true,
		},
	},

	compilerOptions: {
		experimental: {
			async: true,
		},
	},
};

export default config;
