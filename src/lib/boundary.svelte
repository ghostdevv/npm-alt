<script lang="ts" module>
	export { failed, pending };
</script>

<script lang="ts">
	import IconRefresh from 'virtual:icons/lucide/refresh-cw';
	import IconLoader from 'virtual:icons/lucide/loader';
</script>

{#snippet failed(error: unknown, retry: () => void)}
	<div class="failed">
		<button class="icon" onclick={retry}>
			<IconRefresh />
		</button>

		<p>{error}</p>
	</div>
{/snippet}

{#snippet pending()}
	<div class="pending">
		<IconLoader />
		<p>Loading...</p>
	</div>
{/snippet}

<style>
	.failed,
	.pending {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		height: fit-content;
		gap: 4px;
	}

	.failed {
		color: var(--red);
	}

	.pending {
		:global(svg) {
			animation: spin 1s linear infinite forwards;
			transform: rotate(0deg);
			will-change: transform;
		}
	}

	@keyframes spin {
		100% {
			transform: rotate(1turn);
		}
	}
</style>
