import { test, module } from 'qunit';
import { assert } from '@ember/debug';

module('debug utils remain in the build', function () {
  test('debug utils work in tests', function(qAssert) {
    qAssert.throws(() => {
      // If we get the build mode wrong, e.g.: `NODE_ENV` != 'development'
      //   then the assert will be stripped and qAssert will not detect an error being thrown
      assert('it works', false);
    }, 'it works');
  });
});
