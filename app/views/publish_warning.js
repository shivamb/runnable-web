var _ = require('underscore');
var BaseView = require('./base_view');
var utils = require('../utils');
var PublishRequestModal = require('./publish_request_modal');
var SignupModal = require('./signup_modal');


module.exports = BaseView.extend({
  events: {
    'click #pubwarn-new-button' : 'publishNew',
    'click #pubwarn-back-button': 'publishBack',
    'click #pubwarn-request-button' : 'openPublishRequest'
  },
  className: 'status-bar',
  postHydrate: function () {
    // rerender on login/logout
    this.listenTo(this.app.user, 'change:permission_level', this.render.bind(this));
  },
  getTemplateData: function () {
    this.options.user = this.app.user;
    return this.options;
  },
  postRender: function () {
    this.$pubNew = $('#pubwarn-new-button');
    this.$pubBack = $('#pubwarn-back-button');
  },
  publishNew: function () {
    this.publishLoader = _.findWhere(this.childViews, {name:'publish_loader'});
    this.publishLoader.initLoading('new', this.publishCallback.bind(this));
    this.$pubNew.attr('disabled', 'disabled');
  },
  publishBack: function () {
    this.publishLoader = _.findWhere(this.childViews, {name:'publish_loader'});
    this.publishLoader.initLoading('back', this.publishCallback.bind(this));
    this.$pubBack.attr('disabled', 'disabled');
  },
  openPublishRequest: function (evt) {
    evt.preventDefault();
    // var publishRequestModal = new PublishRequestModal({app:this.app});
    // publishRequestModal.open();
    this.openLogin();
  },
  openLogin: function () {
    var user = this.app.user;
    var router = this.app.router;
    var href = window.location.pathname;
    var signupModal = new SignupModal({
      app    : this.app,
      onClose: this.stopListening.bind(this, user)
    });
    this.listenToOnce(user, 'change:username', router.navigate.bind(router, href, {trigger:true}));
    signupModal.open();
  },
  publishCallback: function (err, image) {
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
    else {
      this.app.router.navigate('/'+image.id, true);
    }
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
      }

      if ($form[0].checkValidity()) {
        var opts = utils.cbOpts(callback);
        container.save({
          name: $form.find('input').val()
        }, opts);
      }

      function callback (err) {
        if (err === 'a shared runnable by that name already exists') {
          return showError('<strong>That name is taken!</strong> Try something else.')
        }
        else if (err) {
          return showError(err);
        }
        else {
          dialogItself.close();
          self.publishLoader.initLoading('new', function () {
            self.app.router.navigate('/'+image.id, true);
          });
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
  },
  testLoader: function(){
    $('#page-loader').hide();
    $('#publish-loader').show();
  }
});

module.exports.id = 'PublishWarning';
