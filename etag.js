'use strict';

const {createHash} = require('crypto');

const rgxNoCache = /(?:^|,)\s*?no-cache\s*?(?:,|$)/;

function onSend(req, res, body, next) {
  if (
    res.statusCode !== 200 ||
    req.headers['cache-control'] !== undefined && rgxNoCache.test(req.headers['cache-control'])
  ) {
    next();
    return;
  }

  let {etag} = res.headers;

  if (etag === undefined) {
    if (typeof body !== 'string' && body instanceof Buffer === false) {
      next();
      return;
    }

    const hash = createHash('sha1')
      .update(body, 'utf8')
      .digest('base64')
      .slice(0, 27);

    etag = '"' + body.length.toString(36) + '-' + hash + '"';
    res.headers.etag = etag;
  }

  if (req.headers['if-none-match'] === etag) {
    res.statusCode = 304;
    next(null, null);
  } else {
    next();
  }
}

function etagPlugin(app) {
  app.addHook('onSend', onSend);
}

module.exports = etagPlugin;
