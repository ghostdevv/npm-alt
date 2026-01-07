<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open?: boolean;
		onOpen?: (event: CustomEvent<{ dialog: HTMLDialogElement }>) => void;
		onClose?: (event: CustomEvent<{ dialog: HTMLDialogElement }>) => void;

		activator: Snippet;
		children: Snippet<[open: () => void, close: () => void]>;
	}

	let {
		open = $bindable(false),
		onOpen,
		onClose,
		activator,
		children,
	}: Props = $props();

	let dialog = $state<HTMLDialogElement | null>(null);

	$effect(() => {
		if (dialog) {
			open ? openModal() : closeModal();
		}
	});

	// Based on code from https://stackoverflow.com/a/57463812
	function click(event: MouseEvent) {
		if (!dialog || event.target != dialog) return;

		const rect = dialog.getBoundingClientRect();

		const clickedInDialog =
			rect.top <= event.clientY &&
			event.clientY <= rect.top + rect.height &&
			rect.left <= event.clientX &&
			event.clientX <= rect.left + rect.width;

		if (clickedInDialog === false) {
			closeModal();
		}
	}

	function openModal() {
		if (!dialog) return;
		dialog.showModal();
		open = true;
		onOpen?.(new CustomEvent('open', { detail: { dialog } }));
	}

	function closeModal() {
		if (!dialog) return;
		dialog.close();
		open = false;
		onClose?.(new CustomEvent('close', { detail: { dialog } }));
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="activator" onclick={openModal}>
	{@render activator()}
</div>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<dialog onclick={click} onclose={closeModal} bind:this={dialog}>
	{#if open}
		{@render children(openModal, closeModal)}
	{/if}
</dialog>

<style>
	.activator {
		display: contents;
	}

	dialog {
		padding: 12px;
		background-color: var(--background-primary);
		border: 2px solid var(--background-secondary);
		width: min(80%, 1200px);
	}
</style>
