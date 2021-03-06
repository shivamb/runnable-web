var RendrBase = require('rendr/shared/base/collection');
var Super = RendrBase.prototype;
var _ = require('underscore');
var async = require('async');
var utils = require('../utils');

module.exports = RendrBase.extend({
  initialize: function (attrs, options) {
    Super.initialize.apply(this, arguments);
    if (options) {
      _.extend(this, _.pick(options, 'params'));
    }
  },
  parse: function (response) {
    if (this.debugParse) {
      console.log(response);
    }
    return Super.parse.apply(this, arguments);
  },
  insert: function (index, model) {
    this.add(model, { at:index });
  },
  _prepareModel: function(attrs, options) {
    // BACKBONE BUG WORKAROUND
    // collection.fetch options -> collection.set -> _prepareModel -> model.set
    // collection.fetch options should not be sent to set... especially not the url
    // since I am not super familiar with _prepareModel I have only removed url for now.
    delete options.url; // collection options url should not be passed to model!
    var model;
    model = Super._prepareModel.call(this, attrs, options);
    model.app = this.app;
    return model;
  },
  sort: function () {
    var sort = this.options.sort || this.params.sort;
    if (!this.comparator && arguments.length === 0 && sort) {
      this.comparator = sort;
    }
    if (this.comparator || arguments.length) {
      return Super.sort.apply(this, arguments);
    }
  },
  sortByAttr: function (attr, fn) {
    var descending = false;
    if (attr.indexOf('-') === 0) {
      descending = true;
      attr = attr.slice(1);
    }
    this.comparator = fn || function (ma, mb) {
      var a = ma.get(attr);
      var b = mb.get(attr);
      var ret = (a < b) ? -1 :
                (a > b) ?  1 : 0;
      if (descending) ret = -ret;
      return ret;
    };
    this.sort();
    return this;
  },
  removeAll: function (except) {
    if (!Array.isArray(except)) {
      except = [except];
    }
    var removeModels = _.difference(this.models, except);
    this.remove(removeModels);
  },
  destroyAll: function (callback) {
    async.forEach(this.models, function (model, cb) {
      cb = utils.cbOpts(cb);
      model.destroy(cb);
    }, callback);
  }
});

module.exports.id = 'Base';