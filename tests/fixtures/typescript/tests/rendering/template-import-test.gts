import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render } from '@ember/test-helpers';

import TemplateImport from 'my-addon/components/template-import';

module('Rendering | template-import', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders', async function(assert) {
    await render(<template><TemplateImport @saying="what" /></template>);

    assert.dom().hasText('Hello from a GTS file but also Hello from a template-only component and Hello from another GTS file!');
  })
});
