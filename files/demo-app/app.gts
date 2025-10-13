import EmberApp from 'ember-strict-application-resolver';
import EmberRouter from '@ember/routing/router';
import PageTitleService from 'ember-page-title/services/page-title';

class Router extends EmberRouter {
  location = 'history';
  rootURL = '/';
}

export class App extends EmberApp {
  /**
  * Any services or anything from the addon that needs to be in the app-tree registry
  * will need to be manually specified here.
  *
  * Techniques to avoid needing this:
  * - private services
  * - require the consuming app import and configure themselves
  *   (which is what we're emulating here)
  */
  modules = {
    './router': Router,
    './services/page-title': PageTitleService,
      /**
        * NOTE: this glob will import everything matching the glob,
        *     and includes non-services in the services directory.
        */
    ...import.meta.glob('./services/**/*', { eager: true }),
    ...import.meta.glob('./templates/**/*', { eager: true }),
  };
}

Router.map(function() { });
