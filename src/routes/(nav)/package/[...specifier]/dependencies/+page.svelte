<script lang="ts">
	import PackageCard from '$lib/components/PackageCard.svelte';
	import type { Dependency } from '$lib/data/types';
	import GraphEntry from './GraphEntry.svelte';

	const NAME_MAP = {
		prod: 'Dependencies',
		peer: 'Peer Dependencies',
		dev: 'Dev Dependencies',
	} satisfies Record<Dependency['type'], string>;

	const { data } = $props();

	const groups = $derived(
		Object.groupBy(data.pkg.dependencies, (dep) => dep.type),
	);
</script>

{#each Object.entries(groups) as [group, deps]}
	{#if deps.length}
		<section>
			<h3>{NAME_MAP[group as Dependency['type']]}</h3>

			{#if group === 'prod'}
				<GraphEntry />
			{/if}

			<div class="deps">
				{#each deps as pkg}
					<PackageCard {...pkg} />
				{/each}
			</div>
		</section>
	{/if}
{/each}

<style>
	.deps {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-block-start: 8px;

		:global(> *) {
			flex-basis: 35%;
		}
	}

	section {
		&:not(:first-child) {
			margin-block: 32px !important;
		}

		h3 {
			margin-block-end: 12px;
		}
	}
</style>
