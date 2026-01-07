<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import './global.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
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
