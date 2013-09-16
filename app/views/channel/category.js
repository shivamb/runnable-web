var BaseView = require('../base_view');
var utils = require('../../utils');

module.exports = BaseView.extend({
  getTemplateData: function () {
    this.options.categories.models.forEach(function (category) {
      attribs = category.attributes;
      attribs.link = '/c/'+attribs.name;
    });
    return this.options;
  },
  postRender: function () {
    this.textEffect();
    this.imageTile();
  },
  textEffect: function () {
    this.$('#home-header h1 div').textillate({
      // the default selector to use when detecting multiple texts to animate
      selector: '.texts',

      // enable looping
      loop: true,

      // sets the minimum display time for each text before it is replaced
      minDisplayTime: 2000,

      // sets the initial delay before starting the animation
      // (note that depending on the in effect you may need to manually apply
      // visibility: hidden to the element before running this plugin)
      initialDelay: 0,

      // set whether or not to automatically start animating
      autoStart: true,

      // custom set of 'in' effects. This effects whether or not the
      // character is shown/hidden before or after an animation
      inEffects: [],

      // custom set of 'out' effects
      outEffects: [ 'hinge' ],

      // in animation settings
      in: {
      // set the effect name
      effect: 'fadeInDown',

      // set the delay factor applied to each consecutive character
      delayScale: 0,

      // set the delay between each character
      delay: 50,

      // set to true to animate all the characters at the same time
      sync: false,

      // randomize the character sequence
      // (note that shuffle doesn't make sense with sync = true)
      shuffle: false
      },

      // out animation settings.
      out: {
        effect: 'fadeOutDown',
        delayScale: 0,
        delay: 50,
        sync: false,
        shuffle: false,
      }
    });
  },
  imageTile: function () {
    var $bubbles = this.$('.bubbles');
    utils.allImagesLoaded($bubbles.find('img'), function () {
      $bubbles.isotope({
        itemSelector : 'img',
        layoutMode   : 'masonry',
        itemPositionDataEnabled : true,
        transformsEnabled       : false,
        onLayout : function(){
          $bubbles.find('.bubble').addClass('hero-animate');
        }
      });
    });
  }
});

module.exports.id = "channel/category";
