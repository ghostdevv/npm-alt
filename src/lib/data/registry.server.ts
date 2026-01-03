import { version } from '../../../package.json' with { type: 'json' };
import { ofetch } from 'ofetch';

export const USER_AGENT = `npm-alt/${version}`;

export const registry = ofetch.create({
	baseURL: 'https://registry.npmjs.org',
	headers: {
		'User-Agent': USER_AGENT,
	},
	retry: 3,
	retryDelay: 500,
});
