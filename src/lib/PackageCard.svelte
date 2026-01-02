<script lang="ts">
	import IconLicense from 'virtual:icons/catppuccin/license';
	import IconJSON from 'virtual:icons/catppuccin/json';
	import IconHTTP from 'virtual:icons/catppuccin/http';
	import IconNPM from 'virtual:icons/catppuccin/npm';
	import IconGit from 'virtual:icons/catppuccin/git';
	import InspectModal from './InspectModal.svelte';
	import type { Package } from './types/search';
	import type { Component } from 'svelte';

	interface Props {
		pkg: Package;
	}

	const { pkg }: Props = $props();
</script>

{#snippet tag(Icon: Component, label: string, colour?: string, title?: string)}
	<div class="tag" style:--colour={colour} {title}>
		<Icon />
		{label}
	</div>
{/snippet}

<details class="package" open>
	<summary>
		<a href="/package/{pkg.name}">
			{pkg.name}<span class="version">@{pkg.version}</span>
		</a>
	</summary>

	<p class="description">
		{#if pkg.description}
			{pkg.description}
		{:else}
			<span style="color: var(--text-grey)">
				No description provided.
			</span>
		{/if}
	</p>

	<div class="tags">
		{@render tag(
			IconLicense,
			pkg.license || 'None provided',
			`var(--${pkg.license ? 'green' : 'red'})`,
			'Package License',
		)}

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

		<InspectModal value={pkg}>
			<button class="icon">
				<IconJSON />
			</button>
		</InspectModal>
	</div>
</details>

<style>
	.package {
		width: auto;
		flex-grow: 1;
		flex-shrink: 1;
		padding-inline: 8px;
		padding-block: 8px;
		margin: 0px;

		border: 2px solid var(--background-secondary);
		border-radius: 12px;

		summary {
			margin: 0px;
			font-family: monospace;

			a {
				color: var(--text);
			}

			.version {
				color: var(--text-grey);
			}
		}

		.description {
			margin-top: 0px;
		}

		.tags {
			display: flex;
			flex-flow: row wrap;
			align-items: center;
			gap: 8px;

			a {
				display: grid;
				place-items: center;
			}

			button,
			.button {
				padding: 0px;
			}
		}
	}

	.tag {
		display: flex;
		align-items: center;
		gap: 4px;

		width: fit-content;
		padding-inline: 6px;
		padding-block: 4px;

		border-radius: 6px;
		background-color: color(from var(--colour) srgb r g b / 0.2);
	}
</style>
