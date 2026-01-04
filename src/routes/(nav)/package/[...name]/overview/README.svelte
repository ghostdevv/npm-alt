<script lang="ts">
	import { renderREADME } from '$lib/data/package.remote';
	import { failed } from '$lib/failed.svelte';

	interface Props {
		name: string;
		specifier: string;
	}

	const props: Props = $props();
	const readme = $derived(await renderREADME(props));
</script>

<svelte:boundary {failed}>
	{#if readme}
		{@html readme}
	{:else}
		<p style="color: var(--text-grey);">No README found</p>
	{/if}

	{#if $effect.pending()}
		<div class="loading">Loading...</div>
	{/if}
</svelte:boundary>
