var BaseView = require('./base_view');
var _ = require('underscore');
var utils = require('../utils');
var queryString = require('query-string');

module.exports = BaseView.extend({
  currentUrl: '',
  preRender: function () {
    this.currentUrl = utils.getCurrentUrlPath(this.app);
    console.log(this.currentUrl); 
    if(this.currentUrl.split('?').length){
      var q = this.currentUrl.split('?')[1];
      this.qs = queryString.parse(q);
    } else {
      this.qs = {};
    }
    if(_.isUndefined(this.qs.page))
      this.qs.page = 0;
    if(_.isString(this.qs.page)){
      this.qs.page = parseInt(this.qs.page);
      if(_.isNaN(this.qs.page))
        this.qs.page = 0;
    }
  },
  getTemplateData: function() {
    this.pageLinks(this.options);
    return this.options;
  },
  pageLinks: function (opts) {
    
    var collectionParams      = this.collection.params || {};
    collectionParams.page     = parseInt(collectionParams.page);
    collectionParams.lastPage = parseInt(collectionParams.lastPage);

    opts.humanCurrentPage  = collectionParams.page + 1;
    opts.humanPreviousPage = opts.humanCurrentPage - 1;
    opts.humanNextPage     = opts.humanCurrentPage + 1;
    opts.humanLastPage     = collectionParams.lastPage + 1;

    opts.prevQueryString  = _.extend({}, this.qs);
    opts.nextQueryString  = _.extend({}, this.qs);
    opts.indexQueryString = _.extend({}, this.qs);
    opts.lastQueryString  = _.extend({}, this.qs);
    
    opts.showPrevLink = false;
    opts.showNextLink = false;
    opts.showLeftElipsis  = true;
    opts.showRightElipsis = true;

    if (this.qs.page > 0) {
      opts.showPrevLink = true;
      opts.prevQueryString.page--;
      opts.indexQueryString.page = 0;
    }
    if (this.qs.page < collectionParams.lastPage) {
      opts.showNextLink = true;
      opts.nextQueryString.page++;
      opts.lastQueryString.page = collectionParams.lastPage;
    }
    if (this.qs.page == 1) {
      opts.showLeftElipsis = false;
    }
    if (this.qs.page === opts.lastQueryString.page - 1) {
      opts.showRightElipsis = false;
    }

    ['prev', 'next', 'index', 'last'].forEach(function (val) {
      var t = opts[val + 'QueryString'];
      t.orderBy = opts.orderByParam;
      opts[val + 'QueryString'] = '/?' + queryString.stringify(t);
    }, this);

  }
});

module.exports.id = "PaginationButtons";
