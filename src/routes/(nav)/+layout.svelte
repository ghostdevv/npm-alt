<script lang="ts">
	import NavigationIndicator from '$lib/components/NavigationIndicator.svelte';
	import Expansion from '$lib/components/expansions/Expansion.svelte';
	import { failed, pending } from '$lib/boundary.svelte';
	import Pending from '$lib/components/Pending.svelte';
	import SearchInput from './SearchInput.svelte';

	const { children } = $props();
</script>

<NavigationIndicator />

<div class="wrapper">
	<header>
		<a href="/"><Expansion /></a>
		<SearchInput />
	</header>

	<div class="children">
		<svelte:boundary {failed} {pending}>
			<Pending />
			{@render children()}
		</svelte:boundary>
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
			padding-block: 4px;
			padding-inline: 10px;
			border-radius: 12px;

			a {
				color: var(--text);
			}
		}

		.children {
			overflow-y: auto;
			padding-block-start: 8px;
			position: relative;
		}
	}
</style>
