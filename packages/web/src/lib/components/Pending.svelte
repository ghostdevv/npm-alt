<script lang="ts">
	import { pending } from '$lib/boundary.svelte';
	import { fade } from 'svelte/transition';
</script>

{#if $effect.pending()}
	<div class="pending" in:fade>
		{@render pending()}
	</div>
{/if}

<style>
	.pending {
		position: absolute;
		z-index: 100;
		top: -8px;
		left: 0;

		width: 100%;
		height: calc(100% + 8px);

		backdrop-filter: blur(4px);
		padding: 8px;
	}
</style>
