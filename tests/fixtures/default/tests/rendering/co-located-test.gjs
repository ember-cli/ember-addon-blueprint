import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';

import { default as CoLocated } from 'my-addon/components/co-located';

module('Rendering | co-located', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    await render(<template>
      <CoLocated />
    </template>
    );

    assert.dom().hasText('Hello, from a co-located component');
  })
});
