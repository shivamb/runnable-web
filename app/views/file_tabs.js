var BaseView = require('./base_view');

module.exports = BaseView.extend({
  tagName: 'ul',
  id: 'project-editor-tabs',
  className: 'nav nav-tabs',
  postHydrate: function () {
    this.listenTo(this.collection, 'add remove', this.render.bind(this));
  }
});

module.exports.id = "FileTabs";
