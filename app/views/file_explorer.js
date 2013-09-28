var BaseView = require('./base_view');
var _ = require('underscore');

module.exports = BaseView.extend({
  tagName: 'aside',
  id: 'file-explorer',
  className: 'closed',
  events: {
    'click .dark-theme'  : 'setDarkTheme',
    'click .light-theme' : 'setLightTheme',
    'click .open-context-menu'   : 'showFileMenu',
    'click .close-file-explorer' : 'hideFiles',
    'click #drop-to-add' : 'showUploadMessage',
    'drop #drop-to-add' : 'uploadToRoot',
    'dragover #drop-to-add'  : 'stopPropagation',
    'dragleave #drop-to-add' : 'stopPropagation',
    'contextmenu #drop-to-add' : 'stopPropagation',
  },
  postHydrate: function () {
    this.listenTo(this.app.dispatch, 'toggle:files', this.toggleFiles.bind(this));
  },
  postRender: function () {
    this.$("[rel='tooltip']").tooltip();
    this.fileRoot = _.findWhere(this.childViews, {name:'file_tree'});
  },
  toggleFiles: function (open) {
    if (open) { this.showFiles(); } else {
      this.hideFiles();
    }
  },
  hideFiles: function (evt) {
    if (evt) evt.preventDefault();
    this.$el.addClass('closed');
  },
  showFiles: function (evt) {
    if (evt) evt.preventDefault();
    this.$el.removeClass('closed');
  },
  showFileMenu: function (evt) {
    evt.preventDefault();
    // fragile, but I dont want to duplicate the file menu.. and it needs the rootDir
    this.fileRoot.contextMenu(evt);
  },
  setDarkTheme: function (evt) {
    if (evt) evt.preventDefault();
    this.$('.light-theme').removeClass('active');
    this.$('.dark-theme').addClass('active');
    this.app.dispatch.trigger('change:theme', 'dark');
  },
  setLightTheme: function (evt) {
    if (evt) evt.preventDefault();
    this.$('.dark-theme').removeClass('active');
    this.$('.light-theme').addClass('active');
    this.app.dispatch.trigger('change:theme', 'light');
  },
  showUploadMessage: function (evt) {
    evt.stopPropagation();
    this.showMessage('To upload files drop them in the file browser');
  },
  uploadToRoot: function (evt) {
    evt.stopPropagation();
    evt.preventDefault();
    this.fileRoot.uploadFiles(evt);
  },
  stopPropagation: function (evt) {
    evt.stopPropagation();
    evt.preventDefault();
  }
});

module.exports.id = "FileExplorer";
