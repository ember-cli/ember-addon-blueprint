import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';

import CoLocated from 'my-addon/components/co-located.js';
import CoLocatedTs from 'my-addon/components/co-located-ts.js';

module('Rendering | co-located', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders a JS component', async function (assert) {
    await render(<template><CoLocated /></template>);

    assert.dom().hasText('Hello, from a co-located component');
  });

  test('it renders a TS component', async function (assert) {
    await render(<template><CoLocatedTs /></template>);

    assert.dom().containsText('Hello, from a co-located TS component (in TypeScript)');
  });
});
