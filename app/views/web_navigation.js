var BaseView = require('./base_view');

module.exports = BaseView.extend({
  tagName: 'header',
  id:"primary",
  events: {
    'click #output-reload' : 'refresh',
    'submit form'          : 'enter'
  },
  postHydrate: function () {
    this.history = [];
    this.options.currentUrl = '';
  },
  backButtonState: function () {
    if (this.history.length === 0) {
      this.$('.back-button').attr('disabled','disabled');
    }
    else {
      this.$('.back-button').removeAttr('disabled');
    }
  },
  postRender: function () {
    // cache jq elements
    this.$back = this.$('.back-button');
    this.$refresh = this.$('.refresh-button');
    this.$address = this.$('.address-bar');
  },
  setAddress: function (address) {
    if (address[0] == '/') address = address.slice(1);
    this.$address.val(address);
  },
  back: function () {
    var url = this.history.pop();
    if (url) {
      this.setAddress(url);
      this.trigger('change:url', url);
    }
    this.backButtonState();
  },
  refresh: function () {
    this.trigger('change:url', this.options.currentUrl);
  },
  enter: function (evt) {
    evt.preventDefault();
    var opts = this.options;
    var url = this.$address.val();
    this.history.push(opts.currentUrl);
    opts.currentUrl = url;
    this.trigger('change:url', url);
  }
});

module.exports.id = "WebNavigation";
