const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { webcrypto } = require("node:crypto");

// Loads src/auth.ts in a sandbox with a fake browser and a fake Wix session module.
function loadAuth({ hash = "", pending = null, fetchResult, fetchError } = {}) {
  const calls = { wix: [], exchange: [], assigned: null, replaced: null };
  const storage = new Map(pending ? [["loki-auth-pending", JSON.stringify(pending)]] : []);
  const window = {
    location: {
      origin: "https://shop.example",
      pathname: "/",
      search: "",
      hash,
      assign: (url) => (calls.assigned = url),
      replace: (url) => (calls.assigned = url),
    },
    history: { replaceState: (_s, _t, url) => (calls.replaced = url) },
  };
  const wixSession = {
    currentRole: () => "visitor",
    clearSession() {},
    async exchangeTokens(body, role) {
      calls.exchange.push({ body, role });
      return {};
    },
    async wixFetch(path, body) {
      calls.wix.push({ path, body });
      if (fetchError) throw fetchError;
      return typeof fetchResult === "function" ? fetchResult(path, body) : fetchResult;
    },
  };
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync("src/auth.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(code, {
    exports,
    window,
    crypto: webcrypto,
    btoa,
    TextEncoder,
    URLSearchParams,
    sessionStorage: {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, String(v)),
      removeItem: (k) => storage.delete(k),
    },
    require: (name) => {
      if (name === "./wixSession") return wixSession;
      if (name === "./site")
        return {
          WIX: { clientId: "client-123", api: "https://www.wixapis.com" },
          PHONE_LOGIN: { emailDomain: "phone.lokikeys.com" },
        };
      return require(name);
    },
  });
  return { auth: exports, calls, storage };
}

test("mobile numbers are validated per country and normalised to +E.164", () => {
  const { auth } = loadAuth();
  assert.deepEqual(
    { ...auth.parsePhone("IN", "98765 43210") },
    {
      e164: "+919876543210",
      iso: "IN",
      national: "9876543210",
    },
  );
  assert.equal(auth.parsePhone("IN", "+91 98765-43210").e164, "+919876543210");
  assert.equal(auth.parsePhone("IN", "09876543210").e164, "+919876543210");
  assert.equal(auth.parsePhone("IN", "12345 67890"), null, "Indian mobiles start with 6-9");
  assert.equal(auth.parsePhone("IN", "98765"), null);
  assert.equal(auth.parsePhone("IN", "+44 7700 900123"), null, "wrong country prefix");
  assert.equal(auth.parsePhone("GB", "07700 900123").e164, "+447700900123");
  assert.equal(auth.parsePhone("US", "(415) 555-0134").e164, "+14155550134");
  assert.equal(auth.parsePhone("ZZ", "12345678"), null);
  assert.equal(auth.parsePhone("IN", "98765abc10"), null);
});

test("only same-site paths are accepted after sign-in", () => {
  const { auth } = loadAuth();
  assert.equal(auth.safeReturnPath("/"), "/");
  assert.equal(auth.safeReturnPath("/shop?x=1"), "/shop?x=1");
  for (const bad of [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "javascript:alert(1)",
    "/ /x",
    42,
    null,
  ]) {
    assert.equal(auth.safeReturnPath(bad), "/", String(bad));
  }
});

test("PKCE challenge is the base64url SHA-256 of the verifier", async () => {
  const { auth } = loadAuth();
  const { verifier, challenge } = await auth.createPkce();
  assert.match(verifier, /^[A-Za-z0-9_-]{64}$/);
  const expected = Buffer.from(
    await webcrypto.subtle.digest("SHA-256", Buffer.from(verifier)),
  ).toString("base64url");
  assert.equal(challenge, expected);
  assert.notEqual(auth.randomString(), auth.randomString());
});

test("Google sign-in asks Wix for a PKCE redirect to the Google connection", async () => {
  const { auth, calls, storage } = loadAuth({
    fetchResult: { redirectSession: { fullUrl: "https://www.wix.com/oauth/authorize?x" } },
  });
  auth.signInWithGoogle("/after");
  await new Promise((r) => setTimeout(r, 20));
  const req = calls.wix[0];
  assert.equal(req.path, "/_api/redirects-api/v1/redirect-session");
  const a = req.body.auth.authRequest;
  assert.equal(a.idp, "0e6a50f5-b523-4e29-990d-f37fa2ffdd69");
  assert.equal(a.codeChallengeMethod, "S256");
  assert.equal(a.responseMode, "fragment");
  assert.equal(a.redirectUri, "https://shop.example/");
  assert.equal(a.clientId, "client-123");
  const saved = JSON.parse(storage.get("loki-auth-pending"));
  assert.equal(saved.state, a.state);
  assert.equal(saved.returnTo, "/after");
  assert.equal(calls.assigned, "https://www.wix.com/oauth/authorize?x");
});

test("returning from Wix: matching state signs in, anything else is refused", async () => {
  const pending = {
    verifier: "v".repeat(64),
    state: "good-state",
    redirectUri: "https://shop.example/",
    returnTo: "/",
    createdAt: Date.now(),
  };
  const ok = loadAuth({ hash: "#code=abc&state=good-state", pending });
  const r1 = await ok.auth.completeSignInFromUrl();
  assert.equal(r1.status, "signed-in");
  assert.equal(ok.calls.replaced, "/", "code is wiped from the address bar");
  assert.deepEqual(
    { ...ok.calls.exchange[0].body },
    {
      grantType: "authorization_code",
      code: "abc",
      codeVerifier: pending.verifier,
      redirectUri: pending.redirectUri,
    },
  );
  assert.equal(ok.calls.exchange[0].role, "member");
  assert.equal(ok.storage.has("loki-auth-pending"), false, "one use only");

  const forged = loadAuth({ hash: "#code=abc&state=attacker", pending });
  assert.equal((await forged.auth.completeSignInFromUrl()).status, "error");
  assert.equal(forged.calls.exchange.length, 0);

  const stale = loadAuth({
    hash: "#code=abc&state=good-state",
    pending: { ...pending, createdAt: Date.now() - 60 * 60 * 1000 },
  });
  assert.equal((await stale.auth.completeSignInFromUrl()).status, "error");

  const none = loadAuth({ hash: "#help" });
  assert.equal(
    (await none.auth.completeSignInFromUrl()).status,
    "none",
    "page anchors are ignored",
  );
});

test("email sign-in hides whether an account exists", async () => {
  const err = Object.assign(new Error("Identity not found"), { status: 404 });
  const { auth } = loadAuth({ fetchError: err });
  await assert.rejects(auth.signInWithEmail("a@b.co", "x"), /don't match an account/);
  const wrong = loadAuth({
    fetchError: Object.assign(new Error("Wrong password"), { status: 401 }),
  });
  await assert.rejects(wrong.auth.signInWithEmail("a@b.co", "x"), /don't match an account/);
});

test("sign-up sends the mobile number to Wix and handles email verification", async () => {
  const { auth, calls } = loadAuth({
    fetchResult: { state: "REQUIRE_EMAIL_VERIFICATION", stateToken: "st-1" },
  });
  const phone = auth.parsePhone("IN", "9876543210");
  const step = await auth.createAccount({
    firstName: " Asha ",
    email: " Asha@Example.COM ",
    password: "abc12345",
    phone,
    marketing: false,
  });
  assert.equal(step.step, "verify-email");
  assert.equal(step.stateToken, "st-1");
  const body = calls.wix[0].body;
  assert.equal(calls.wix[0].path, "/_api/iam/authentication/v2/register");
  assert.equal(body.loginId.email, "asha@example.com");
  assert.equal(body.profile.firstName, "Asha");
  assert.deepEqual(
    { ...body.profile.phonesV2[0] },
    { countryCode: "IN", phone: "9876543210", tag: "MOBILE" },
  );
});

test("password reset never reveals whether the email is registered", async () => {
  const { auth } = loadAuth({ fetchError: Object.assign(new Error("not found"), { status: 404 }) });
  await auth.sendPasswordReset("nobody@example.com"); // resolves without throwing
});
