const stringUtil = require('ember-cli-string-utils');

function invocationFor(options) {
  let parts = options.entity.name.split('/');
  return parts.map((p) => stringUtil.classify(p)).join('::');
}


module.exports = {
  locals: function (options) {
    let templateInvocation = invocationFor(options);
    let componentName = templateInvocation;
    let openComponent = (descriptor) => `<${descriptor}>`;
    let closeComponent = (descriptor) => `</${descriptor}>`;
    let selfCloseComponent = (descriptor) => `<${descriptor} />`;

    return {
      name: options.project.name(),
      componentName,
      openComponent,
      closeComponent,
      selfCloseComponent,
    };
  }
}