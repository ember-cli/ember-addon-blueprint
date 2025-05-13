import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';
import CoLocated from "addon-name/components/co-located";

module('Rendering | co-located', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    await render(<template><CoLocated /></template>);

    assert.dom().hasText('Hello, from a co-located component');
  })
});
