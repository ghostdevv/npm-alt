<script lang="ts">
	import Expansion from '$lib/expansions/Expansion.svelte';
	import { search } from './search/search.svelte';
	import { useThrottle } from 'runed';
	import { page } from '$app/state';

	let { children } = $props();

	let query = $state(page.url.searchParams.get('q') || '');
	search.query = query;

	const updateSearch = useThrottle(() => {
		search.query = query;
	});
</script>

<div class="wrapper">
	<header>
		<Expansion />

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
			padding-block: 8px;
			padding-inline: 8px;
			border-radius: 12px;
		}

		.children {
			overflow-y: auto;
			padding-block-start: 8px;
		}
	}
</style>
