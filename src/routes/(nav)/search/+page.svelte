<script lang="ts">
	import InspectModal from '$lib/components/InspectModal.svelte';
	import PackageCard from '$lib/components/PackageCard.svelte';
	import { failed, pending } from '$lib/boundary.svelte';
	import Pending from '$lib/components/Pending.svelte';
	import { search } from './search.svelte';
</script>

<svelte:boundary {failed} {pending}>
	{@const result = await search.results()}

	<section class:stale={$effect.pending() > 0}>
		<Pending />

		<div>
			<p style="display: inline-block;">
				Found {result.total} packages.
			</p>

			<InspectModal value={result}>
				<button class="icon" style="display: inline-block;">
					View raw.
				</button>
			</InspectModal>
		</div>

		<div class="results">
			{#each result.results as res}
				<PackageCard pkg={res.package} />
			{/each}
		</div>

		{#if !result.done}
			<button
				class="icon"
				onclick={() => search.loadMore()}
				disabled={$effect.pending() > 0}
			>
				Load More
			</button>
		{/if}
	</section>
</svelte:boundary>

<style>
	section {
		position: relative;

		&.stale {
			opacity: 0.8;
			transition: opacity 0.2s ease-in-out;
		}

		.results {
			display: flex;
			flex-direction: column;
			gap: 12px;
		}

		button {
			padding: 0px;
		}
	}
</style>
