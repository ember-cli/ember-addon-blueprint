import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'ember-qunit';

import <%= componentName %> from '../../../src/components/<%= name %>';

module('Integration | Component | <%= name %>', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function (assert) {
    await render(<template><%= selfCloseComponent(componentName) %></template>);

    assert.dom().hasText('');

    // Template block usage:
    await render(<template>
      <%= openComponent(componentName) %>
        template block text
      <%= closeComponent(componentName) %>
    </template>);

    assert.dom().hasText('template block text');
  });
});