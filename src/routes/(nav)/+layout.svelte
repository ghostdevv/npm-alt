<script lang="ts">
	import NavigationIndicator from '$lib/components/NavigationIndicator.svelte';
	import Expansion from '$lib/expansions/Expansion.svelte';
	import { search } from './search/search.svelte';
	import { useThrottle } from 'runed';
	import { page } from '$app/state';

	let { children } = $props();

	let query = $state(page.url.searchParams.get('q') || '');
	// svelte-ignore state_referenced_locally
	search.query = query;

	const updateSearch = useThrottle(() => {
		search.query = query;
	});
</script>

<NavigationIndicator />

<div class="wrapper">
	<header>
		<a href="/"><Expansion /></a>

		<label>
			<span class="sr-only">Search NPM</span>
			<input
				type="search"
				name="q"
				placeholder="Search for...?"
				bind:value={
					() => query,
					(v) => {
						query = v;
						updateSearch();
					}
				}
			/>
		</label>
	</header>

	<div class="children">
		{@render children()}
	</div>
</div>

<style>
	.wrapper {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: max-content 1fr;
		height: 100%;

		header {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 8px;

			background-color: var(--background-secondary);
			padding-block: 4px;
			padding-inline: 10px;
			border-radius: 12px;

			a {
				color: var(--text);
			}
		}

		.children {
			overflow-y: auto;
			padding-block-start: 8px;
		}
	}
</style>
