<script lang="ts">
	import IconChevronDown from 'virtual:icons/lucide/chevron-down';
	import type { Component } from 'svelte';
	import { Select } from 'melt/builders';

	interface Option {
		icon: Component;
		title: string;
		content: string;
	}

	interface Props {
		title: string;
		options: Option[];
	}

	const { title, options }: Props = $props();
	// svelte-ignore state_referenced_locally
	const select = new Select<Option>({ value: options[0], sameWidth: false });
	const Icon = $derived(select.value?.icon);
</script>

<div class="wrapper">
	<label {...select.label} class="sr-only">{title}</label>
	<button {...select.trigger} class="icon" {title}>
		{#if Icon}
			<Icon />
		{:else}
			<IconChevronDown />
		{/if}
	</button>

	<div {...select.content}>
		{#each options as option}
			{@const Icon = option.icon}
			<div {...select.getOption(option, option.title)}>
				<button class="icon">
					<Icon />
				</button>
			</div>
		{/each}
	</div>

	<pre><code>{select.value?.content}</code></pre>
</div>

<style>
	.wrapper {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	[data-melt-select-trigger] {
		border: 2px solid var(--background-tertiary);
		transition: border 0.2s ease-in-out;
		gap: 2px;

		padding-inline: 4px;
		padding-block: 4px;

		&:hover,
		&:focus-visible {
			border-color: var(--primary);
		}
	}

	[data-melt-select-content] {
		padding-inline: 4px;
		padding-block: 4px;

		background-color: var(--background-primary);
		border: 2px solid var(--background-tertiary);
		border-radius: 8px;
	}
</style>
