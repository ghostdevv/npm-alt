import * as v from 'valibot';

// todo validate username chars
export const username = v.pipe(v.string(), v.minLength(1));

// todo validate package name
export const packageName = v.pipe(v.string(), v.minLength(1));

// todo validate semver
export const semver = v.pipe(v.string(), v.minLength(1));
