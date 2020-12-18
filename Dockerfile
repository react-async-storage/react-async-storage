FROM node:15-alpine
RUN apk --no-cache add git

ARG RAS='react-async-storage'
ARG CRA='async-storage-tester'

RUN yarn create react-app ${CRA} --template typescript
RUN cd ${CRA} && \
	  yarn add @types/lodash.merge localforage

WORKDIR /${CRA}
RUN rm -f src/App.ts src/App.tsx
COPY import-test.tsx src/App.tsx
COPY index.d.ts node_modules/${RAS}/index.d.ts
COPY tsconfig.json node_modules/${RAS}/tsconfig.json
COPY rollup.config.js node_modules/${RAS}/rollup.config.js
COPY package.json node_modules/${RAS}/package.json
COPY .prettierrc node_modules/${RAS}/.prettierrc
COPY yarn.lock node_modules/${RAS}/yarn.lock
COPY src node_modules/${RAS}/src

WORKDIR /${CRA}/node_modules/${RAS}
RUN yarn --frozen-lockfile --ignore-scripts
RUN yarn build
RUN cd ../.. && yarn build
