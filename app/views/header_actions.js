var BaseView = require('./base_view');
var LoginModal = require('./login_modal');
var PublishRequestModal = require('./publish_request_modal');

module.exports = BaseView.extend({
  tagName: 'ul',
  className: 'nav nav-pills navbar-right',
  events: {
    'click #header-login-link' : 'openLogin'
  },
  postHydrate: function () {
    this.listenTo(this.model, 'change:username', this.render.bind(this));
  },
  openLogin: function (evt) {
    evt.preventDefault();
    var loginModal = new LoginModal({ app:this.app });
    loginModal.open();
  }
});

module.exports.id = "HeaderActions";
