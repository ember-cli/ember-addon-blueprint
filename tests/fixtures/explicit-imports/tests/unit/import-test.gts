import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'ember-qunit';

import * as myModule from 'my-addon';

module('imports', function () {
  test('did they work', function (assert) {
    assert.ok(myModule.MyService);
    assert.ok(myModule.JSComponent);
    assert.ok(myModule.TSComponent);
    assert.ok(myModule.TemplateOnly);
  });

  module('rendering', function (hooks) {
    setupRenderingTest(hooks);

    test('JSComponent can render', async function (assert) {
      await render(<template><myModule.JSComponent /></template>);

      assert.dom().hasText('nested: JS');
    });

    test('TSComponent can render', async function (assert) {
      await render(<template><myModule.TSComponent /></template>);

      assert.dom().hasText('nested: TS');
    });

    test('TemplateOnly can render', async function (assert) {
      await render(<template><myModule.TemplateOnly /></template>);

      assert.dom().hasText('this is a template-only component');
    });
  });
});
