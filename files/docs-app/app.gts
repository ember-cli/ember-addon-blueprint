import EmberApp from 'ember-strict-application-resolver';
import EmberRouter from '@ember/routing/router';
import PageTitleService from 'ember-page-title/services/page-title';

class Router extends EmberRouter {
  location = 'history';
  rootURL = '/';
}

export const docsAppRegistry = {
  './router': Router,
  './services/page-title': PageTitleService,
  // add any custom services here
  // import.meta.glob('./services/*', { eager: true }),
}

export class App extends EmberApp {
  modules = docsAppRegistry;
}

Router.map(function() { });
