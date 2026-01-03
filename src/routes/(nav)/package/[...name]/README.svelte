<script lang="ts">
	import { markedHighlight } from 'marked-highlight';
	import { failed } from '$lib/failed.svelte';
	import { browser } from '$app/environment';
	import { Marked } from 'marked';
	import Prism from 'prismjs';
	import 'prism-svelte';
	import 'prismjs/components/prism-typescript';
	import 'prismjs/components/prism-javascript';
	import 'prismjs/components/prism-bash';
	import 'prismjs/themes/prism-dark.css';

	interface Props {
		readme: string | undefined;
	}

	const { readme }: Props = $props();

	async function renderREADME(readme: string | undefined) {
		if (!browser || !readme) return null;

		const DOMPurify = await import('dompurify');

		const marked = new Marked(
			markedHighlight({
				async: false,
				highlight(code: string, lang: string) {
					try {
						if (Prism.languages[lang]) {
							return Prism.highlight(
								code,
								Prism.languages[lang],
								lang,
							);
						}

						return code;
					} catch (error) {
						console.error('Failed to highlight code:', error);
					}

					return code;
				},
			}),
		);

		const html = marked.parse(readme, { gfm: true });
		return DOMPurify.default.sanitize(await html);
	}
</script>

<svelte:boundary {failed}>
	{#if browser}
		{@html await renderREADME(readme)}
	{/if}

	{#if $effect.pending()}
		<div class="loading">Loading...</div>
	{/if}
</svelte:boundary>
