var Base = require('./base');
var Super = Base.prototype;
var utils = require('../utils');
var async = require('async');
var File = require('../models/file');
var Dir = require('../models/dir');

module.exports = Base.extend({
  initialize: function () {
    Super.initialize.apply(this, arguments);
    var self = this;
    this.model = function (attrs, opts) {
      var opts = opts || {};
      opts.app = self.app;
      var params = self.options.params || self.params;
      attrs.containerId = params.containerId;
      return (attrs.dir)
        ? new Dir(attrs, opts)
        : new File(attrs, opts);
    };
    this.model.prototype = File.prototype; //hack, jsonKey in _parseModels shared/base/collection
    if (!this.length) {
      this.listenToOnce(this, 'reset sync change add', this.setFetched.bind(this));
    }
    else {
      this.setFetched();
    }
    // since model is a function must set idAttribute manually
    this._idAttr = File.prototype.idAttribute;
    debugger;
  },
  url  : function () {
    var containerId = this.options.containerId || this.params.containerId;
    return '/users/me/runnables/:containerId/files'
      .replace(':containerId', containerId);
  },
  setFetched: function () {
    this.fetched = true;
  },
  unFetched: function () {
    return Boolean(this.fetched);
  }
});

// module.exports = Base.extend({
//   // url: function () { return '/projects/' + this.project.id + '/files' + this.path; },
//   // url: function () { return '/api/projects/' + this.project.id + '/files' + this.path; },
//   url: function () { return ['/users/me/runnables/', this.project.id, '/files?path=', this.path].join(''); },
//   initialize: function (attrs, options) {
//     Super.initialize.apply(this, arguments);
//     this._idAttr = File.prototype.idAttribute; //backbone bug hack to make idAttr still work for the collection when its model is dynamically determined
//     this.project = options && options.project;
//     this.parentDir  = options && options.parentDir;

//     var self = this;
//     this.model = function (attrs, opts) {
//       var model;
//       opts = opts || {};
//       opts.project   = self.project;
//       opts.parentDir = self.parentDir;
//       if (!attrs.type || attrs.type === 'file') { // TODO: dont need to assume file over dir
//         model = new File(attrs, opts);
//       }
//       else if (attrs.type == 'dir') {
//         model = new Dir(attrs, opts);
//       }

//       return model;
//     };
//     this.on('add', this.attachModelEvents, this);
//   },
//   comparator: function (a, b) {
//     var sortName = function (a, b) {
//       var A = a.get('name');
//       var B = b.get('name');
//       if (A == B) return 0;
//       if (A.toLowerCase() < B.toLowerCase()) return -1;
//       if (A.toLowerCase() > B.toLowerCase()) return 1;
//     };
//     var sortType = function (a, b) {
//       if (a.get('type') == b.get('type')) return 0;
//       if (a.isDir()  && b.isFile()) return -1;
//       if (a.isFile() && b.isDir() ) return 1;
//     };

//     return (sortType(a, b) || sortName(a, b));
//   },
//   attachModelEvents: function (model) {
//     if (model)
//       model.on('destroy', this.onModelDestroyed, this);
//   },
//   onModelDestroyed: function (model) {
//     this.remove(model);
//   },
//   setProject: function (project) {
//     this.project = project;
//     return this;
//   },
//   setPath: function (path) {
//     this.path = path;
//     return this;
//   },
//   getFirstFile: function () {
//     return this.where({type:'file'})[0];
//   },
//   getFirstDir: function () {
//     return this.where({type:'dir'})[0];
//   },
//   getByName: function (name) {
//     if (!this.parentDir) throw new Error('cant get by name if not parent dir');
//     var currPath = this.parentDir.get('path');
//     var path = utils.pathJoin(currPath, name);
//     return this.get(path);
//   },
//   add: function () {
//     if (this.parentDir) {
//       if (this.parentDir.get('contents') === null) { //contents have not been fetch so just ignore the add..
//         return;
//       }
//     }
//     return Super.add.apply(this, arguments);
//   }

// });

module.exports.id = "Fs";