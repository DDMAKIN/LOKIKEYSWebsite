const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");

// Run component event handlers with isolated hook state, without a browser or extra dependencies.
function harness() {
  const timers = [];
  let state = [],
    cursor = 0;
  const hooks = {
    ...React,
    useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = typeof initial === "function" ? initial() : initial;
      return [
        state[index],
        (value) => {
          state[index] = typeof value === "function" ? value(state[index]) : value;
        },
      ];
    },
    useEffect() {},
    useRef() {
      return { current: null };
    },
  };
  const cache = {};
  function load(path) {
    if (cache[path]) return cache[path];
    const exports = {};
    const code = ts.transpileModule(fs.readFileSync(path, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText;
    vm.runInNewContext(code, {
      exports,
      setTimeout: (callback) => {
        timers.push(callback);
        return timers.length;
      },
      clearTimeout() {},
      window: { matchMedia: () => ({ matches: false }) },
      require: (name) =>
        name === "react"
          ? hooks
          : name === "./ShoppingTools"
            ? load("src/ShoppingTools.tsx")
            : name === "./RewardWheel"
              ? load("src/RewardWheel.tsx")
              : name === "./CyberCore"
                ? load("src/CyberCore.tsx")
                : require(name),
    });
    cache[path] = exports;
    return exports;
  }
  return {
    load,
    finishTimers() {
      timers.splice(0).forEach((callback) => callback());
    },
    render(component, props) {
      cursor = 0;
      return component(props);
    },
  };
}
function nodes(tree) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  return [tree, ...nodes(tree.props?.children)];
}
function text(tree) {
  if (tree == null || typeof tree === "boolean") return "";
  if (typeof tree !== "object") return String(tree);
  return (Array.isArray(tree) ? tree : [tree.props?.children]).map(text).join("");
}
const find = (tree, predicate) => {
  const result = nodes(tree).find(predicate);
  assert.ok(result, "Expected control exists");
  return result;
};

test("live filters, reset, and empty-result state", () => {
  const h = harness(),
    App = h.load("src/App.tsx").default;
  const render = () => h.render(App);
  let tree = render();
  assert.equal(nodes(tree).filter((n) => n.props?.className === "product-card").length, 4);
  find(tree, (n) => n.props?.id === "platform-filter").props.onChange({
    target: { value: "macOS" },
  });
  tree = render();
  find(tree, (n) => n.props?.id === "budget-filter").props.onChange({ target: { value: "30" } });
  tree = render();
  assert.equal(nodes(tree).filter((n) => n.props?.className === "product-card").length, 2);
  find(tree, (n) => n.props?.id === "product-search").props.onChange({
    target: { value: "not-a-product" },
  });
  assert.ok(text(render()).includes("No keys found"));
  find(render(), (n) => n.props?.className === "reset-filter").props.onClick();
  assert.equal(nodes(render()).filter((n) => n.props?.className === "product-card").length, 4);
});

test("cyberpunk effects switch controls the page motion mode", () => {
  const h = harness(),
    App = h.load("src/App.tsx").default;
  const render = () => h.render(App);
  assert.ok(!render().props.className.includes("effects-paused"));
  const toggle = find(render(), (n) => n.props?.["aria-label"] === "Animated visual effects");
  assert.equal(toggle.props["aria-pressed"], true);
  toggle.props.onClick();
  assert.ok(render().props.className.includes("effects-paused"));
  const disabled = find(render(), (n) => n.props?.["aria-label"] === "Animated visual effects");
  assert.equal(disabled.props["aria-pressed"], false);
  disabled.props.onClick();
  assert.ok(!render().props.className.includes("effects-paused"));
});

test("wheel geometry lands on every advertised prize and discounts round to cents", () => {
  const h = harness(),
    wheel = h.load("src/RewardWheel.tsx");
  for (let index = 0; index < 6; index++) {
    const prize = wheel.pickReward((index + 0.5) / 6);
    assert.equal(prize.index, index);
    assert.equal((wheel.wheelRotation(index) + index * 60 + 30) % 360, 0);
    assert.equal(prize.percent, wheel.rewards[index]);
  }
  const discounted = wheel.calculateDiscount(43.5, 5);
  assert.equal(discounted.savings, 2.18);
  assert.equal(discounted.total, 41.32);
  assert.equal(wheel.calculateDiscount(0, 20).total, 0);
  assert.equal(wheel.calculateDiscount(100, 20).total, 80);
});

test("spin reward survives closing, applies to bag totals, and can be removed", () => {
  const h = harness(),
    App = h.load("src/App.tsx").default;
  const render = () => h.render(App);
  find(
    render(),
    (n) => n.props?.["aria-label"] === "Add Norton 360 Standard to bag",
  ).props.onClick();
  find(render(), (n) => n.props?.className === "announcement-spin").props.onClick();
  const wheel = find(render(), (n) => n.type?.name === "RewardWheel");
  wheel.props.onSpin();
  wheel.props.onSpin();
  assert.equal(find(render(), (n) => n.type?.name === "RewardWheel").props.spinning, true);
  find(render(), (n) => n.props?.["aria-label"] === "Close dialog").props.onClick();
  h.finishTimers();
  find(render(), (n) => n.props?.className === "announcement-spin").props.onClick();
  const result = find(render(), (n) => n.type?.name === "RewardWheel");
  assert.ok(result.props.reward.percent > 0);
  assert.equal(result.props.spinning, false);
  const firstCode = result.props.reward.code;
  result.props.onSpin();
  h.finishTimers();
  assert.equal(find(render(), (n) => n.type?.name === "RewardWheel").props.reward.code, firstCode);
  result.props.onApply();
  const expected = h
    .load("src/RewardWheel.tsx")
    .calculateDiscount(43.5, result.props.reward.percent);
  assert.ok(text(render()).includes("Preview total"));
  assert.ok(text(render()).includes(`$${expected.total.toFixed(2)}`));
  find(
    render(),
    (n) => n.props?.["aria-label"] === "Increase Norton 360 Standard quantity",
  ).props.onClick();
  const updated = h.load("src/RewardWheel.tsx").calculateDiscount(87, result.props.reward.percent);
  assert.ok(text(render()).includes(`$${updated.total.toFixed(2)}`));
  find(
    render(),
    (n) => n.type === "button" && text(n).includes("Review your order"),
  ).props.onClick();
  assert.ok(text(render()).includes("Preview total (USD)"));
  assert.ok(text(render()).includes(`$${updated.total.toFixed(2)}`));
  find(render(), (n) => n.props?.["aria-label"] === "Close dialog").props.onClick();
  find(render(), (n) => n.props?.className === "bag-button").props.onClick();
  find(render(), (n) => n.props?.["aria-label"] === "Remove reward from bag").props.onClick();
  assert.ok(!text(render()).includes("Preview total"));
});

test("comparison enforces three selections and connects add-to-bag", () => {
  const h = harness(),
    App = h.load("src/App.tsx").default;
  const render = () => h.render(App);
  for (let i = 0; i < 4; i++) {
    nodes(render())
      .filter((n) => n.props?.type === "checkbox")
      [i].props.onChange();
  }
  let tree = render();
  assert.equal(
    nodes(tree).filter((n) => n.props?.type === "checkbox" && n.props.checked).length,
    3,
  );
  assert.ok(text(tree).includes("Compare up to 3 products"));
  find(tree, (n) => n.type === "button" && text(n).includes("Compare (3)")).props.onClick();
  tree = render();
  const comparison = find(tree, (n) => n.type?.name === "ProductComparison");
  assert.equal(comparison.props.products.length, 3);
  comparison.props.onAdd(comparison.props.products[0]);
  const updated = find(render(), (n) => n.type?.name === "ProductComparison");
  assert.equal(updated.props.cart[comparison.props.products[0].id], 1);
  find(render(), (n) => n.props?.["aria-label"] === "Close dialog").props.onClick();
  assert.ok(nodes(render()).some((n) => n.props?.className === "compare-tray"));
});

test("finder steps produce relevant matches and can restart", () => {
  const h = harness(),
    tools = h.load("src/ShoppingTools.tsx");
  const fixture = [
    {
      id: 1,
      name: "Office",
      brand: "Microsoft",
      category: "Office & Productivity",
      platforms: "Windows & macOS",
      price: 29,
      devices: "1 PC",
      term: "One-time purchase",
    },
  ];
  let selected;
  const render = () =>
    h.render(tools.SoftwareFinder, {
      products: fixture,
      onSelect: (p) => {
        selected = p;
      },
    });
  assert.equal(
    find(render(), (n) => n.type === "button" && text(n).includes("Next step")).props.disabled,
    true,
  );
  for (const answer of ["Get things done", "macOS", "Under $30"]) {
    find(render(), (n) => n.type === "button" && text(n).includes(answer)).props.onClick();
    find(
      render(),
      (n) => n.type === "button" && /Next step|Find my matches/.test(text(n)),
    ).props.onClick();
  }
  assert.ok(text(render()).includes("Meet your matches"));
  find(render(), (n) => n.type === "button" && text(n).includes("Office")).props.onClick();
  assert.equal(selected.id, 1);
  assert.equal(tools.getRecommendations(fixture, ["Antivirus", "iOS", "30"]).length, 0);
  find(render(), (n) => n.type === "button" && text(n).includes("Start again")).props.onClick();
  assert.ok(text(render()).includes("What’s on your agenda?"));
});
