var BaseView = require('./base_view');
var utils = require('../utils');
var Image = require('../models/image');
var _ = require('underscore');
var utils = require('../utils');

var Super = BaseView.prototype;
module.exports = BaseView.extend({
  tagName:'h1',
  events: {
    'click .edit-title': 'clickEdit',
    'submit form'      : 'submitName',
    'click .btn-cancel': 'escEditMode'
  },
  preRender: function () {
    if (!(this.model instanceof Image)) {
      this.className = 'no-padding';// if no vote button
    }
  },
  postRender: function () {
    this.listenTo(this.model, 'change:name change:tags', this.render.bind(this));
  },
  getTemplateData: function () {
    this.model.virtual.nameWithTags = this.model.nameWithTags(true);
    this.options.canedit = !(this.model instanceof Image) &&
      this.app.user.canEdit(this.model);
    return this.options;
  },
  clickEdit: function (evt) {
    evt.preventDefault();
    this.setEditMode(true);
  },
  escEditMode: function () {
    this.setEditMode(false);
  },
  setEditMode: function (bool) {
    this.options.editmode = bool;
    this.render();
  },
  submitName: function (evt) {
    evt.preventDefault();
    var formData = $(evt.currentTarget).serializeObject();
    this.options.editmode = false; // assume success, change will rerender
    if (formData.name === this.model.get('name')) this.render();
    var options = utils.cbOpts(cb, this);
    this.model.save(formData,  options);

    function cb (err) {
      if (err === 'a shared runnable by that name already exists') {
        var actionHandler = function(dialogItself){
          this.publishNew();
          // dialogItself.close();
        };

        self.showPrompt({
          message:
            '<p>Choose a unique name for your project. Lorem Ipsum is taken.'+
            '<input type="text" class="form-control" required>',
          actionLabel: 'Save and Publish',
          actionHandler: actionHandler
        });
      } else if (err) {
        this.setEditMode(true);
        self.showError(err);
      }
    }
  }
});

module.exports.id = 'RunnableTitle';
