<script lang="ts" module>
	export { failed, pending };
</script>

<script lang="ts">
	import IconRefresh from 'virtual:icons/lucide/refresh-cw';
	import IconLoader from 'virtual:icons/lucide/loader';
</script>

{#snippet failed(error: unknown, retry: () => void)}
	<div class="boundary failed">
		<button class="icon" onclick={retry}>
			<IconRefresh />
		</button>

		<p>{error}</p>
	</div>
{/snippet}

{#snippet pending()}
	<div class="boundary pending">
		<IconLoader />
		<p>Loading...</p>
	</div>
{/snippet}

<!-- styles in root layout due to
     https://github.com/sveltejs/svelte/issues/16404 -->
