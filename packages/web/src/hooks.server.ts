import * as ve from '$lib/server/valibot';
import { error } from '@sveltejs/kit';
import * as v from 'valibot';

export async function handle({ event, resolve }) {
	if (event.route.id?.includes('[...specifier]')) {
		const results = v.safeParse(ve.specifier, event.params.specifier);

		if (!results.success) {
			error(
				404,
				event.route.id === '/[...specifier]'
					? 'Not found'
					: `Invalid specifier: ${results.issues[0].message}`,
			);
		}
	}

	return await resolve(event);
}
