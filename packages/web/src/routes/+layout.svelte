<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import './global.css';

	const { children } = $props();

	const title = $derived.by(() => {
		const { id } = page.route;

		if (id === '/') {
			return 'home';
		} else if (id?.startsWith('/(nav)/package/[...specifier]')) {
			return page.params.specifier;
		} else if (id == '/(nav)/search') {
			return 'search';
		} else if (id == '/(nav)/~[author]') {
			return page.params.author;
		}

		return '???';
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{title} ~ npm-alt</title>
</svelte:head>

<main>
	{@render children()}
</main>

<style>
	main {
		padding-block: 16px;
		padding-inline: 16px;
		max-width: 1200px;
		margin: 0 auto;
		height: 100dvh;
	}
</style>
