var BaseView = require('./base_view');

module.exports = BaseView.extend({
  tagName: 'h1',
  getTemplateData: function () {
    return {
      project : this.model.toJSON(),
      editMode: this.editMode
    };
  },
  toggleEditMode: function () {
    this.editMode = !Boolean(this.editMode);
    return this.render();
  },
  submitName: function (evt) {
    var $form = $(evt.currentTarget);
    var formData = $form.serializeObject;
    var project = this.model;
    project.saveAttribute('name', formData.name, {
      success : function () {},
      error   : function () {}
    });
  }
});

module.exports.id = 'ProjectTitleView';