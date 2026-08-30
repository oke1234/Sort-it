const test = require("node:test");
const assert = require("node:assert/strict");
const babel = require("@babel/core");
const vm = require("node:vm");

const loadAppModule = (file, localRequire) => {
  const code = babel.transformFileSync(file, {
    presets: ["babel-preset-expo"],
  }).code;
  const module = { exports: {} };
  const wrapper = vm.runInThisContext(
    `(function(require,module,exports){${code}\n})`
  );
  wrapper(localRequire, module, module.exports);
  return module.exports;
};

const shoppingData = loadAppModule("./shoppingData.js", () => ({}));
const categoryService = loadAppModule("./categoryService.js", (id) => {
  if (id === "./shoppingData") return shoppingData;
  return require(id);
});

const cases = [
  ["fruit", "Lidl", "Groente en fruit"],
  ["ui", "Lidl", "Groente en fruit"],
  ["beschuit", "Jumbo", "Brood"],
  ["volkorenbrood", "Jumbo", "Brood"],
  ["pindakaas", "Lidl", "Ontbijt"],
  ["roomijs", "Jumbo", "Diepvries"],
  ["ijsbergsla", "Jumbo", "Groente en fruit"],
  ["rijst", "Jumbo", "Pasta en rijst"],
  ["cola", "Lidl", "Dranken"],
  ["spaghetti", "Aldi", "Pasta, rijst en conserven"],
  ["kikkererwten", "Aldi", "Pasta, rijst en conserven"],
  ["tonijn in blik", "Jumbo", "Conserven"],
  ["tonijn", "Jumbo", "Vlees en vis"],
  ["chocolademelk", "Jumbo", "Koeling en zuivel"],
  ["tomatensaus", "Jumbo", "Sauzen en kruiden"],
  ["schoonmaakazijn", "Jumbo", "Huishouden"],
  ["rijstwafels", "Jumbo", "Snacks en snoep"],
  ["diepvries spinazie", "Jumbo", "Diepvries"],
  ["batterijen", "Lidl", "Non-food"],
  ["boeket bloemen", "Jumbo", "Bloemen en planten"],
  ["iets onbekends", "Jumbo", "Overig"],
];

for (const [name, store, expected] of cases) {
  test(`${name} komt bij ${store} in ${expected}`, async () => {
    assert.equal(
      await categoryService.getCategory(name, store),
      expected
    );
  });
}
