var BaseView = require('./base_view');
var utils = require('../utils');

module.exports = BaseView.extend({
  id: 'publish-loader',
  className: 'overlay-loader with-text',
  events: {
    'click a' : 'refresh'
  },
  postRender: function () {
    var i = 1, self = this, status = this.model.get('status');
    this.$('h1:first-child').addClass('in');

    if (status !== 'Editing' && status !== 'Draft' && status !== undefined) {
      this.$el.addClass('loading');
      this.progress(status);
    }

    var primus = new Primus('http://cybertron.' + this.app.get('domain'), {
      transformer: 'engine.io'
    });
    var progress = this.model.get('servicesToken') + ':progress';
    primus.substream(progress).on('data', this.progress.bind(this));
    primus.substream('subscriptions').write(progress);

  },
  initLoading: function (type, cb) {
    var opts = utils.cbOpts(callback, this);
    opts.patch = true;
    var data = {
      status: 'Committing ' + type
    };
    this.$el.addClass('loading');
    this.model.save(data, opts);
    function callback (err, model) {
      if (err) {
        this.$el.removeClass('loading');
        cb(err);
      } else {
        cb();
      }
    }
  },
  stoppedVirtualMachine: function () {
    this.options.step2 = true;
    this.render();
  },
  progress: function (name) {
    var step = {
      'Stopping Virtual Machine': 1,
      'Saving Changes': 2,
      'Optimizing': 3,
      'Distributing': 4
    }[name];
    if (step) {
      this.$('h1.in').prop('class','out');
      this.$('h1:nth-child(' + step + ')').addClass('in');
    }
  },
  refresh: function () {
    window.location.reload();
  }
});

module.exports.id = "PublishLoader";
