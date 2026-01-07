<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import 'ghostsui';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<main>
	{@render children()}
</main>

<style>
	main {
		padding-block: 16px;
		padding-inline: 16px;
		max-width: 1200px;
		margin: 0 auto;
		height: 100dvh;
	}

	/* styles moved here from $lib/boundary.svelte due to */
	/* https://github.com/sveltejs/svelte/issues/16404 */
	/* when fixed should move back to component */
	:global(.boundary) {
		&.failed,
		&.pending {
			display: flex;
			align-items: center;
			justify-content: flex-start;
			height: fit-content;
			gap: 4px;
		}

		&.failed {
			color: var(--red);
		}
	}

	:global(.boundary.pending svg),
	:global(.spin) {
		animation: spin 1s linear infinite forwards;
		transform: rotate(0deg);
		will-change: transform;
	}

	@keyframes spin {
		100% {
			transform: rotate(1turn);
		}
	}
</style>
