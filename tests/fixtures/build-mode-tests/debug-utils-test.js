import { test, module } from 'qunit';
import { assert } from '@ember/debug';

module('debug utils remain in the build', function () {
  test('debug utils work in tests', function(qAssert) {
    qAssert.throws(() => {
      assert('it works', false);
    }, 'it works');
  });
});
