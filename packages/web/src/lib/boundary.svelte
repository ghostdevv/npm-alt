<script lang="ts" module>
	import IconRefresh from 'virtual:icons/lucide/refresh-cw';
	import IconLoader from 'virtual:icons/lucide/loader';

	function stringifyError(error: unknown): string {
		if (error instanceof Error) {
			let res = error.message;

			if (error.cause) {
				const sub = stringifyError(error.cause);
				res += sub ? ` (${sub})` : '';
			}

			return res;
		}

		return `${error}`;
	}

	export { failed, pending };
</script>

{#snippet failed(error: unknown, retry: () => void)}
	<div class="boundary failed">
		<button class="icon" onclick={retry}>
			<IconRefresh />
		</button>

		<p>{stringifyError(error)}</p>
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
