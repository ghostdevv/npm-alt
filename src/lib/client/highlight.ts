import type { HighlightWorker } from './highlight.worker';
import type { DOMPurify } from 'dompurify';
import { wrap } from 'comlink';

let worker: HighlightWorker | null = null;

async function init() {
	const { default: Worker } = await import('./highlight.worker?worker');
	return wrap<HighlightWorker>(new Worker());
}

export async function highlight(code: string, ext: string) {
	worker ??= await init();
	return await worker.highlight(code, ext);
}

let domPurify: DOMPurify | null = null;

export async function renderMarkdown(markdown: string) {
	worker ??= await init();
	domPurify ??= (await import('dompurify')).default;
	const html = await worker.renderMarkdown(markdown);
	return domPurify.sanitize(html);
}
