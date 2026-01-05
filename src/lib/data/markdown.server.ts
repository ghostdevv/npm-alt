import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { serendipity } from '$lib/assets/serendipity-shiki';
import { bundledLanguages } from 'shiki/bundle/web';
import { createHighlighterCore } from 'shiki/core';
import { join as joinPaths } from '@std/path';
import markedShiki from 'marked-shiki';
import { Marked } from 'marked';

const highlighter = await createHighlighterCore({
	// todo get oniguruma engine working
	engine: createJavaScriptRegexEngine({ forgiving: true }),
	themes: [serendipity],
	langs: Object.values(bundledLanguages),
});

export async function renderMarkdown(markdown: string, linkBase?: string) {
	const marked = new Marked(
		markedShiki({
			async highlight(code, lang) {
				try {
					return highlighter.codeToHtml(code, {
						theme: 'serendipity-sunset-v1',
						lang,
					});
				} catch (error) {
					console.error('failed to highlight code', error);
					// todo properly
					return `<pre><code>${code}</code></pre>`;
				}
			},
		}),
	);

	// todo rewrite to use lol-html
	if (linkBase) {
		marked.use({
			walkTokens(token) {
				if (token.type === 'link' || token.type === 'image') {
					if (!URL.canParse(token.href)) {
						token.href = joinPaths(linkBase, token.href);
					}
				}
			},
		});
	}

	const html = await marked.parse(markdown, { gfm: true });
	return { unsafeHTML: html };
}
