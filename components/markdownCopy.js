// Copy-pasted from the markdown-it-code-copy plugin
import _ from "lodash";

try {
  // Node js will throw an error
  this === window;

  const Clipboard = require("clipboard");
  new Clipboard(".markdown-it-code-copy");
} catch (_err) {}

const defaultOptions = {
  iconStyle: "font-size: 21px; opacity: 0.4;",
  iconClass: "mdi mdi-content-copy",
  buttonStyle:
    "position: absolute; top: 7.5px; right: 6px; cursor: pointer; outline: none;",
  buttonClass: "",
};

function renderCode(origRule, options) {
  options = _.merge(defaultOptions, options);
  return (...args) => {
    const [tokens, idx] = args;
    const content = tokens[idx].content
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
    const origRendered = origRule(...args);

    if (content.length === 0) return origRendered;

    return `
<div style="position: relative">
	${origRendered}
	<button class="markdown-it-code-copy ${options.buttonClass}" data-clipboard-text="${content}" style="${options.buttonStyle}" title="Copy">
		<span style="${options.iconStyle}" class="${options.iconClass}"></span>
	</button>
</div>
`;
  };
}

module.exports = (md, options) => {
  md.renderer.rules.code_block = renderCode(
    md.renderer.rules.code_block,
    options
  );
  md.renderer.rules.fence = renderCode(md.renderer.rules.fence, options);
};
