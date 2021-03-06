var express = require('express');
var handle404 = require('./handle404');
var path = require('path');
//
// This is the error handler used with Rendr routes.
//
module.exports = function() {
  return function errorHandler(err, req, res, next) {
    console.error("ERROR sendIf400Error", res.code, err, err.msg, err.stack);
    if (err.status === 401) {
      res.redirect('/login');
    } else if (err.status === 404 || err.status === 403) { //permission denied as 404 for now
      handle404(req, res, next);
    } else { // 500
      if (process.env.NODE_ENV == 'development') {
        express.errorHandler()(err, req, res, next);
      }
      else {
        handle500(req, res, next);
      }
    }
  };
};

function handle500 (req, res, next) {
    res.status(500);

    // Respond with HTML
    if (req.accepts('html')) {
      res.set('Content-Type', 'text/html');
      res.render(path.join(__dirname, '/../../app/templates/404.hbs'));
    // Respond with JSON
    } else if (req.accepts('json')) {
      res.json({error: 'Application error'});
    // Respond with plain-text.
    } else {
      res.type('txt').send('Application error');
    }
}
