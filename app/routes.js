module.exports = function(match) {
  match('',                     'home#index');
  match('page/:page',           'home#index');
  match('providers',            'home#providers');
  match('about',                'home#about');
  match('jobs',                 'home#jobs');
  match('privacy',              'home#privacy');
  match('logout',               'home#logout');
  match('blob',                 'home#blob');
  match('new',                  'home#new');
  match('new/:channel',         'project#new');
  match('new/:_id',             'project#new');
  match(':_id',                 'project#index');
  match(':_id/:name',           'project#index');
  match(':_id/:name/:action',   'project#index');
  match(':channel',             'channel#index');
  match(':channel/page/:page',  'channel#index');
};
