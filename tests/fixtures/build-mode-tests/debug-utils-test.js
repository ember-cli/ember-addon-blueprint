import { test, module } from 'qunit';
import { assert } from '@ember/debug';
import { DEBUG } from '@glimmer/env';
import { isDevelopingApp, isTesting } from '@embroider/macros';

module('debug utils remain in the build', function () {
  test('assert', function(qAssert) {
    // If we get the build mode wrong, e.g.: `NODE_ENV` != 'development'
    //   then the assert won't exist, causing qAssert to not detect a thrown Error 
    qAssert.throws(() => {
      assert('should throw');
    }, /should throw/, `The error "should throw" is thrown`);

  });

  test('DEBUG', function (assert) {
    if (DEBUG) {
      assert.step('DEBUG');
    }

    assert.verifySteps(['DEBUG']);
  });

  test('isTesting', function (assert) {
    assert.strictEqual(isTesting(), true, `isTesting() === true`);
  });

  test('isDevelopingApp', function (assert) {
    assert.strictEqual(isDevelopingApp(), true, `isDevelopingApp() === true`);
  });
});
