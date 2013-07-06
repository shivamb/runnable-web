var BaseView = require('./base_view');
var _ = require('underscore');
var FileMenu = require('./file_menu');

var Super = BaseView.prototype;
module.exports = BaseView.extend({
  tagName: 'li',
  className: 'folder',
  events: {
    'click span.dir' : 'toggle'
  },
  getTemplateData: function () {
    // be careful postHydrate has only been called before frontend render but not backend!
    // this means, the only data you can rely on is this.model and this.options binded to this view.
    return {
      name = this.options.name;
      collection = this.options.collection
    }
  },
  postRender: function () {
    //todo: remove display-none

    // clientside postHydrate and getTemplateData have occured.
    if (this.dir.get('open')) this.$el.addClass('open');
    this.$contentsUL = this.$('ul').first();
    // alert("Get here "+ );
    // droppable
    this.$el.droppable({
      greedy: true,
      drop: this.onDrop.bind(this),
      hoverClass: 'drop-hover'
    });
  },
  slideUpHeight: function () {
    this.$el.removeClass('open');
    this.$contentsUL.slideUp(200, function () {
      this.animating = false;
    }.bind(this));
  },
  slideDownHeight: function () {
    this.$el.addClass('open');
    this.$contentsUL.slideDown(200, function () {
      this.animating = false;
    }.bind(this));
  },
  toggle: function (evt) {
    var clickedId = $(evt.currentTarget).data('id');
    if (this.dir.id == clickedId && !this.animating) {
      this.animating = true;
      if (this.dir.get('open')) {
        this.close();
      }
      else {
        this.open();
      }
    }
    return this;
  },
  open: function () {
    this.dir.set('open', true);
    this.slideDownHeight();
    // fetch the dir contents if not fetched.
    var self = this;
    if (this.dir.isNew()) {
      this.dir.fetch({
        success: function () {
          // console.log("Just got back from fetching the dir", dir.contents());
        },
        error: function () {
          alert('error');
        }
      });
    }
  },
  close: function () {
    this.dir.set('open', false);
    this.slideUpHeight();
  },
  onDrop: function (evt, ui) {
    evt.preventDefault();
    evt.stopPropagation();
    this.$el.removeClass('drop-hover');
    var self = this;
    var $itemDropped = $(ui.draggable).find('[data-id]');
    var fsPath = $itemDropped.data('id');
    if (fsPath) {
      // this._forkIfUserIsNotProjectOwner(function (err, data) {
      // TODO!
        // if (err) {
        //   self.displayErrorIfExists('Error moving.');
        // }
        // else{
          console.log(fsPath);
          self.dir.moveIn(fsPath, function (err) {
            self.displayErrorIfExists(err);
          });
        // }
      // });
    }
  },
  displayErrorIfExists: function (err) {
    if (err) alert(err.message || err);
  }
});

module.exports.id = "FileTree";
