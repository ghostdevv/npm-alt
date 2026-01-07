<script lang="ts">
	import IconJSON from 'virtual:icons/catppuccin/json';
	import IconHTTP from 'virtual:icons/catppuccin/http';
	import IconNPM from 'virtual:icons/catppuccin/npm';
	import IconGit from 'virtual:icons/catppuccin/git';
	import InspectModal from './InspectModal.svelte';

	interface Props {
		name: string;
		version: string;
		repo?: string;
		homepage?: string;
		inspectValue: unknown;
	}

	const { name, version, repo, homepage, inspectValue }: Props = $props();
</script>

<a
	href="https://www.npmjs.com/package/{name}/v/{version}"
	rel="noreferrer noopener"
	title="Open on NPM"
	class="button icon"
>
	<IconNPM />
</a>

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
