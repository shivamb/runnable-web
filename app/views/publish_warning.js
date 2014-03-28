var _ = require('underscore');
var BaseView = require('./base_view');
var utils = require('../utils');
var modalHelpers = require('../helpers/modals');

module.exports = BaseView.extend({
  events: {
    'click #pubwarn-new-button' : 'publishNew',
    'click #pubwarn-back-button': 'publishBack'
  },
  className: 'status-bar',
  postHydrate: function () {
    // rerender on login/logout
    this.listenTo(this.app.user, 'change:permission_level', this.render.bind(this));
  },
  getTemplateData: function () {
    var opts = this.options;
    var user = this.app.user;
    var parentOwner = opts.parentowner;
    var parentId = opts.parentid; // used to check parent existance

    opts.canPublishBack = parentId && user.canEdit({owner: parentOwner}) ;
    return this.options;
  },
  postRender: function () {
    this.$pubNew = $('#pubwarn-new-button');
    this.$pubBack = $('#pubwarn-back-button');
  },
  publishNew: function () {
    var self = this;
    this.model.saveOpenFiles(function (err) {
      if (err) {
        self.showError(err);
        return;
      }
      if(self.app.user.isRegistered()){
        self.publishLoader = _.findWhere(self.childViews, {name:'publish_loader'});
        self.publishLoader.initLoading('new', self.publishCallback.bind(self));
      } else {
        modalHelpers.signup.call(self, function(){
          if(self.app.user.isRegistered()){
            self.publishNew();
          }
        });
      }
      self.$pubNew.attr('disabled', 'disabled');
    }, self);
  },
  publishBack: function () {
    var self = this;
    this.model.saveOpenFiles(function (err) {
      if (err) {
        self.showError(err);
        return;
      }
      self.publishLoader = _.findWhere(self.childViews, {name:'publish_loader'});
      self.publishLoader.initLoading('back', self.publishCallback.bind(self));
      self.$pubBack.attr('disabled', 'disabled');
    }, self);
  },
  publishCallback: function (err) {
    if (err) {
      var self = this;

      self.app.set('loading', false);
      self.$pubNew.removeAttr('disabled');
      self.$pubBack.removeAttr('disabled');

      if (err === 'a shared runnable by that name already exists') {
        self.showRenameModal();
      } else if (err) {
        self.showError(err);
      }
    }
    // success handles redirect within publishLoader
  },
  showRenameModal: function () {
    var self = this;
    var actionHandler = function(dialogItself){
      var $form = dialogItself.$modalContent;
      var container = self.publishLoader.model;
      var showError = function (message) {
        dialogItself.$modalBody
          .find('.alert')
          .remove()
          .end()
          .append('<div class="alert alert-warning">'+message+'</div>');
      };

      if ($form[0].checkValidity()) {
        var opts = utils.cbOpts(callback);
        container.save({
          name: $form.find('input').val()
        }, opts);
      }

      function callback (err) {
        if (err === 'a shared runnable by that name already exists') {
          return showError('<strong>That name is taken!</strong> Try something else.');
        }
        else if (err) {
          return showError(err);
        }
        else {
          dialogItself.close();
          self.publishLoader.initLoading('new', self.publishCallback.bind(self));
        }
      }
    };

    self.showPrompt({
      message:
        '<p>Choose a unique name for your project.<br><strong>'+self.model.get('name')+'</strong> already exists.'+
        '<input type="text" class="form-control" name="name" placeholder="Project name" required>',
      actionLabel: 'Save and Publish',
      actionHandler: actionHandler
    });
  }
});

module.exports.id = 'PublishWarning';
