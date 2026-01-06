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

export async function sanitise(html: string) {
	domPurify ??= (await import('dompurify')).default;
	return domPurify.sanitize(html);
}

export async function renderMarkdown(markdown: string) {
	worker ??= await init();
	const html = await worker.renderMarkdown(markdown);
	return await sanitise(html);
}
