var _ = require('underscore');
var async = require('async');
var helpers = require('./helpers');
var utils = require('../utils');
var fetch = helpers.fetch;
var Channel = require('../models/channel');

var fetchOwnersFor = helpers.fetchOwnersFor;
var fetchUserAndChannel = helpers.fetchUserAndChannel;
var fetchChannelContents = helpers.fetchChannelContents;
var canonical = helpers.canonical;
var formatTitle = helpers.formatTitle;

module.exports = {
  index: function(params, callback) {
    var self = this;
    async.waterfall([
      fetchUserAndChannel.bind(this, params.channel),
      function redirectCheck (channelResult, cb) {
        var channelName = channelResult.channel.get('name');
        if (channelName !== params.channel) {
          var url = '/'+ channelName + ((params.page) ? '/page/'+params.page : '');
          self.redirectTo(url);
        }
        else {
          cb(null, channelResult);
        }
      },
      function (channelResult, cb) {
        fetchChannelContents.call(self, params.channel, params.page, function (err, results) {
          cb(err, !err && _.extend(results, channelResult, {page:params.page}));
        });
      }.bind(this),
      function (results, cb) {
        if (results.images.length === 0) {
          cb(null, results);
        } else {
          fetchOwnersFor.call(self, results.images, function (err, ownerResults) {
            cb(err, !err && _.extend(results, ownerResults));
          });
        }
      },
      function addSEO (results, cb) {
        var pageText = (params.page) ? " Page "+params.page : "";
        results.page = {
          title: formatTitle(results.channel.get('name')+" code"+pageText),
          canonical: canonical.call(self)
        };
        cb(null, results);
      }
    ], callback);
  },
  runnable: function (params) {
    this.redirectTo(params._id +'/'+ params.name);
  },
  category: function (params, callback) {
    params.category = params.category || 'Featured';
    var spec = {
      user: {
        model: 'User',
        params: {
          _id: 'me'
        }
      },
      channels: {
        collection: 'Channels',
        params: {
          category: params.category
        }
      },
      categories: {
        collection: 'Categories'
      }
    };
    fetch.call(this, spec, function (err, results) {
      if (err) { callback(err); } else {
        results.selectedCategoryLower = params.category.toLowerCase();
        results.selectedCategory = _.find(results.categories.models, function (category) {
          return category.get('name').toLowerCase() === results.selectedCategoryLower;
        });
        callback(null, addSEO(results));
      }
    });
    function addSEO (results) {
      var channel = params.channel;
      var category = params.category;
      var channelAndOrCategory = channel? channel+' in '+category : category;
      return _.extend(results, {
        page: {
          title: formatTitle(channelAndOrCategory+" Related Tags"),
          canonical: 'http://runnable.com/c/'+params.category
        }
      });
    }
  },
  all: function(params, callback) {
    var self = this;
    var spec = {
      user    : {
        model  : 'User',
        params : {
          _id: 'me'
        }
      },
      images: {
        collection : 'Images',
        params     : {
          sort: 'votes',
          page: (params.page && params.page-1) || 0
        }
      },
      channels: {
        collection : 'Channels',
        params     : {}
      }
    };
    async.waterfall([
      fetch.bind(this, spec),
      function owners (results, cb) {
        if (results.images.length) {
          fetchOwnersFor.call(self, results.images, function (err, ownerResults) {
            cb(err, !err && _.extend(results, ownerResults));
          });
        }
        else { cb(null, results); }
      },
      function extend (results, cb) {
        results.channel = new Channel({name:'All'}, {app:self.app});
        var pageText = (params.page) ? " Page "+params.page : "";
        results.page = {
          title: formatTitle('Runnable code for JQuery, Codeigniter, NodeJS, PHP, Python and more'+pageText),
          description: 'Runnable code for '+utils.tagsToString(results.channels.toJSON(), 'and'),
          canonical: canonical.call(self)
        };
        cb(null, results);
      }
    ],
    function (err, results) {
      callback(err, 'channel/index', results);
    });
  }
};
