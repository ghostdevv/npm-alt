import { resolve } from '$app/paths';
import { redirect } from '@sveltejs/kit';

export function load({ params }) {
	redirect(307, resolve('/(nav)/package/[...specifier]/overview', params));
}
