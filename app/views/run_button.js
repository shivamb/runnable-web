var _ = require('underscore');
var EditorButtonView = require('./editor_button_view');
var Super = EditorButtonView.prototype;
var utils = require('../utils');

module.exports = EditorButtonView.extend({
  tagName: 'button',
  className: 'green',
  events: {
    'click' : 'click'
  },
  preRender: function () {
    Super.preRender.call(this);
  },
  postHydrate: function () {
    Super.postHydrate.call(this);
    var dispatch = this.app.dispatch;
    if (dispatch) {
      this.listenTo(dispatch, 'unsaved:files', this.onChangeUnsaved.bind(this));
    }
  },
  postRender: function () {
    // Leave this here for debugging!
    console.log("CONTAINER ID: ", this.model.id);
    // implementation interactions through implement_link
    this.implementLink = _.findWhere(this.childViews, {name:'implement_link'});
  },
  click: function () {
    if (!this.userImplementedSpec()) {
      this.openImplementModal({
        onClose: function () {
          if (this.userImplementedSpec()) this.run();
        }.bind(this)
      });
    }
    else {
      this.run();
    }
  },
  getTemplateData: function () {
    this.options.specification = this.collection.get(this.model.get('specification'));
    return this.options;
  },
  userImplementedSpec: function () {
    return this.implementLink.userImplementedSpec();
  },
  openImplementModal: function (opts) {
    return this.implementLink.openImplementModal(opts);
  },
  run: function () {
    var url = '/'+this.model.id+'/output';
    var windowName = this.model.id+'output';
    var popup = window.open(url, windowName);
    this.disable(true);
    this.model.run(function (err) {
      this.disable(false);
      if (err) {
        this.showError(err);
        popup.close();
        _rollbar.push({level: 'error', msg: "Couldn't start container", errMsg: err});
      }
      else {
        popup.postMessage("Refresh", "*");
      }
    }, this);
    this.app.dispatch.trigger('run');
  },
  onChangeUnsaved: function (bool) {
    if (bool)
      this.$('span').html('Save and Run');
    else
      this.$('span').html('Run');
  }
});

module.exports.id = 'RunButton';
