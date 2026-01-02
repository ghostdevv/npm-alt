<script lang="ts">
	import IconLicense from 'virtual:icons/catppuccin/license';
	import IconJSON from 'virtual:icons/catppuccin/json';
	import IconHTTP from 'virtual:icons/catppuccin/http';
	import IconNPM from 'virtual:icons/catppuccin/npm';
	import IconGit from 'virtual:icons/catppuccin/git';
	import { listPackages } from './author.remote';
	import { Inspect } from 'svelte-inspect-value';
	import type { Component } from 'svelte';
	import Modal from '$lib/Modal.svelte';
	import { page } from '$app/state';

	let author = $derived(page.params.author);
	let packages = $derived(await listPackages(author!));
</script>

<section>
	<h1>{author}</h1>
	<p>Found a total of {packages.length} packages</p>
</section>

{#snippet tag(Icon: Component, label: string, colour?: string, title?: string)}
	<div class="tag" style:--colour={colour} {title}>
		<Icon />
		{label}
	</div>
{/snippet}

<section>
	<div class="packages">
		{#each packages as pkg}
			<details class="package" open>
				<summary>
					{pkg.name}<span class="version">@{pkg.version}</span>
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

					<Modal>
						{#snippet activator()}
							<button class="icon">
								<IconJSON />
							</button>
						{/snippet}

						{#snippet children()}
							<Inspect value={pkg} />
						{/snippet}
					</Modal>
				</div>
			</details>
		{/each}
	</div>
</section>

<style>
	.packages {
		display: flex;
		flex-flow: row wrap;
		gap: 8px;
	}

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
		}

		.version {
			color: var(--text-grey);
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
