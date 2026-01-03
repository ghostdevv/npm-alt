import { FileSystemIconLoader } from 'unplugin-icons/loaders';
import { sveltekit } from '@sveltejs/kit/vite';
import Icons from 'unplugin-icons/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		Icons({
			compiler: 'svelte',
			customCollections: {
				custom: FileSystemIconLoader('./src/lib/assets/icons'),
			},
		}),
	],
});
