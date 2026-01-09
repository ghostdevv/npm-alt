<script lang="ts">
	import IconFolderOpen from 'virtual:icons/catppuccin/folder-open';
	import { getPackageFiles, type FileNode } from './files.remote';
	import InspectModal from '$lib/components/InspectModal.svelte';
	import { highlight, sanitise } from '$lib/client/highlight';
	import IconFolder from 'virtual:icons/catppuccin/folder';
	import { format as formatBytes } from '@std/fmt/bytes';
	import { failed, pending } from '$lib/boundary.svelte';
	import IconText from 'virtual:icons/catppuccin/text';
	import IconJSON from 'virtual:icons/catppuccin/json';
	import Pending from '$lib/components/Pending.svelte';
	import { slide } from 'svelte/transition';
	import { cache } from '$lib/client/cache';
	import { beforeNavigate, goto } from '$app/navigation';
	import { Tree } from 'melt/builders';
	import { page } from '$app/state';

	const { data } = $props();

	const files = $derived(
		await getPackageFiles({
			name: data.pkg.name,
			version: data.pkg.version,
		}),
	);

	let file = $derived(page.url.searchParams.get('file') || undefined);

	const tree = new Tree({
		selected: () => file,
		items: () => files,
		onSelectedChange(selection) {
			if (!selection) return;
			const item = tree.getItem(selection);

			if (!item) {
				page.url.searchParams.delete('file');
				return;
			}

			if (!('children' in item) && file !== item.id) {
				page.url.searchParams.set('file', item.id);
				page.url.hash = '';
				goto(page.url);
				return;
			}
		},
	});

	function baseName(path: string) {
		return path.split('/').pop()!;
	}

	const renderAndFetchContent = cache({
		version: 2,
		async value(file: FileNode) {
			const url = `https://unpkg.com/${data.pkg.name}@${data.pkg.version}${file.id}`;
			const res = await fetch(url);
			const code = await res.text();

			if (file.size > 1_000_000) {
				return `<pre><code>${await sanitise(code)}</code></pre>`;
			}

			return await highlight(code, file.lang, true);
		},
	});

	function lineNumberClick(event: MouseEvent) {
		const target = (event.target as HTMLSpanElement | null)?.parentElement;

		if (!target || !target.dataset.line) {
			return;
		}

		event.preventDefault();

		const oldLine = page.url.hash.match(/^#(?<line>L\d+)/)?.groups?.line;
		const newLine = `L${Number.parseInt(target.dataset.line)}`;

		const hash =
			event.shiftKey && oldLine && oldLine !== newLine
				? `#${oldLine}-${newLine}`
				: `#${newLine}`;

		if (page.url.hash !== hash) {
			page.url.hash = hash;
			goto(page.url);
		}
	}

	function renderSelection(root: HTMLDivElement) {
		const m = page.url.hash.match(/^#L(\d+)(?:-L(\d+))?$/);

		for (const line of root.querySelectorAll('.line.selected')) {
			line.classList.remove('selected');
		}

		if (!m) return;

		const start = Number.parseInt(m[1]);
		const end = Number.parseInt(m[2] ?? m[1]);

		for (const line of root.querySelectorAll<HTMLSpanElement>('.line')) {
			const lineNum = Number.parseInt(line.dataset.line!);
			if (!isNaN(lineNum) && lineNum >= start && lineNum <= end) {
				line.classList.add('selected');
			}
		}
	}

	function handleLineNumbers(root: HTMLDivElement) {
		root.addEventListener('click', lineNumberClick);

		$effect(() => {
			renderSelection(root);
		});

		const observer = new MutationObserver(() => renderSelection(root));
		observer.observe(root, { childList: true, subtree: true });

		return () => {
			root.removeEventListener('click', lineNumberClick);
			observer.disconnect();
		};
	}
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
		{#if file}
			{@const item = tree.getItem(file)}

			{#if item && 'children' in item}
				<p class="default error">
					somehow you selected a directory, please select a file :p
				</p>
			{:else if item}
				<div class="code" {@attach handleLineNumbers}>
					<svelte:boundary {failed} {pending}>
						<Pending />

						{@html await renderAndFetchContent(
							`file:${data.pkg.name}-${data.pkg.version}-${item.id}`,
							item,
						)}
					</svelte:boundary>
				</div>
			{:else}
				<p class="default error">that file doesn't exist :((</p>
			{/if}
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

			.code {
				display: contents;

				> :global(pre) {
					margin: 0px;
					max-height: 100%;

					:global(.line) {
						&.selected {
							--colour: color(
								from var(--primary) srgb r g b / 0.2
							);

							background-color: var(--colour);

							/* https://www.youtube.com/watch?v=81pnuZFarRw */
							box-shadow: 0 0 0 100vmax
								var(--bg-color, var(--colour));
							clip-path: inset(0 -100vmax);
						}
					}

					:global(.line-number) {
						color: var(--text-grey);
						margin-right: 8px;
						padding: 0px;
					}
				}
			}

			&:has(.default) {
				display: grid;
				place-items: center;

				.default {
					color: var(--text-grey);

					&.error {
						color: var(--red);
					}
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
