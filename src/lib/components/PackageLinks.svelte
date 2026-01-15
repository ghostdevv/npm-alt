<script lang="ts">
	import IconJSON from 'virtual:icons/catppuccin/json';
	import IconHTTP from 'virtual:icons/catppuccin/http';
	import IconNPM from 'virtual:icons/catppuccin/npm';
	import IconGit from 'virtual:icons/catppuccin/git';
	import IconHeart from 'virtual:icons/lucide/heart';
	import InspectModal from './InspectModal.svelte';
	import type { Funding } from '$lib/data/types';
	import IconNMD from 'virtual:icons/custom/nmd';

	interface Props {
		name: string;
		version?: string;
		repo?: string;
		homepage?: string;
		funding?: Funding[];
		registry?: boolean;
		inspectValue: unknown;
	}

	const {
		name,
		version,
		repo,
		homepage,
		funding,
		registry = true,
		inspectValue,
	}: Props = $props();
</script>

{#if registry && version}
	<a
		href="https://www.npmjs.com/package/{name}/v/{version}"
		rel="noreferrer noopener"
		title="Open on NPM"
		class="button icon"
	>
		<IconNPM />
	</a>
{/if}

{#if funding?.length}
	{#each funding as { url }}
		<a
			href={url}
			rel="noreferrer noopener"
			target="_blank"
			title="Open Funding"
			class="button icon"
		>
			<IconHeart color="#D8369F" />
		</a>
	{/each}
{/if}

{#if repo}
	<a
		href={repo}
		rel="noreferrer noopener"
		title="Open Git Repository"
		class="button icon"
	>
		<IconGit />
	</a>
{/if}

{#if homepage}
	<a
		href={homepage}
		rel="noreferrer noopener"
		title="Open Homepage"
		class="button icon"
	>
		<IconHTTP />
	</a>
{/if}

{#if registry && version}
	<a
		href="https://node-modules.dev/#install={name}"
		target="_blank"
		title="Open node-modules.dev"
		class="button icon"
	>
		<IconNMD />
	</a>
{/if}

<InspectModal value={inspectValue}>
	<button class="icon">
		<IconJSON />
	</button>
</InspectModal>

<style>
	a {
		display: grid;
		place-items: center;
	}

	button,
	.button {
		padding: 0px;
	}
</style>
