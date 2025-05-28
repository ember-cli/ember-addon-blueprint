import Component from '@glimmer/component';
import { on } from '@ember/modifier';

export default class TemplateImport extends Component {
  <template>
    Hello from a GJS file

    <button {{on "click" this.saySomething}} type="button"></button>
  </template>

  saySomething() {
    console.log("something");
  }
}
