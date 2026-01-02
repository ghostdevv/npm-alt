<script lang="ts" module>
	export { failed };
</script>

<script lang="ts">
	import IconRefresh from 'virtual:icons/lucide/refresh-cw';
</script>

{#snippet failed(error: unknown, retry: () => void)}
	<div class="failed">
		<button class="icon" onclick={retry}>
			<IconRefresh />
		</button>

		<p>{error}</p>
	</div>
{/snippet}

<style>
	.failed {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		height: fit-content;
		gap: 4px;

		color: var(--red);
	}
</style>
