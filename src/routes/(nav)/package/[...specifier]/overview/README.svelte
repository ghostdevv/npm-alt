<script lang="ts">
	import { failed, pending } from '$lib/boundary.svelte';
	import { renderMarkdown } from '$lib/client/highlight';
	import type { Package } from '$lib/data/types';
	import { join as joinPaths } from '@std/path';
	import { cache } from '$lib/client/cache';

	interface Props {
		pkg: Package;
	}

	const { pkg }: Props = $props();

	const renderREADME = cache({
		version: 1,
		async value(pkg: Package): Promise<string> {
			const res = await fetch(
				`https://unpkg.com/${pkg.name}@${pkg.version}/README.md`,
			);

			const md = await res.text();
			const html = await renderMarkdown(md);

			return fixRelativeLinks(html, pkg.repo);
		},
	});

	// send help
	function fixRelativeLinks(html: string, repo: Package['repo']): string {
		if (!repo) return html;

		const parser = new DOMParser();
		const doc: Document = parser.parseFromString(html, 'text/html');
		const base = new URL(repo.assets);

		function applyPath(url: string) {
			if (URL.canParse(url)) return url;

			const newURL = URL.parse(
				joinPaths(base.pathname, repo?.dir || '', url),
				base,
			);

			return newURL ? newURL.toString() : url;
		}

		function fixSrcset(srcset: string): string {
			return srcset
				.split(',')
				.map((part: string) => {
					const [url, descriptor] = part.trim().split(/\s+/);
					const fixedUrl = applyPath(url);
					return fixedUrl + (descriptor ? ' ' + descriptor : '');
				})
				.join(', ');
		}

		for (const a of doc.querySelectorAll<HTMLAnchorElement>('a[href]')) {
			const href = a.getAttribute('href');
			if (href) a.href = applyPath(href);
		}

		for (const img of doc.querySelectorAll<HTMLImageElement>('img[src]')) {
			const src = img.getAttribute('src');
			if (src) img.src = applyPath(src);

			if (img.hasAttribute('srcset')) {
				img.srcset = fixSrcset(img.getAttribute('srcset')!);
			}
		}

		for (const source of doc.querySelectorAll<HTMLSourceElement>(
			'picture source[srcset]',
		)) {
			source.srcset = fixSrcset(source.getAttribute('srcset')!);
		}

		return doc.documentElement.outerHTML;
	}
</script>

<svelte:boundary {failed} {pending}>
	{@const readme = await renderREADME(
		`readme:${pkg.name}-${pkg.version}`,
		pkg,
	)}

	{#if $effect.pending()}
		{@render pending()}
	{/if}

	{#if readme}
		<div class="markdown">
			{@html readme}
		</div>
	{:else}
		<p style="color: var(--text-grey);">No README found</p>
	{/if}
</svelte:boundary>
