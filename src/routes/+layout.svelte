<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import './global.css';
	import Notice from '$lib/components/Notice.svelte';

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
	<Notice id="npmx" colour="var(--background-tertiary)" floating>
		<h3 style="margin: 0px 0px 8px 0px;">./npmx.dev</h3>

		<p>
			Go checkout <a href="https://npmx.dev">npmx.dev</a> for the spiritual
			successor to npm-alt, with tons more features and a vibrant community.
		</p>

		<p>
			If you're interested in the data aspect, you can also join the #data
			channel on the <a href="https://chat.e18e.dev">e18e discord</a>
			where some of us are working on npm.rest, which includes a lot of the
			data work from here.
		</p>
	</Notice>

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
