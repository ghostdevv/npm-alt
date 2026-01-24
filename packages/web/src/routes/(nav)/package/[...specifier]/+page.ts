import { redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';

export function load({ params }) {
	redirect(307, resolve(`/(nav)/package/[...specifier]/overview`, params));
}
