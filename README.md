# @medley/etag

[![npm Version](https://img.shields.io/npm/v/@medley/etag.svg)](https://www.npmjs.com/package/@medley/etag)
[![Build Status](https://travis-ci.org/medleyjs/etag.svg?branch=master)](https://travis-ci.org/medleyjs/etag)
[![Coverage Status](https://coveralls.io/repos/github/medleyjs/etag/badge.svg?branch=master)](https://coveralls.io/github/medleyjs/etag?branch=master)
[![dependencies Status](https://img.shields.io/david/medleyjs/etag.svg)](https://david-dm.org/medleyjs/etag)

[Medley](https://www.npmjs.com/package/@medley/medley) plugin for automatic ETag generation & conditional GET responses.

Generates an `ETag` header for `string` and `Buffer` response bodies and sends a `304 Not Modified` response if the ETag matches the incoming `If-None-Match` header.

## Installation

```sh
npm install @medley/etag
# or
yarn add @medley/etag
```

## Usage

```js
const medley = require('@medley/medley');
const app = medley();

app.register(require('@medley/etag'));

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(3000);
```
