import EmberApp from '@ember/application';
import Resolver from 'ember-resolver';
import EmberRouter from '@ember/routing/router';

class Router extends EmberRouter {
  location = 'none';
  rootURL = '/';
}

class TestApp extends EmberApp {
  modulePrefix = 'test-app';
  Resolver = Resolver.withModules({
    'test-app/router': { default: Router },
    // add any custom services here
  });
}

Router.map(function () {});

import * as QUnit from 'qunit';
import { setApplication, getSettledState } from '@ember/test-helpers';
import { setup } from 'qunit-dom';
import { getPendingWaiterState } from '@ember/test-waiters';
import { start as qunitStart, setupEmberOnerrorValidation } from 'ember-qunit';

Object.assign(window, {
  getSettledState,
  getPendingWaiterState,
  snapshotTimers: (label?: string) => {
    const result = JSON.parse(
      JSON.stringify({
        settled: getSettledState(),
        waiters: getPendingWaiterState(),
      })
    );

    console.debug(label ?? 'snapshotTimers', result);

    return result;
  },
});

export function start() {
  setApplication(
    TestApp.create({
      autoboot: false,
      rootElement: '#ember-testing',
    }),
  );
  setup(QUnit.assert);
  setupEmberOnerrorValidation();
  qunitStart();
}
