<script lang="ts">
	import { failed, pending } from '$lib/boundary.svelte';
	import Pending from '$lib/components/Pending.svelte';
	import { goto, onNavigate } from '$app/navigation';
	import { search } from './search/search.svelte';
	import { useSearchParams } from 'runed/kit';
	import { onClickOutside } from 'runed';
	import { page } from '$app/state';
	import * as v from 'valibot';

	const params = useSearchParams(v.object({ q: v.optional(v.string(), '') }));
	const openable = $derived(!page.url.pathname.endsWith('/search'));
	let open = $state(false);

	$effect(() => {
		search.query = params.q;
	});

	onNavigate((event) => {
		if (event.from?.url.pathname != event.to?.url.pathname) {
			open = false;
		}
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
			bind:value={() => params.q, (value) => (params.q = value)}
			onkeydown={(event) => {
				if (event.key === 'Enter' && page.url.pathname != '/search') {
					const url = new URL('/search', location.origin);
					url.searchParams.set('q', params.q);
					goto(url);
				}
			}}
		/>
	</label>

	{#if openable && open && search.query.length >= 2}
		<ul class="results">
			<svelte:boundary {failed} {pending}>
				<Pending />

				{#each (await search.results()).results as result}
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
					<li class="empty"><p>No results :((</p></li>
				{/each}
			</svelte:boundary>
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

			&:not(:has(li)) > *,
			.empty,
			.result {
				width: 100%;
				margin: 0px;
				padding: 8px 12px;

				p {
					margin: 0px;
				}
			}

			.result {
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
