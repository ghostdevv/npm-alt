import { type HighlighterCore, createHighlighterCore } from 'shiki/core';
import { createOnigurumaEngine } from 'shiki/engine/oniguruma';
import { bundledLanguages } from 'shiki/bundle/web';
import { serendipity } from './serendipity-shiki';
import markedShiki from 'marked-shiki';
import { expose } from 'comlink';
import { marked } from 'marked';

let highlighter: HighlighterCore | null = null;

async function init() {
	marked.use(markedShiki({ highlight }));
	return await createHighlighterCore({
		engine: createOnigurumaEngine(import('shiki/wasm')),
		themes: [serendipity],
		langs: Object.values(bundledLanguages),
	});
}

async function highlight(code: string, lang: string) {
	highlighter ??= await init();

	try {
		highlighter.getLanguage(lang);
	} catch (error) {
		lang = 'text';
	}

	return highlighter.codeToHtml(code, {
		theme: 'serendipity-sunset-v1',
		lang,
	});
}

async function renderMarkdown(markdown: string) {
	highlighter ??= await init();
	return await marked.parse(markdown, { gfm: true });
}

expose({ highlight, renderMarkdown });

export type HighlightWorker = {
	highlight: typeof highlight;
	renderMarkdown: typeof renderMarkdown;
};
