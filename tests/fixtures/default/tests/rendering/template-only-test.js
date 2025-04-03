import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';

module('Rendering | template-only', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    await render(<template><TemplateOnly /></template>);

    assert.dom().hasText('Hello from a template-only component');
  })
});
