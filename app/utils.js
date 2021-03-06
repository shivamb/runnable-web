var _ = require('underscore');
var queryString = require('query-string');

var utils = module.exports = {
  capitalize: function (str) {
    return typeof str === 'string' && str.length && str[0].toUpperCase() + str.slice(1);
  },
  compose : function() {
    var funcs = Array.prototype.slice.apply(arguments);
    return function(arg) {
      return funcs.reduce(function(arg, fn) {
        return fn(arg);
      }, arg);
    };
  },
  sortBy: function (key) {
    var inv = 1;
    if (key.indexOf('-') === 0) {
      key = key.slice(1);
      inv = -1;
    }
    return function (a, b) {
      return (a.get('count') - b.get('count')) * inv;
    };
   },
  add: function(prev, curr) { return prev+curr; },
  and: function(prev, curr) { return prev+curr; },
  addAll: function() {
    return Array.prototype.slice.apply(arguments).reduce(utils.add);
  },
  pluck: function (key) {
    return function (obj) {
      return obj[key];
    };
  },
  put: function (obj, key) {
    if (arguments.length === 1 && typeof key === 'string') {
      key = obj;
      obj = {};
    }
    return function (val) {
      obj = _.clone(obj);
      obj[key] = val;
      return obj;
    };
  },
  lowercase: function (str) {
    return str.toLowerCase();
  },
  inside: function (arrOrStr) {
    return function (thing) {
      return ~arrOrStr.indexOf(thing);
    };
  },
  not: function (fn, ctx) {
    ctx = ctx || this;
    return function () {
      return !fn.apply(ctx, arguments);
    };
  },
  andAll: function() {
    return Array.prototype.slice.apply(arguments).reduce(utils.and);
  },
  notEmptyString: function(thing) {
    return (thing !== '');
  },
  exists: function(thing) {
    return (thing !== null && thing !== undefined);
  },
  defaultValue: function(thing, defaultVal) {
    return utils.exists(thing) ? thing : defaultVal;
  },
  pathJoin: function() {
    var args = Array.prototype.slice.apply(arguments);
    var ret  = args.filter(utils.exists).join('/')
      .replace(/(\/){2,}/g, '/') //replace double slashes
      .replace(/^(http(s){0,1}[:]\/)([^\/])/, '$1/$3') //fix links whose double slashes were replaced
    ;
    return ret;
  },
  addPageQuery: function (currentUrl, page) {
    var newUrl;
    if (page === 1) {
      newUrl = currentUrl.replace(/[?]page=[^&]+[&]/, '?');
      newUrl = newUrl.replace(/[&?]page=[^&]+/, '');
    }
    else if (
      ~currentUrl.indexOf('?page=') ||
      ~currentUrl.indexOf('&page=')
    ) {
      newUrl = currentUrl.replace(/([?&]page=)[^&]+([&].*)?/, '$1'+page+'$2');
    }
    else if (~currentUrl.indexOf('?')) {
      newUrl = currentUrl.replace('?', '?page='+page+'&');
    }
    else {
      newUrl = currentUrl + '?page='+page;
    }
    return newUrl;
  },
  toQueryString: function (query) {
    return Object.keys(query).reduce(function (qs, key) {
      var sep = (qs === '') ? '?' : '&';
      var val = query[key];
      return val ? (qs+sep+key+'='+val) : qs;
    }, '');
  },
  parseJSON: function (string, cb) {
    var err, json;
    try {
      json = JSON.parse(string);
    }
    catch(parseErr) {
      err = parseErr;
    }
    finally {
      cb(err, json);
    }
  },
  // thing, keys..
  keyPathExists : function(thing) {
    if (!utils.exists(thing)) { return false; }
    var keys = Array.prototype.slice.apply(arguments);
    keys.shift(); //pop off 'thing'
    var thingAtPath = thing;
    var nonExistingPathFound = keys.some(function (key) {
      thingAtPath = thingAtPath[key];
      if (!utils.exists(thingAtPath)) { return true; }
    });

    return !nonExistingPathFound;
  },
  escapeRegExp: function (str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  },
  uncapitalize : function(str) {
    return str[0].toLowerCase() + str.slice(1);
  },
  camelCase : function(str, capitalize) {
    var regex = /[ -_][a-z]/g;
    var newStr = '';
    var lastIndex = 0;
    str.replace(regex, function(match, index) {
      newStr += (str.substring(lastIndex, index));
      lastIndex = index+2;
      match  =  match.replace(/[ -_]/, '');
      newStr += (match.toUpperCase());
      newStr += ('');
    });
    newStr += (str.substring(lastIndex));

    if (utils.exists(capitalize)) {
      return capitalize? utils.capitalize(newStr) : utils.uncapitalize(newStr);
    }
    else {
      return newStr;
    }
  },
  unCamelCase : function(str, delimeter, capitalize) {
    delimeter = utils.exists(delimeter) ? delimeter : '-';
    var regex = /[A-Z]/g;
    var newStr = '';
    var lastIndex = 0;

    str.replace(regex, function(match, index) {
      newStr += (str.substring(lastIndex, index));
      lastIndex = index+1;
      if (index !== 0) {
        match = delimeter+match;
      }
      newStr += match.toLowerCase();
    });
    newStr += (str.substring(lastIndex));

    if (utils.exists(capitalize)) {
      return capitalize? utils.capitalize(newStr) : utils.uncapitalize(newStr);
    }
    else {
      return newStr;
    }
  },
  successToCB : function (cb) {
    return function (model, response) {
      cb(null, model, response);
    };
  },
  errorToCB : function (cb) {
    return function (model, xhr, options) {
      if (!isServer) {
        Track.backboneRequestError(model, xhr, options);
      }
      if (xhr.message) {
        cb(xhr.message);
      }
      else {
        utils.parseJSON(xhr.responseText, function (err, json) {
          var defaultMessage = 'Error, please try again.';
          if (err) { cb(defaultMessage); } else {
            cb(json.message || defaultMessage);
          }
        });
      }
    };
  },
  successErrorToCB: function (cb, context) {
    if (context) { cb = cb.bind(context); }
    return {
      success: utils.successToCB(cb),
      error  : utils.errorToCB(cb)
    };
  },
  cbOpts: function (cb, context) {
    if (context) { cb = cb.bind(context); }
    return {
      success: utils.successToCB(cb),
      error  : utils.errorToCB(cb)
    };
  },
  urlFriendly: function (str) {
    if (!str) { return ''; }
    var urlUnfriendlyChars = /[ @:?!'\(\)<>#%&=;{}\^\`\|\/\\]/g;
    var moreThanOneDash = /-{2,}/g;
    str = str
      .replace(urlUnfriendlyChars, '-')
      .replace(/[.,]/g, '-') // replace periods, commas
      .replace(moreThanOneDash, '-')
      .toLowerCase()
    ;
    return encodeURIComponent(str);
  },
  base64ToHex: function(base64) {
    if (!utils.exists(base64)) { return null; }
    return (isServer) ?
      utils._server_base64ToHex(base64) :
      utils._client_base64ToHex(base64);
  },
  _client_base64ToHex: function (base64) {
    var underscore = /_/g;
    var dash = /-/g;
    try {
      base64 = base64.replace(dash,'+').replace(underscore,'/').replace(/[ \r\n]+$/, "");
      for (var i = 0, bin = atob(base64), hex = []; i < bin.length; ++i) {
        var tmp = bin.charCodeAt(i).toString(16);
        if (tmp.length === 1) { tmp = "0" + tmp; }
        hex[hex.length] = tmp;
      }
      return hex.join("");
    }
    catch (err) {
      return false;
    }
  },
  _server_base64ToHex: function (base64) {
    var underscore = /_/g;
    var dash = /-/g;
    return (new Buffer(base64.toString().replace(dash,'+').replace(underscore,'/'), 'base64')).toString('hex');
  },
  hexToBase64: function (hex) {
    if (!utils.exists(hex)) { return null; }
    return (isServer) ?
      utils._server_hexToBase64(hex) :
      utils._client_hexToBase64(hex);
  },
  _client_hexToBase64: function(hex) {
    var plus = /\+/g;
    var slash = /\//g;
    return btoa(String.fromCharCode.apply(null,
      hex.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" "))
    ).replace(plus,'-').replace(slash,'_');
  },
  _server_hexToBase64: function (hex) {
    var plus = /\+/g;
    var slash = /\//g;
    return (new Buffer(hex.toString(), 'hex')).toString('base64').replace(plus,'-').replace(slash,'_');
  },
  isObjectId: function (str) {
    str = str && str.toString && str.toString();
    return Boolean(str && str.match(/^[a-fA-F0-9]{24}$/));
  },
  isObjectId64: function (str) {
    str = str && str.toString && str.toString();
    return Boolean(str && str.length === 16 && utils.isObjectId(utils.base64ToHex(str)));
  },
  tagsToString: function (tags, prelastword) {
    var tagsAreNames = typeof tags[0] === 'string';
    prelastword = prelastword || 'and';
    if (tags.length === 0) {
      return '';
    }
    else if (tags.length === 1) {
      return tagsAreNames ? tags[0] : tags[0].name;
    }
    else {
      var maxLength = 14;
      var last;
      if (tags.length > maxLength) {
        tags = tags.slice(0, maxLength);
        last = 'more';
      }
      tags = tagsAreNames ?
        tags :
        tags.map(utils.pluck('name'));
      last = last || tags.pop();
      tags = tags.join(', ');
      tags += ' ' + prelastword + ' ' +last;
      return tags;
    }
  },
  allImagesLoaded: function ($imgs, cb) {
    var max = $imgs.length;
    var count = 0;
    $imgs.each(function () {
      var $img = $(this);
      if ($img[0].complete) {
        checkAllLoaded();
      } else {
        $img.once('load', checkAllLoaded);
      }
    });
    function checkAllLoaded () {
      if (++count >= max) cb();
    }
  },
  isCurrentUrl: function (app, url, ignoreQueryString) {
    var currentUrl = utils.getCurrentUrlPath(app, ignoreQueryString);
    return ignoreQueryString ?
      utils.urlPathsMatch(currentUrl, url):
      utils.urlsMatch(currentUrl, url);
  },
  getCurrentUrlPath: function (app, ignoreQueryString) {
    var path;
    if (isServer) {
      path = app.req && app.req.url && app.req.url;
    }
    else {
      var domain = window.location.protocol +'//'+window.location.host;
      path = window.location.href.replace(domain, '');
    }
    if (ignoreQueryString)
      path = path.split('?')[0];
    return path;
  },
  getQueryParam: function (app, key) {
    if (isServer) {
      return app.req.query[key];
    }
    else {
      var q = queryString.parse(window.location.search);
      return q[key];
    }
  },
  getCurrentUrl: function (app) {
    return (isServer) ?
      app.req.protocol+'://'+app.req.host+utils.getCurrentUrlPath(app) :
      window.location.href;
  },
  urlPathsMatch: function (url1, url2) {
    url1 = url1 && url1.toLowerCase && url1.toLowerCase().split('?')[0];
    url2 = url2 && url2.toLowerCase && url2.toLowerCase().split('?')[0];
    return url1 === url2 ||
      url1+'/' === url2 ||
      '/'+url1 === url2 ||
      url1 === url2+'/' ||
      url1 === '/'+url2;
  },
  urlsMatch: function (url1, url2) {
    url1 = url1 && url1.toLowerCase && url1.toLowerCase();
    url2 = url2 && url2.toLowerCase && url2.toLowerCase();
    return url1 === url2 ||
      url1+'/' === url2 ||
      '/'+url1 === url2 ||
      url1 === url2+'/' ||
      url1 === '/'+url2;
  },
  getReferrer: function (app) {
    if (isServer) {
      return app.req.get('Referrer');
    }
    else {
      return document.referrer;
    }
  },
  clientSetCookie: function (c_name, value, exdays){
    var exdate=new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
    document.cookie=c_name + "=" + c_value;
  },
  clientGetCookie: function (c_name){
    var c_value = document.cookie;
    var c_start = c_value.indexOf(" " + c_name + "=");
    if (c_start == -1)
      {
      c_start = c_value.indexOf(c_name + "=");
      }
    if (c_start == -1)
      {
      c_value = null;
      }
    else
      {
      c_start = c_value.indexOf("=", c_start) + 1;
      var c_end = c_value.indexOf(";", c_start);
      if (c_end == -1)
      {
    c_end = c_value.length;
    }
    c_value = unescape(c_value.substring(c_start,c_end));
    }
    return c_value;
  },
  domainify: function (string) {
    return string.toLowerCase().replace(/[^0-9a-z-]/g, '-');
  },
  customChannel: function (app) {
    // put it here so that it's just in one place
    var Channel = require('./models/channel');
    return new Channel({
      _id        : "111122223333444455556666",
      name       : "Add your own",
      description: "Want to get Featured? Click here to find out how.",
      aliases    : ['add your own'],
      count      : '',
      url        : '/publish'
    }, { app:app });
  },
  sortLabel: function (sort) {
    // put it here so that it's just in one place
    var labelMap = {
      'created':'Newest',
      'runs'   :'Popular',
      '-created':'Newest',
      '-runs'   :'Popular'
    };
    return labelMap[sort];
  },
  s4: function () {
    return Math.floor((1 + Math.random()) * 0x10000)
       .toString(16)
       .substring(1);
  },
  uuid: function () {
    var s4 = utils.s4;
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
           s4() + '-' + s4() + s4() + s4();
  },
  addModelProperties: function (properties, model, prependKey) {
    // currently this is only used for tracking purposes
    // files is huge so we do not include it in our tracking events
    var ignoreKeys = ['files'];
    prependKey = prependKey || '';
    var modelName = (model.constructor.id || model.constructor.name).toLowerCase();
    var json = model.toJSON();
    var skip;
    for (var key in json) {
      skip = ~ignoreKeys.indexOf(key);
      if (!skip) {
        var value = json[key];
        var type = typeof value;
        if (type === 'object') value = value;
        properties[prependKey+modelName+'.'+key] = value;
      }
    }
    return properties;
  },
  noop: function () {}
};
