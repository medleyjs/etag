'use strict';

const assert = require('assert').strict;
const etag = require('../etag.js');
const fs = require('fs');
const medley = require('@medley/medley');
const selfRequest = require('@medley/self-request');

function makeApp() {
  return medley().register(selfRequest).register(etag);
}

describe('etag', () => {

  it('skips non-200 responses', async () => {
    const app = makeApp();

    app.get('/', (req, res) => {
      res.status(204).send();
    });

    let res = await app.request('/');
    assert.strictEqual(res.statusCode, 204);
    assert.strictEqual(res.headers.etag, undefined);

    res = await app.request('/not-found');
    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.headers.etag, undefined);
  });

  it('skips "Cache-Control: no-cache" requests', async () => {
    const app = makeApp();

    app.get('/', (req, res) => {
      res.send('Hello World');
    });

    const res = await app.request('/', {
      headers: {
        'cache-control': 'no-cache',
      },
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body, 'Hello World');
    assert.strictEqual(res.headers.etag, undefined);
  });

  it('does not generate an ETag for non-string/buffer bodies', async () => {
    const app = makeApp();

    app.get('/', (req, res) => {
      res.send(fs.createReadStream(__filename));
    });

    const res = await app.request('/');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.headers.etag, undefined);
  });

  it('generates an ETag for strings', async () => {
    const app = makeApp();

    app.get('/', (req, res) => {
      res.send('Hello World');
    });

    const res = await app.request('/');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body, 'Hello World');
    assert.strictEqual(res.headers.etag, '"b-Ck1VqNd45QIvq3AZd8XYQLvEhtA"');
  });

  it('generates an ETag for buffers', async () => {
    const app = makeApp();

    app.get('/', (req, res) => {
      res.send(Buffer.from('Hello World'));
    });

    const res = await app.request('/');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body, 'Hello World');
    assert.strictEqual(res.headers.etag, '"b-Ck1VqNd45QIvq3AZd8XYQLvEhtA"');
  });

  it('does not generate a new ETag if one was already set', async () => {
    const app = makeApp();

    app.get('/', (req, res) => {
      res.headers.etag = '"custom-etag"';
      res.send('Hello World');
    });

    const res = await app.request('/');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body, 'Hello World');
    assert.strictEqual(res.headers.etag, '"custom-etag"');
  });

  it('sends a 304 Not Modified response for conditional requests that match the ETag', async () => {
    const app = makeApp();

    app.get('/', (req, res) => {
      res.send('Hello World');
    });

    const res = await app.request('/', {
      headers: {
        'if-none-match': '"b-Ck1VqNd45QIvq3AZd8XYQLvEhtA"',
      },
    });
    assert.strictEqual(res.statusCode, 304);
    assert.strictEqual(res.body, '');
    assert.strictEqual(res.headers.etag, '"b-Ck1VqNd45QIvq3AZd8XYQLvEhtA"');
  });

  it('sends a 304 Not Modified response for conditional requests that match a pre-set ETag', async () => {
    const app = makeApp();

    app.get('/', (req, res) => {
      res.headers.etag = '"custom-etag"';
      res.send('Hello World');
    });

    const res = await app.request('/', {
      headers: {
        'if-none-match': '"custom-etag"',
      },
    });
    assert.strictEqual(res.statusCode, 304);
    assert.strictEqual(res.body, '');
    assert.strictEqual(res.headers.etag, '"custom-etag"');
  });

  it('sends the response as normal for conditional requests that do not match the ETag', async () => {
    const app = makeApp();

    app.get('/', (req, res) => {
      res.send('Hello World');
    });

    const res = await app.request('/', {
      headers: {
        'if-none-match': '"not-a-match"',
      },
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body, 'Hello World');
    assert.strictEqual(res.headers.etag, '"b-Ck1VqNd45QIvq3AZd8XYQLvEhtA"');
  });

});
