<script lang="ts">
	import IconX from 'virtual:icons/lucide/x';
	import { slide } from 'svelte/transition';
	import { PersistedState } from 'runed';
	import type { Snippet } from 'svelte';

	interface Props {
		id: string;
		children: Snippet;
		colour: string;
	}

	const { id, children, colour }: Props = $props();

	const ignored = new PersistedState<string[]>('ignored-notices', []);
</script>

{#if !ignored.current.includes(id)}
	<div class="notice" style:--colour={colour} out:slide>
		{@render children()}

		<button
			class="icon"
			title="Close and ignore notice"
			onclick={() => ignored.current.push(id)}
		>
			<IconX />
		</button>
	</div>
{/if}

<style>
	.notice {
		width: 100%;
		position: relative;

		padding-inline: 12px;
		padding-block: 8px;
		margin-block-end: 16px;

		border: 2px solid var(--colour);
		background-color: color(from var(--colour) srgb r g b / 0.2);
		border-radius: 12px;

		button {
			position: absolute;
			top: 8px;
			right: 8px;
			z-index: 20;
		}
	}
</style>
