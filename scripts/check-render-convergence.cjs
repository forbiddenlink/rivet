// Offline check of React's actual render-phase value/updater semantics.
const assert = require('node:assert/strict')
const React = require('../apps/web/node_modules/react')
const { renderToString } = require('../apps/web/node_modules/react-dom/server')
function Guard({ value }) {
  const [previous, setPrevious] = React.useState(null)
  if (previous !== value) setPrevious(value)
  return React.createElement('span', null, 'settled')
}
for (const value of [NaN, () => 'result']) {
  assert.throws(() => renderToString(React.createElement(Guard, { value })), /Too many re-renders/)
}
for (const value of ['key', false, 42, null, JSON.stringify([NaN, 'finding'])]) {
  assert.equal(renderToString(React.createElement(Guard, { value })), '<span>settled</span>')
}
console.log('React runtime: function and NaN loop; five supported primitive targets settle.')
