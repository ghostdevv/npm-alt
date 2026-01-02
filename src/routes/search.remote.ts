import { redirect } from '@sveltejs/kit';
import { username } from '$lib/valibot';
import { form } from '$app/server';
import * as v from 'valibot';

export const search = form(v.object({ query: username }), async ({ query }) => {
	redirect(301, `/~${query}`);
});
