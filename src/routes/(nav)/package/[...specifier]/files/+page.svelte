<script lang="ts">
	import { getPackageFiles, type FileNode } from '$lib/data/package.remote';
	import IconFolderOpen from 'virtual:icons/catppuccin/folder-open';
	import InspectModal from '$lib/components/InspectModal.svelte';
	import IconFolder from 'virtual:icons/catppuccin/folder';
	import { format as formatBytes } from '@std/fmt/bytes';
	import { failed, pending } from '$lib/boundary.svelte';
	import IconText from 'virtual:icons/catppuccin/text';
	import IconJSON from 'virtual:icons/catppuccin/json';
	import Pending from '$lib/components/Pending.svelte';
	import { highlight } from '$lib/client/highlight';
	import { slide } from 'svelte/transition';
	import { cache } from '$lib/client/cache';
	import { Tree } from 'melt/builders';

	const { params, data } = $props();
	const files = $derived(await getPackageFiles(params.specifier));

	let selected = $state<FileNode | null>(null);

	const tree = $derived(
		new Tree({
			items: files,
			expanded: [],
			onSelectedChange(selection) {
				const item = selection ? tree.getItem(selection) : null;

				if (!item) {
					selected = null;
					return;
				}

				if (!('children' in item)) {
					selected = item;
					return;
				}
			},
		}),
	);

	function baseName(path: string) {
		return path.split('/').pop()!;
	}

	const renderAndFetchContent = cache(null, async (file: FileNode) => {
		const url = `https://unpkg.com/${data.pkg.name}@${data.pkg.version}${file.id}`;
		const res = await fetch(url);
		const code = await res.text();
		return await highlight(code, file.lang);
	});
</script>

{#snippet treeItems(items: (typeof tree)['children'], depth: number = 0)}
	{#each items as item (item.id)}
		<li {...item.attrs} style:--depth={depth}>
			<p class="item row" class:selected={item.selected}>
				{#if item.children && item.expanded}
					<IconFolderOpen />
				{:else if item.children}
					<IconFolder />
				{:else}
					<IconText />
				{/if}

				{baseName(item.id)}
				<span class="size">{formatBytes(item.item.size)}</span>
			</p>

			{#if item.children?.length && item.expanded}
				<div class="children" transition:slide={{ axis: 'y' }}>
					{@render treeItems(item.children, depth + 1)}
				</div>
			{/if}
		</li>
	{/each}
{/snippet}

<div class="explorer">
	<ul {...tree.root}>
		{@render treeItems(tree.children, 0)}

		<li>
			<InspectModal value={files}>
				<button class="icon" title="View raw file data">
					<IconJSON />
				</button>
			</InspectModal>
		</li>
	</ul>

	<div class="spacer"></div>

	<div class="content">
		{#if selected}
			<svelte:boundary {failed} {pending}>
				<Pending />
				{@html await renderAndFetchContent(
					`file:${data.pkg.name}-${data.pkg.version}-${selected.id}`,
					selected,
				)}
			</svelte:boundary>
		{:else}
			<p class="default">select something :D</p>
		{/if}
	</div>
</div>

<style>
	.explorer {
		display: grid;
		grid-template-columns: 250px max-content 1fr;
		gap: 2px;
		height: 100%;
		max-height: 100%;

		.spacer {
			height: 100%;
			width: 2px;
			background-color: var(--background-tertiary);
		}

		.content {
			padding-inline: 4px;
			overflow: auto;
			position: relative;

			> :global(pre) {
				margin: 0px;
				max-height: 100%;

				/* thanks alexpeattie */
				/* https://github.com/shikijs/shiki/issues/3#issuecomment-830564854 */
				> :global(code) {
					counter-reset: step;
					counter-increment: step 0;

					:global(.line::before) {
						content: counter(step);
						counter-increment: step;
						width: 1rem;
						margin-right: 1.5rem;
						display: inline-block;
						text-align: right;
						color: var(--text-grey);
					}
				}
			}

			&:has(.default) {
				display: grid;
				place-items: center;

				.default {
					color: var(--text-grey);
				}
			}
		}

		[data-melt-tree-root] {
			list-style: none;
			overflow: auto;
			margin: 0px;
			padding-inline: 4px;

			[data-melt-tree-item] {
				.item {
					padding-block: 6px;
					padding-inline: 8px;
					margin: 0px;
					margin-left: calc(var(--depth) * 10px);

					border-radius: 8px;

					.size {
						margin-left: auto;
						font-size: 0.85em;
						color: var(--text-grey);
						text-align: right;
					}

					&:hover,
					&.selected {
						background-color: color(
							from var(--primary) srgb r g b / 0.4
						);
					}
				}

				&:focus-visible {
					outline: none;

					.item {
						outline: 2px solid var(--primary);
						outline-offset: 2px;
					}
				}

				.children {
					position: relative;

					&:before {
						content: '';
						position: absolute;
						top: 0;
						left: calc((var(--depth) * 10px));
						width: 1px;
						height: 100%;
						background-color: var(--background-tertiary);
					}
				}
			}
		}
	}
</style>
