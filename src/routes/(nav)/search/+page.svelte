<script lang="ts">
	import InspectModal from '$lib/components/InspectModal.svelte';
	import PackageCard from '$lib/components/PackageCard.svelte';
	import { search } from './search.svelte';

	const { total, results, done } = $derived(await search.results());
</script>

<section class:stale={$effect.pending() > 0}>
	<div>
		<p style="display: inline-block;">
			Found {total} packages.
		</p>

		<InspectModal value={{ total, results, done }}>
			<button class="icon" style="padding: 0px; display: inline-block;">
				View raw.
			</button>
		</InspectModal>
	</div>

	<div class="results">
		{#each results as result}
			<PackageCard pkg={result.package} />
		{/each}
	</div>

	{#if !done}
		<button
			class="icon"
			onclick={() => search.loadMore()}
			disabled={$effect.pending() > 0}
		>
			Load More
		</button>
	{/if}
</section>

<style>
	.results {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.stale {
		opacity: 0.8;
		transition: opacity 0.2s ease-in-out;
	}
</style>
