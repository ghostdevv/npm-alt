<script lang="ts">
	import type { Component } from 'svelte';

	interface Props {
		colour: string;
		icon: Component;
		title: string;
		label: string;
		href?: string;
	}

	const { colour, title, label, icon: Icon, href }: Props = $props();
</script>

<svelte:element
	this={href ? 'a' : 'p'}
	class="tag"
	style:--colour={colour}
	{title}
	{href}
>
	<Icon />
	{label}
</svelte:element>

<style>
	.tag {
		display: flex;
		align-items: center;
		gap: 4px;

		width: fit-content;
		padding-inline: 6px;
		padding-block: 4px;
		margin: 0px;

		border-radius: 6px;
		background-color: color(from var(--colour) srgb r g b / 0.2);
		color: var(--text);
	}
</style>
