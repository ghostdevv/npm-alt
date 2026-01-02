<script lang="ts">
	import PackageCard from '$lib/PackageCard.svelte';
	import Inspect from 'svelte-inspect-value';
	import { search } from './search.svelte';
	import Modal from '$lib/Modal.svelte';

	const { total, results, done } = $derived(await search.results());
</script>

<section class:stale={$effect.pending() > 0}>
	<div>
		<p style="display: inline-block;">
			Found {total} packages.
		</p>

		<Modal>
			{#snippet activator()}
				<button
					class="icon"
					style="padding: 0px; display: inline-block;"
				>
					View raw.
				</button>
			{/snippet}

			{#snippet children()}
				<Inspect value={{ total, results, done }} />
			{/snippet}
		</Modal>
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
