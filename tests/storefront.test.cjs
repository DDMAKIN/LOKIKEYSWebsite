const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");

// Run component event handlers with isolated hook state, without a browser or extra dependencies.
function harness(stubs = {}) {
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
    const code = ts
      .transpileModule(fs.readFileSync(path, "utf8"), {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          jsx: ts.JsxEmit.ReactJSX,
          target: ts.ScriptTarget.ES2020,
        },
      })
      .outputText.replace(/import\.meta\.env/g, "(globalThis.__env || {})");
    vm.runInNewContext(code, {
      exports,
      setTimeout: (callback) => {
        timers.push(callback);
        return timers.length;
      },
      clearTimeout() {},
      window: stubs.window || { matchMedia: () => ({ matches: false }) },
      require: (name) => {
        if (name === "react") return hooks;
        if (stubs[name]) return stubs[name];
        if (name.startsWith("./")) {
          const base = "src/" + name.slice(2);
          return load(fs.existsSync(base + ".tsx") ? base + ".tsx" : base + ".ts");
        }
        return require(name);
      },
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
  assert.equal(nodes(tree).filter((n) => n.props?.className === "product-card").length, 5);
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
    .calculateDiscount(29.95, result.props.reward.percent);
  assert.ok(text(render()).includes("Estimated total"));
  assert.ok(text(render()).includes(`$${expected.total.toFixed(2)}`));
  find(
    render(),
    (n) => n.props?.["aria-label"] === "Increase Norton 360 Standard quantity",
  ).props.onClick();
  const updated = h
    .load("src/RewardWheel.tsx")
    .calculateDiscount(59.9, result.props.reward.percent);
  assert.ok(text(render()).includes(`$${updated.total.toFixed(2)}`));
  find(
    render(),
    (n) => n.type === "button" && text(n).includes("Review your order"),
  ).props.onClick();
  assert.ok(text(render()).includes("Estimated total (USD)"));
  assert.ok(text(render()).includes(`$${updated.total.toFixed(2)}`));
  find(render(), (n) => n.props?.["aria-label"] === "Close dialog").props.onClick();
  find(render(), (n) => n.props?.className === "bag-button").props.onClick();
  find(render(), (n) => n.props?.["aria-label"] === "Remove reward from bag").props.onClick();
  assert.ok(!text(render()).includes("Estimated total"));
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

test("every product maps to a unique Wix plan with a stated region", () => {
  const { products, MAX_BUDGET } = harness().load("src/catalog.ts");
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
  assert.ok(products.length >= 20);
  assert.equal(new Set(products.map((p) => p.id)).size, products.length);
  assert.equal(new Set(products.map((p) => p.name)).size, products.length);
  assert.equal(new Set(products.map((p) => p.wixVariantId)).size, products.length);
  for (const p of products) {
    assert.match(p.wixProductId, uuid, p.name);
    assert.match(p.wixVariantId, uuid, p.name);
    assert.ok(p.region && !/see activation guide/i.test(p.region), `${p.name} needs a real region`);
    assert.ok(p.price > 0 && p.price <= MAX_BUDGET, p.name);
  }
});

test("checkout hands the bag and the reward code to Wix", async () => {
  const calls = [];
  let assigned = "";
  const stub = {
    startCheckout: async (lines, code) => {
      calls.push({ lines, code });
      return "https://checkout.example/session";
    },
  };
  const h = harness({
    "./wixCheckout": stub,
    window: {
      matchMedia: () => ({ matches: false }),
      location: { assign: (url) => (assigned = url), search: "", pathname: "/" },
    },
  });
  const App = h.load("src/App.tsx").default;
  const render = () => h.render(App);
  find(
    render(),
    (n) => n.props?.["aria-label"] === "Add Norton 360 Standard to bag",
  ).props.onClick();
  find(
    render(),
    (n) => n.props?.["aria-label"] === "Add Norton 360 Standard to bag",
  ).props.onClick();
  find(render(), (n) => n.props?.className === "bag-button").props.onClick();
  find(
    render(),
    (n) => n.type === "button" && text(n).includes("Review your order"),
  ).props.onClick();
  const go = find(
    render(),
    (n) => n.type === "button" && text(n).includes("Continue to secure checkout"),
  );
  await go.props.onClick();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].lines.length, 1);
  assert.equal(calls[0].lines[0].quantity, 2);
  assert.equal(calls[0].lines[0].product.wixVariantId, "4a77c3bd-5041-4d21-a1f5-3a8dd4b397b4");
  assert.equal(calls[0].code, undefined);
  assert.equal(assigned, "https://checkout.example/session");
});

test("contact details and legal links are on the page", () => {
  const h = harness(),
    App = h.load("src/App.tsx").default;
  const tree = h.render(App);
  const page = text(tree);
  const { SITE } = h.load("src/site.ts");
  assert.ok(page.includes(SITE.email));
  const hrefs = nodes(tree)
    .map((n) => n.props?.href)
    .filter(Boolean);
  for (const href of [
    "/privacy-policy.html",
    "/terms.html",
    "/refund-policy.html",
    "/contact.html",
  ]) {
    assert.ok(hrefs.includes(href), `footer links to ${href}`);
  }
  assert.ok(!/preview only|not yet available|demo promotion/i.test(page));
});

test("header sign-in opens the account dialog and checkout offers to save the order", () => {
  const h = harness(),
    App = h.load("src/App.tsx").default,
    { AuthPanel, passwordProblem } = h.load("src/AuthPanel.tsx");
  const render = () => h.render(App);
  const signIn = find(render(), (n) => n.props?.["aria-label"] === "Sign in or create an account");
  assert.ok(text(signIn).includes("Sign in"));
  signIn.props.onClick();
  const tree = render();
  const dialog = find(tree, (n) => n.props?.role === "dialog");
  assert.equal(dialog.props["aria-label"], "Sign in or create an account");
  assert.ok(dialog.props.className.includes("auth-modal"));
  const panel = find(tree, (n) => n.type === AuthPanel);
  assert.equal(panel.props.member, null);

  assert.equal(passwordProblem("short1"), "Use at least 8 characters.");
  assert.equal(passwordProblem("lettersonly"), "Mix letters and numbers.");
  assert.equal(passwordProblem("12345678"), "Mix letters and numbers.");
  assert.equal(passwordProblem("loki2026keys"), null);
});
