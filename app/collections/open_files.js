var Fs = require('../models/fs');
var Base = require('./base');
var Super = Base.prototype;
var utils = require('../utils');
var async = require('async');

module.exports = Base.extend({
  model: Fs,
  url  : function () {
    return '/users/me/runnables/:containerId/files'
      .replace(':containerId', this.options.containerId);
  },
  initialize: function () {
    this.listenTo(this, 'change:selected', this.onChangeSelected.bind(this));
    this.listenTo(this, 'remove', this.onRemove.bind(this));
    this.listenTo(this, 'add', this.onAdd.bind(this));
    // initial selected file
    // if (this.at(0)) {
    //   console.log('boom')
    //   console.log('boom')
    //   console.log('boom')
    //   this.at(0).set('selected', true);
    // }
    // else {
    //   console.log('boomdsa')
    //   console.log('boomdas')
    //   console.log('boomdsa')
    // }
    Super.initialize.apply(this, arguments)
  },
  onChangeSelected: function (selectedFile) {
    // unselect other files when new file selected
    if (selectedFile.get('selected')) {
      this
        .where({ selected:true })
        .filter(function (file) {
          return file != selectedFile;
        })
        .forEach(function (file) {
          file.set('selected', null);
        });

      this.trigger('select:file', selectedFile);
    }
    else if (!this.findWhere({ selected:true })) {
      // no more files open
      this.trigger('select:file', null);
    }
  },
  onRemove: function (fileRemoved) {
    fileRemoved.set('selected', false);
  },
  onAdd: function (fileAdded) {
    fileAdded.set('selected', true);
  }
});

// module.exports = Base.extend({
//   model: File,
//   initialize: function (attrs, options) {
//     Super.initialize.apply(this, arguments);
//     this.project = options && options.project;
//     // events
//     this.listenTo(this, 'add', this.onAdd.bind(this));
//     this.listenTo(this, 'add remove', this.onAddRemove.bind(this));
//     // this.on('remove', this.onRemove, this);
//     this.listenTo(this, 'change:content change:savedContent', this.onChangeContent.bind(this));
//     this.listenToOnce(this, 'add', this.firstAdd.bind(this));
//   },
//   firstAdd: function (fileModel) {
//     this.selectedFileModel = fileModel; // this is the default file basically.
//   },
//   onAddRemove: function () {
//     if (this.hasUnsavedChanges()) {
//       this.trigger('hasUnsavedChanges');
//     }
//     else {
//       this.trigger('noUnsavedChanges');
//     }
//   },
//   onChangeContent: function (model) {
//     console.log("onChangeContent called in files.js");
//     var unsavedChanges = model.hasUnsavedChanges();
//     if (model.previouslyHadUnsavedChanges !== unsavedChanges) {
//       if (!unsavedChanges) {
//         this.trigger('noUnsavedChanges');
//       }
//       else { // (unsavedChanges)
//         this.trigger('hasUnsavedChanges');
//       }
//     }
//   },
//   onAdd: function (model) {
//     this.listenTo(model, 'destroy', this.onModelDestroyed.bind(this));
//     if (this.length === 1) { // if first model added set as selected
//       this.selectedFile(model);
//     }
//   },
//   onModelDestroyed: function (model) {
//     this.stopListening(model);
//     this.remove(model);
//   },
//   setSelectedFile: function (fileModel, options) {
//     options = options || {};
//     if (typeof fileModel == 'string') {
//       filePath = fileModel;
//       fileModel = this.get(filePath);
//       if (fileModel) {
//         this.setSelectedFile(fileModel);
//       }
//       else {
//         console.error(filePath+' not found.');
//       }
//     }
//     else {
//       if (this.selectedFileModel !== fileModel) {
//         this.selectedFileModel = fileModel;
//         if (!options.silent) {
//           this.trigger('select:file', this.selectedFile());
//         }
//       }
//     }
//   },
//   selectedFile: function (fileModel, options) {
//     var filePath;
//     if (utils.exists(fileModel)) {
//       this.setSelectedFile(fileModel, options);
//     }
//     else {
//       return this.selectedFileModel || this.at(0);
//     }
//   },
//   remove: function (fileModel) {
//     var currentIndex, nextIndex;
//     if (this.selectedFile() === fileModel) {
//       currentIndex = this.indexOf(this.selectedFile());
//       nextIndex = currentIndex - 1;
//       if (nextIndex < 0) {
//         nextIndex = 0;
//       }
//     }
//     // Always
//     fileModel.loseUnsavedChanges();           // Reset unsavedChanges for file
//     Super.remove.apply(this, arguments);     // remove The Model
//     if (utils.exists(nextIndex)) {
//       // AFTER it is removed, setSelectedFile bc it can accept undefined and still set the model.
//       this.setSelectedFile(this.at(nextIndex));
//     }
//   },
//   hasUnsavedChanges: function () {
//     return this.some(function (file) {
//       return file.hasUnsavedChanges();
//     });
//   },
//   hasUnsavedNonClientSideChanges: function () {
//     return this.some(function (file) {
//       return file.hasUnsavedChanges() && !file.isClientSide();
//     });
//   },
//   saveAll: function (projectId, callback) {
//     var self = this;
//     var anyHadUnsavedChanges = false;
//     var anyNonClientSideFilesChanged = false;
//     var fileModels = this.toArray();
//     // move package.json ot the front
//     fileModels.sort(function (a, b) {
//       return (a.get("name") == "package.json") ? -1 : 0;
//     });
//     async.forEach(fileModels, function(fileModel, acb) {
//       if (fileModel.hasUnsavedChanges()) {
//         var options = utils.successErrorToCB(acb);
//         fileModel.save({}, options);
//       }
//       else {
//         acb();
//       }
//     }, callback);
//   }
// });

module.exports.id = "OpenFiles";