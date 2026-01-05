<script lang="ts">
	import type { Snippet } from 'svelte';
	import Modal from './Modal.svelte';
	import Inspect from 'svelte-inspect-value';

	interface Props {
		value: unknown;
		children: Snippet;
	}

	const { value, children: activator }: Props = $props();
</script>

<Modal {activator}>
	{#snippet children()}
		<Inspect {value} />
	{/snippet}
</Modal>
