var BaseView = require('./base_view');

module.exports = BaseView.extend({
  className: "author",
  getTemplateData: function () {
    return this.options;
  }
});

module.exports.id = "RunnableItemOwner";
