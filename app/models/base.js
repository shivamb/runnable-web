var RendrBase = require('rendr/shared/base/model');
var _ = require('underscore');
var Super = RendrBase.prototype;

module.exports = RendrBase.extend({
  idAttribute: '_id',
  virtual: {},
  virtuals: {},
  initialize: function (attrs, options) {
    Super.initialize.apply(this, arguments);
    if (options) {
      _.extend(this, _.pick(options, 'urlRoot'));
    }
    // this.initVirtuals();
  },
  parse: function (response) {
    if (this.debugParse) {
      console.log(response);
    }
    return Super.parse.apply(this, arguments);
  },
  // toJSON: function () {
  //   var data = Super.toJSON.call(this);
  //   var virtualMap = _.result(this, 'virtualMap');
  //   for (var key in virtualMap) {
  //     var val = virtualMap[key];
  //     data[key] = this[val]();
  //   }
  //   return data;
  // },
  // get: function (key) {
  // //   var val = Super.get.apply(this, arguments);
  // //   return (utils.exists(val) && !this.ifVirtual(key))
  // //     ? val
  // //     : this.getVirtual(key);
  // // },
  // // ifVirtual: function (key) {
  //   return utils.exists(this.virtualMap[key]);
  // },
  // getVirtual: function (key) {
  //   var vmap = this.virtualsMap;
  //   var method = vmap[key];
  //   var val = method && this[method] && this[method]
  //   if (val) {
  //     if (typeof val == 'object' && val.method)
  //       val = val.method();
  //     else if (typeof val == 'function')
  //       val = val();
  //   }

  //   return val;
  // },
  // initVirtuals: function () {
  //   var self = this;
  //   var val, virtualKey;
  //   var vmap = this.virtuals;
  //   for (vkey in vmap) {
  //     var val = vmap[vkey];
  //     if (_.isObject(val) && val.deps) {
  //       if (!Array.isArray(deps)) deps = [deps];
  //       val.deps.forEach(function (depKey) {
  //         // keep virtuals up to date
  //         self.listenTo(self, 'change:'+depKey, self.updateVirtual.bind(self, vkey));
  //       })
  //     }
  //     this.updateVirtual(key);
  //   }
  // },
  // updateVirtual: function (key) {
  //   this.attributes[key] = this.getVirtual(key);
  // }
});

module.exports.id = 'Base';