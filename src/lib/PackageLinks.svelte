<script lang="ts">
	import IconJSON from 'virtual:icons/catppuccin/json';
	import IconHTTP from 'virtual:icons/catppuccin/http';
	import IconNPM from 'virtual:icons/catppuccin/npm';
	import IconGit from 'virtual:icons/catppuccin/git';
	import InspectModal from './InspectModal.svelte';
	import type { Package } from './types/search';
	import type { Packument } from '@npm/types';

	interface Props {
		pkg: Package | Packument;
	}

	const { pkg }: Props = $props();

	const links = $derived.by(() => {
		if ('links' in pkg) {
			return pkg.links;
		}

		return {
			npm: `https://www.npmjs.com/package/${pkg.name}`,
			repository: pkg.repository?.url,
			homepage: pkg.homepage,
		};
	});
</script>

<a
	href={links.npm}
	rel="noreferrer noopener"
	title="Open on NPM"
	class="button icon"
>
	<IconNPM />
</a>

{#if links.repository}
	<a
		href={links.repository}
		rel="noreferrer noopener"
		title="Open Git Repository"
		class="button icon"
	>
		<IconGit />
	</a>
{/if}

{#if links.homepage}
	<a
		href={links.homepage}
		rel="noreferrer noopener"
		title="Open Homepage"
		class="button icon"
	>
		<IconHTTP />
	</a>
{/if}

<InspectModal value={pkg}>
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
