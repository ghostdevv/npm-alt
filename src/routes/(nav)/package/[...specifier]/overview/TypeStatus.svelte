<script lang="ts">
	import IconQuestion from 'virtual:icons/lucide/circle-question-mark';
	import type { PackageTypeStatus } from '$lib/data/types';
	import IconCheck from 'virtual:icons/lucide/check';
	import IconMinus from 'virtual:icons/lucide/minus';

	interface Props {
		types: PackageTypeStatus;
	}

	const { types }: Props = $props();
</script>

{#if types.status === 'built-in'}
	<span title="Types Built In" style="color: var(--green);">
		<IconCheck />
	</span>
{:else if types.status === 'definitely-typed'}
	<span title="Only DefinitelyTyped" style="color: var(--orange);">
		<IconMinus />
	</span>
{:else}
	<span
		title="No Types Found, but the logic isn't perfect yet. Check NPM to be sure."
		style="color: var(--red);"
	>
		<IconQuestion />
	</span>
{/if}
