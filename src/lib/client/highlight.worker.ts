import { createOnigurumaEngine } from 'shiki/engine/oniguruma';
import { bundledLanguages } from 'shiki/bundle/web';
import { serendipity } from './serendipity-shiki';
import markedShiki from 'marked-shiki';
import markedAlert from 'marked-alert';
import { expose } from 'comlink';
import { marked } from 'marked';
import {
	type HighlighterCore,
	type ShikiTransformer,
	createHighlighterCore,
} from 'shiki/core';

let highlighter: HighlighterCore | null = null;

async function init() {
	marked.use(
		markedShiki({
			async highlight(code, lang) {
				return await highlight(code, lang);
			},
		}),
	);

	marked.use(markedAlert());

	return await createHighlighterCore({
		engine: createOnigurumaEngine(import('shiki/wasm')),
		themes: [serendipity],
		langs: [
			...Object.values(bundledLanguages),
			() => import('@shikijs/langs/toml'),
		],
	});
}

function lineNumbersTransformer(code: string): ShikiTransformer {
	const width = (Math.floor(Math.log10(code.split('\n').length)) + 1) * 10;

	return {
		line(node, line) {
			node.properties.dataLine = `${line}`;
			node.children.unshift({
				type: 'element',
				tagName: 'button',
				properties: {
					className: ['icon', 'line-number'],
					style: `width: ${width}px;`,
					title: 'Select line',
				},
				children: [{ type: 'text', value: `${line}` }],
			});
		},
	};
}

async function highlight(code: string, lang: string, lineNumbers?: boolean) {
	highlighter ??= await init();

	try {
		highlighter.getLanguage(lang);
	} catch (error) {
		lang = 'text';
	}

	return highlighter.codeToHtml(code, {
		theme: 'serendipity-sunset-v1',
		lang,
		transformers: lineNumbers ? [lineNumbersTransformer(code)] : undefined,
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
