import * as v from 'valibot';

// todo validate username chars
export const username = v.pipe(v.string(), v.minLength(1));
