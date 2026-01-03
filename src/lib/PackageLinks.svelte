<script lang="ts">
	import IconJSON from 'virtual:icons/catppuccin/json';
	import type { Package } from './data/package.remote';
	import IconHTTP from 'virtual:icons/catppuccin/http';
	import type { SearchPackage } from './types/search';
	import IconNPM from 'virtual:icons/catppuccin/npm';
	import IconGit from 'virtual:icons/catppuccin/git';
	import InspectModal from './InspectModal.svelte';

	interface Props {
		pkg: SearchPackage | Package;
		inspectValue: unknown;
	}

	const { pkg, inspectValue }: Props = $props();
</script>

<a
	href={pkg.links.npm}
	rel="noreferrer noopener"
	title="Open on NPM"
	class="button icon"
>
	<IconNPM />
</a>

{#if pkg.links.repository}
	<a
		href={pkg.links.repository}
		rel="noreferrer noopener"
		title="Open Git Repository"
		class="button icon"
	>
		<IconGit />
	</a>
{/if}

{#if pkg.links.homepage}
	<a
		href={pkg.links.homepage}
		rel="noreferrer noopener"
		title="Open Homepage"
		class="button icon"
	>
		<IconHTTP />
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
