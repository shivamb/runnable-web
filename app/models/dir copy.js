var Fs = require('./fs');
var Super = Fs.prototype;
var utils = require('../utils');
var _ = require('underscore');

module.exports = Fs.extend({
  initialize: function (attrs, options) {
    console.log("Initializing DirModel");
    Super.initialize.apply(this, arguments);
    this.project = this.project || attrs && attrs.project || options && options.project; // hacky for rendr
    var FSCollection = require('../collections/fs');

    this.contents = new FSCollection([], {
      project   : this.project,
      parentDir : this,
      app       : this.app,
      url       : _.result(this, 'urlRoot'),
      params    : {
        path : this.get('path')
      }
    });
    this.listenTo(this.contents, 'change add remove', this.onChangeContents.bind(this));
    this.listenTo(this, 'change:contents', this.onChangeContentsJSON.bind(this))
    this.listenTo(this, 'change:path', this.onChangePath.bind(this));
    if (attrs && attrs.contents)
      this.onChangeContents();
  },
  defaults: function () {
    return {
      dir : true,
      type: 'dir'
    };
  },
  onChangeContentsJSON: function () {
    this.contents.reset(this.get('contents'));
  },
  onChangePath: function () {
    var prevAttributes = this.previousAttributes();
    if (prevAttributes.toJSON) prevAttributes = prevAttributes.toJSON();
    var thisOldPath = prevAttributes.path;
    var thisNewPath = this.get('path');
    this.contents.forEach(function (fsModel) {
      var newFSPath = fsModel.get('path').replace(thisOldPath, thisNewPath);
      fsModel.set('path', newFSPath);
    });
  },
  onChangeContents: function () {
    this.set('contents', this.contents.toJSON(), {silent:true}); // must be silent to prevent inf loop
  },
  addModel: function (model, cb) {
    var self = this;
    var newPath = model.get('path');
    var err;
    if (this.contents().get(newPath)) {
      err = new Error('Path already exists');
      cb(err);
    }
    else {
      if (!this.isNew()) { // if the parentDir isNew it's contents will be fetched later, so leave contents empty
        this.contents().add(model);
      }
      model.save(null, {
        type: "POST",
        success: function (model) {
          cb();
        },
        error: function (model, xhr) {
          var callbackGenericError = function (err) {
            if (err) console.error(err);
            err = new Error('Error adding '+model.get('name')+'.');
            cb(err);
          };
          utils.parseJSON(xhr.responseText, function (err, rspErr) {
            if (err) { callbackGenericError(err); } else {
              err = rspErr;
              if (rspErr.code == 'EEXISTS') {
                err = new Error('File/dir already exists.');
                cb(err);
              }
              else {
                callbackGenericError();
              }
            }
          });
        }
      });
    }
  },
  fetch: function () {
    console.log("GET HERE XXX5. Dir's 'fetch' is getting called");
    return Super.fetch.apply(this, arguments);
  },
  isNew: function () {
    return !utils.exists(this.get('contents'));
  },
  addFile: function (filename, cb) {
    var newPath = utils.pathJoin(this.get('path'), filename);
    var err;
    var options = { parentDir:this, project:this.project };
    var model = new FileModel({
      name: filename,
      path: newPath,
      type: 'file',
      content: ''
    }, options);
    this.addModel(model, cb);
  },
  addDir: function (dirname, cb) {
    var newPath = utils.pathJoin(this.get('path'), dirname);
    var err;
    var options = { parentDir:this, project:this.project };
    var model = new DirModel({
      name: dirname,
      path: newPath,
      type: 'dir'
    }, options);
    this.addModel(model, cb);
  },
  moveIn: function (fsPath, cb) {
    var self = this;
    var fsPathSplit  = fsPath.split('/');
    var fsName       = fsPathSplit.pop();
    var fsParentPath = fsPathSplit.join('/') || '/';
    var thisPath     = this.get('path');
    var newPath      = utils.pathJoin(thisPath, fsName);
    var fsModel;

    console.log("newPath", newPath);
    console.log("fsParentPath", fsParentPath);

    if (thisPath.indexOf(fsPath) === 0 && !utils.exists(thisPath[fsPath.length])) {
      cb(); // fs is this.. cant drop in self
    }
    else if (thisPath.indexOf(fsPath) === 0 && thisPath[fsPath.length] == '/') {
      cb(); // fs is this.. cant drop in child
    }
    else if (thisPath == fsParentPath) {
      cb(); // fs is already in this dir
    }
    else if (this.getPath(newPath)) {
      cb(new Error('Error moving file: "'+newPath+'" already exists.'));
    }
    else {
      fsModel = this.getPath(fsPath);
      if (fsModel) {
        fsModel.move(newPath, cb);
      } else {
        cb();
      }
    }
  }
});

module.exports.id = "Dir";