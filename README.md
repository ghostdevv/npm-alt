# npm-alt

> [!NOTE]
> Go checkout [npmx.dev](https://npmx.dev) for the spiritual successor to npm-alt, with tons more features and a vibrant community.
>
> If you're interested in the data aspect, you can also join the #data channel on the [e18e discord](https://chat.e18e.dev) where some of us are working on npm.rest, which includes a lot of the data work from here.

An alternative frontend for npm that aims to provide a better experience, with more useful supplemental information.

## Extra Features

### npm acronyms

The most important feature, the old npm acronyms.

![](./.github/images/npm-acronyms.png)

### e18e suggestions

Shows e18e suggestions on packages.

![](./.github/images/e18e.png)

### install options

- Selectable package manager install options
- Adds the @types package if required
- Shows browser import for script[type=module]

![](./.github/images/install-options.png)

### changelog viewer

Tries to fetch the changelog from the npm package files, the repo, or GitHub releases.

![](./.github/images/changelog.png)

### better version viewer

Inspired by jsr/crates.io

![](./.github/images/versions.png)

### package score

Inspired by jsr, very much a work in progress

![](./.github/images/package-score.png)

### non-beta file viewer

:p

![](./.github/images/file-viewer.png)

### better dependency list

accounts for regular/production, optional, peer, and dev dependencies.

![](./.github/images/dependencies.png)

also with built-in production dependency graph

![](./.github/images/dependency-graph.png)
