<script lang="ts">
	import { failed, pending } from '$lib/boundary.svelte';
	import Pending from '$lib/components/Pending.svelte';
	import type { PageData } from './$types';
	import { page } from '$app/state';

	let data = $derived(page.data as PageData);
	let show = $state(false);
</script>

<div class="entry">
	{#if show}
		<svelte:boundary {failed} {pending}>
			{@const { default: Graph } = await import('./Graph.svelte')}
			<Pending />
			<Graph />
		</svelte:boundary>
	{:else}
		{@const href = `https://npmgraph.js.org/?q=${data.pkg.name}@${data.pkg.version}`}

		<button class="outline" onclick={() => (show = true)}>
			Show Dependency Graph
		</button>

		<p>or open on <a {href}>npmgraph</a></p>
	{/if}
</div>

<style>
	.entry {
		width: 100%;
		position: relative;

		border: 2px solid var(--background-tertiary);
		border-radius: 12px;
		overflow: clip;

		&:not(:has(.graph)) {
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 4px;

			padding: 22px 4px;

			button {
				padding: 6px 8px;
			}
		}
	}
</style>
