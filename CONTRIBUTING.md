# Contributing

Thank you for wanting to contribute to this library.

## Project setup

1.  Fork and clone the repo.
2.  Run `yarn install` to install dependencies.

## Adding yourself as a contributor

This project follows the [all contributors](https://github.com/kentcdodds/all-contributors)
specification. To add yourself as a contibutor use the all-contributors cli, which is aliased as a package.json script:

```bash
yarn contributors:add <github username> <contribution>
```

So for example, if you added code and updated the docs you will do:

```bash
yarn contributors:add <your username> code,doc
```

For further options see the [all-contributors cli docs](https://allcontributors.org/docs/en/cli/usage).

## Code Testing

Please make sure to add tests whenever adding new code. Only PRs that have 100% code coverage will be merged.

To execute the test suite simply run:

```bash
yarn test
```

-   be aware that yarn test is running jest with --silent, so if you need to console log from the tests you should run `yarn jest`instead.

## Submit a PR

When you are ready and have finished your modifications submit a PR. Make sure to link to any relevant issue by using the issue number in the description (e.g. #1).
