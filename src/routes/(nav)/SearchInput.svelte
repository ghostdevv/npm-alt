<script lang="ts">
	import { search } from './search/search.svelte';
	import { onClickOutside } from 'runed';
	import { useThrottle } from 'runed';
	import { page } from '$app/state';
	import { onNavigate } from '$app/navigation';

	let query = $state(page.url.searchParams.get('q') || '');
	// svelte-ignore state_referenced_locally
	search.query = query;

	const updateSearch = useThrottle(() => {
		search.query = query;
	});

	const { total, results, done } = $derived(await search.results());

	const openable = $derived(!page.url.pathname.endsWith('/search'));
	let open = $state(false);

	onNavigate(() => {
		open = false;
	});
</script>

<div
	class="search"
	{@attach (node) => {
		onClickOutside(node, () => (open = false));
	}}
>
	<label>
		<span class="sr-only">Search NPM</span>

		<input
			type="search"
			name="q"
			placeholder="Search for...?"
			onfocus={() => (open = openable)}
			onkeydown={() => {}}
			bind:value={
				() => query,
				(v) => {
					query = v;
					updateSearch();
				}
			}
		/>
	</label>

	{#if openable && open && search.query.length}
		<ul class="results">
			{#each results as result}
				<li class="result">
					<a href="/package/{result.package.name}/overview">
						<div class="stretch">
							{result.package.name}<span class="version">
								@{result.package.version}
							</span>
						</div>
					</a>
				</li>
			{:else}
				<li><p>No results :((</p></li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.search {
		position: relative;

		.results {
			position: absolute;
			z-index: 100;
			top: 100%;

			width: 100%;
			max-height: 300px;
			overflow: clip;
			overflow-y: auto;

			padding: 0px;
			margin: 0px;

			background-color: var(--background-primary);
			border: 2px solid var(--background-tertiary);
			border-radius: 12px;
			list-style: none;

			display: flex;
			flex-direction: column;

			.result {
				width: 100%;
				margin: 0px;
				padding: 8px 12px;

				a {
					color: var(--text);
				}

				.stretch {
					width: 100%;
				}

				.version {
					color: var(--text-grey);
				}

				&:hover,
				&:focus {
					background-color: color(
						from var(--primary) srgb r g b / 0.2
					);
				}
			}
		}
	}
</style>
