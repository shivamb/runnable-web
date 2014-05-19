var BaseView     = require('./base_view'),
    _            = require('underscore'),
    modalHelpers = require('../helpers/modals');

module.exports = BaseView.extend({
  tagName: 'aside',
  id: 'file-explorer',
  events: {
    'click .dark-theme'              : 'setDarkTheme',
    'click .light-theme'             : 'setLightTheme',
    'click .open-context-menu'       : 'showFileMenu',
    'contextmenu .open-context-menu' : 'showFileMenu',
    'click [data-action="download"]' : 'showDownloadDialog',
    // 'drop #drop-to-add'              : 'uploadToRoot',
    // 'dragover #drop-to-add'          : 'dragOver',
    // 'dragleave #drop-to-add'         : 'dragLeave',
    'click #rebuild'                 : 'rebuild',
    'click #tip'                     : 'showPreviewPopover'
  },
  showDownloadDialog: function () {
    modalHelpers.saveProjectMessage.call(this, function () {
    });
  },
  postRender: function () {
    this.fileRoot = _.findWhere(this.childViews, {name:'file_tree'});
    this.adjustTreeHeight();
  },
  adjustTreeHeight: function () {
    var self = this;
    var thisHeight = self.$el.height();
    var buildHeight = self.$('#build-files .fs-list')[0].offsetHeight + 28;
    var subTree = self.$('.sub-tree');

    if (buildHeight > thisHeight/2) {
      subTree.css('height','50%');
    }
    else {
      subTree.css('height','')
      this.$('#container-files').height(thisHeight - buildHeight);
    }
  },
  showFileMenuPopover: function () {
    $('#file-menu-popover')
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
  uploadToRoot: function (evt) {
    this.stopPropagation(evt);
    this.fileRoot.uploadFiles(evt);
  },
  dragOver: function (evt) {
    this.stopPropagation(evt);
    this.$('#drop-to-add').addClass('in');
  },
  dragLeave: function (evt) {
    this.stopPropagation(evt);
    this.$('#drop-to-add').removeClass('in');
  },
  rebuild: function () {
    $('#project').addClass('out');
  },
  showPreviewPopover: function () {
    this.$('#preview-popover').toggleClass('in');
  },
  stopPropagation: function (evt) {
    evt.stopPropagation();
    evt.preventDefault();
  },
  getTemplateData: function () {
    return this.options;
  },
  postHydrate: function () {
    $(window).resize(this.adjustTreeHeight.bind(this));
  },
  remove: function () {
    $(window).unbind('resize', this.adjustTreeHeight);
  }
});

module.exports.id = "FileExplorer";
