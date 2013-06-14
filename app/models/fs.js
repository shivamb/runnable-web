// var Base = require('./base');
var Base = require('backbone').Model;
var Super = Base.prototype;
var App = require('../app').prototype; //hacky..

module.exports = Base.extend({
  idAttribute: 'path',
  // url: function () { return '/projects/' + this.project.id + '/files' + (this.get(this.idAttribute) || ''); }, //backbone url encodes the id val by default..
  url: function () { return '/api/projects/' + this.project.id + '/files' + (this.get(this.idAttribute) || ''); }, //backbone url encodes the id val by default..
  initialize: function (attrs, options) {
    Super.initialize.apply(this, arguments);
    this.project = options && options.project;
    this.parentDir  = options && options.parentDir;
    this.listenTo(this, 'change:name', this.onChangeName.bind(this));
    this.listenTo(this, 'change:path', this.onPathChange.bind(this));
  },
  getRootDir: function () {
    return this.project.rootDir;
  },
  isRootDir: function () {
    return Boolean(this === this.getRootDir());
  },
  getPath: function (fsPath) {
    var notEmptyStr = function (i) { return i !== ''; };
    var fsPathSplit = fsPath.split('/');
    var fsModel     = this.getRootDir();
    fsPathSplit     = fsPathSplit.filter(notEmptyStr); // first item will be emptystr bc path starts with /
    while (fsPathSplit.length) {
      fsName = fsPathSplit.shift();
      fsModel = fsModel.collection().getByName(fsName);
      if (!fsModel) {
        //FAILING HERE
        return null;
      }
    }

    return fsModel;
  },
  getDownloadUrl: function () {
    return this.url().replace('/files', '/zip');
  },
  onPathChange: function () {
    var FileModel = require('models/FileModel');
    var DirModel  = require('models/DirModel');
    var nameRegex = new RegExp(App.utils.escapeRegExp(this.get('name'))+'$');
    var oldPath = this.previousAttributes().path;
    var newPath = this.get('path');
    if (oldPath) {
      var oldName = this.previousAttributes().name;
      var oldNameRegex = new RegExp(App.utils.escapeRegExp(oldName)+'$');
      var oldParentPath, newParentPath, oldParentDir, newParentDir, newFSModel;
      if (oldName) {
        oldParentPath = oldPath.replace(oldNameRegex, ''); // change name triggers change path..
      }
      oldParentPath = oldParentPath.replace(nameRegex, '');
      newParentPath = newPath.replace(nameRegex, '');
      if (oldParentPath !== newParentPath) { //only move if the path actually changes
        oldParentDir = this.getPath(oldParentPath);
        newParentDir = this.getPath(newParentPath);
        oldParentDir.collection().remove(this.rollbackAttr('path', {silent:true}));
        var reAddToOpenFiles;
        if (this.project && this.project.openFiles.get(this.id)) {
          reAddToOpenFiles = true;
          this.project.openFiles.remove(this);
        }
        newParentDir.collection().add(this.set('path', newPath, {silent:true})); // TODO: figure out improvement vs if
        if (this.project && reAddToOpenFiles) {
          this.project.openFiles.add(this);
        }
        this.parentDir = newParentDir;
      }
    }
    return this;
  },
  onChangeName: function () {
    var name  = this.get('name');
    var path  = this.get('path');
    var pathSplit = path.split('/');
    pathSplit.pop();
    var relPath = pathSplit.join('/');
    this.set('path', App.utils.pathJoin(relPath, name));
    //Fix this
  },
  isDir: function () {
    return Boolean(this.get('type')=='dir');
  },
  isFile: function () {
    return Boolean(this.get('type')=='file');
  },
  setProject: function (project) {
    this.project = project;
    return this;
  },
  rollbackAttr: function (attr, options) {
    options = options || {};
    var prevVal = this.previousAttributes()[attr];
    this.set(attr, prevVal, options);
    return this;
  },
  validate: function (attrs, options) {
    if (attrs.name) {
      if (attrs.name.trim().length === 0) {
        return "Name cannot be all spaces";
      }
      if (attrs.name.trim().length !== attrs.name.length) {
        return "Name cannot contain spaces at beginning or end";
      }
      var parentDirPath = this.parentDir && this.parentDir.get('path');
      var newFilePath = App.utils.pathJoin(parentDirPath, attrs.name);
      var fsModelAtNewFilePath = this.parentDir.collection().get(newFilePath);
      if (this.parentDir && (fsModelAtNewFilePath && fsModelAtNewFilePath !== this)) {
        // sibling exists at new file path. and the file is not the file itself (could be pushed first then removed if request fails)
        return 'File/dir with name "'+attrs.name+'" already exists.';
      }
    }
  },
  rename: function (name, cb) {
    var self = this;
    var err;
    cb = cb || function () {};
    if (this.get('name') == name) {
      cb();
    }
    else {
      err = this.validate({name:name});
      if (err) { cb(err); } else {
        var oldURL = this.url();
        this.save({name:name}, {
          type: 'put',
          url : oldURL,
          success: function (model) {
            if (model.attributes.type === 'file') {
              Track.event('File system', 'Renamed file', {
                filename: model.attributes.name,
                projectId: self.project.id
              });
            } else if (model.attributes.type === 'dir') {
              Track.event('File system', 'Renamed folder', {
                foldername: model.attributes.name,
                projectId: self.project.id
              });
            }
            cb(null, model);
          },
          error: function (model, xhr) {
            self.rollbackAttr('name');
            err = new Error('Error renaming '+self.get('type')+'.');
            cb(err);
          }
        });
      }
    }
  },
  move: function (newPath, cb) {
    var self = this;
    var oldURL = this.url();
    var oldPath = this.get('path');
    this.save({ path:newPath }, {
      type: 'put',
      url : oldURL,
      success: function (model) {
        Track.event('File system', 'Renamed file', {
          projectId: self.project.id,
          filename: model.attributes.name,
          foldername: newPath
        });
        cb();
      },
      error: function (model, xhr) {
        var callbackGenericError = function (err) {
          console.error(err);
          err = new Error('Error moving '+self.get('type')+'.');
          cb(err);
        };
        model.set('path', oldPath); // reset path and path onchange will handle the rest.
        App.utils.parseJSON(xhr.responseText, function (err, jsonErr) {
          if (err) { callbackGenericError(); } else {
            if (jsonErr.code === 'EEXISTS') {
              err = new Error('Error: path already exists.');
              cb(err);
            }
            else {
              callbackGenericError();
            }
          }
        });
      }
    });
  },
  getParentPath: function () {
    return this.parentDir && this.parentDir.get('path');
  },
  del: function (cb) {
    var self = this;
    this.destroy({
      success: function (model) {
        if (model.attributes.type === 'file') {
          Track.event('File system', 'Deleted file', {
            filename: model.attributes.name,
            projectId: self.project.id
          });
        } else if (model.attributes.type === 'dir') {
          Track.event('File system', 'Deleted folder', {
            foldername: model.attributes.name,
            projectId: self.project.id
          });
        }
        cb(null, model);
      },
      error: function (model, xhr) {
        App.utils.parseJSON(function (err, jsonErr) {
          if (err) {}
        });
        if (self.parentDir) self.parentDir.collection().add(self);
        err = new Error('Error deleting '+self.get('type')+'.');
        cb(err);
      }
    });
  }
});

module.exports.id = "Fs";