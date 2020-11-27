![Pipeline](https://github.com/Goldziher/rn-async-storage-cache-wrapper/workflows/CI/badge.svg?branch=master) [![codecov](https://codecov.io/gh/Goldziher/rn-async-storage-cache-wrapper/branch/master/graph/badge.svg?token=1L6MQ9Y6UG)](https://codecov.io/gh/Goldziher/rn-async-storage-cache-wrapper) [![Maintainability](https://api.codeclimate.com/v1/badges/8328d0b358088c24e231/maintainability)](https://codeclimate.com/github/Goldziher/r-cache/maintainability)

# RCache: Production Ready Async Cache

This package offers a sophisticated but simple to use async cache implementation built on-top of localForage.

It can be used in any browser based web-app as well as in React-Native applications.

It offers the following benefits:

-   browser and react-native support
-   first-class typescript support
-   extended and streamlined api
-   support of record expiration
-   support of cache versioning
-   distinct errors that can be tested with "instanceof"

## Installation

```bash
npm install r-cache
```

or

```bash
yarn add r-cache
```

### React and React-Native

The initial intention beyond creating this package was to create an async cache wrapper that can be used in both React and React-Native. To use this package in React-Native, you should first install [React Native Async Storage](https://github.com/react-native-async-storage/async-storage) by following the instructions of that package. You should than use this package normally - the installation of the required localForage driver will be done automatically.
