// Security checks for the phone sign-in server function (api/phone-signin.ts).
import { test, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import { SignJWT, generateKeyPair, exportJWK, createLocalJWKSet } from "jose";

const tmp = new URL("./.tmp-phone-signin.mjs", import.meta.url);
fs.writeFileSync(
  tmp,
  ts.transpileModule(fs.readFileSync("api/phone-signin.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText,
);
after(() => fs.rmSync(tmp, { force: true }));
const { createHandler } = await import(tmp.href);

const PROJECT = "loki-test";
const ORIGIN = "https://lokikeys.example";
const { privateKey, publicKey } = await generateKeyPair("RS256");
const jwk = { ...(await exportJWK(publicKey)), kid: "k1", alg: "RS256" };
const jwks = createLocalJWKSet({ keys: [jwk] });
const env = {
  FIREBASE_PROJECT_ID: PROJECT,
  WIX_API_KEY: "server-secret",
  WIX_SITE_ID: "site-1",
  ALLOWED_ORIGINS: `${ORIGIN},https://www.lokikeys.example`,
};

async function idToken(claims = {}, { audience = PROJECT, key = privateKey } = {}) {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    phone_number: "+919876543210",
    auth_time: now,
    firebase: { sign_in_provider: "phone" },
    ...claims,
  })
    .setProtectedHeader({ alg: "RS256", kid: "k1" })
    .setIssuer(`https://securetoken.google.com/${PROJECT}`)
    .setAudience(audience)
    .setSubject("firebase-uid")
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);
}

function setup(extraEnv = {}) {
  const wixCalls = [];
  const fetchImpl = async (url, init) => {
    wixCalls.push({ url, init, body: JSON.parse(init.body) });
    return new Response(JSON.stringify({ sessionToken: "MST2.session" }), { status: 200 });
  };
  const handler = createHandler({ env: { ...env, ...extraEnv }, jwks, fetchImpl });
  const call = (body, headers = {}) =>
    handler(
      new Request("https://lokikeys.example/api/phone-signin", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: ORIGIN,
          "x-forwarded-for": "1.2.3.4",
          ...headers,
        },
        body: typeof body === "string" ? body : JSON.stringify(body),
      }),
    );
  return { call, wixCalls };
}

test("a valid SMS sign-in returns a Wix session for that number only", async () => {
  const { call, wixCalls } = setup();
  const res = await call({ idToken: await idToken(), country: "IN" });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.deepEqual(await res.json(), { sessionToken: "MST2.session" });
  assert.equal(wixCalls.length, 1);
  const { url, init, body } = wixCalls[0];
  assert.equal(url, "https://www.wixapis.com/_api/iam/authentication/v2/sign-on");
  assert.equal(init.headers.Authorization, "server-secret");
  assert.equal(init.headers["wix-site-id"], "site-1");
  assert.equal(body.loginId.email, "ph919876543210@phone.lokikeys.com");
  assert.deepEqual(body.profile.phonesV2, [
    { countryCode: "IN", phone: "9876543210", tag: "MOBILE" },
  ]);
  assert.equal(body.mergeExistingContact, false, "never attaches to someone else's contact");
});

test("tokens that aren't a fresh phone sign-in for our project are refused", async () => {
  const { call, wixCalls } = setup();
  const other = await generateKeyPair("RS256");
  const cases = [
    await idToken({}, { audience: "someone-elses-project" }),
    await idToken({}, { key: other.privateKey }),
    await idToken({ firebase: { sign_in_provider: "password" } }),
    await idToken({ auth_time: Math.floor(Date.now() / 1000) - 3600 }),
    await idToken({ phone_number: "not-a-number" }),
    "garbage.token.value",
  ];
  for (const t of cases) {
    const res = await call({ idToken: t });
    assert.equal(res.status, 401);
  }
  assert.equal(wixCalls.length, 0, "Wix is never called for a bad token");
});

test("requests from other websites, bad bodies and floods are rejected", async () => {
  const { call } = setup();
  const good = await idToken();
  assert.equal((await call({ idToken: good }, { origin: "https://evil.example" })).status, 403);
  assert.equal((await call({ idToken: good }, { origin: "" })).status, 403);
  assert.equal((await call("{not json")).status, 400);
  assert.equal((await call({ idToken: 123 })).status, 400);
  assert.equal((await call({ idToken: "x".repeat(9000) })).status, 413);
  assert.equal((await call({ idToken: good }, { "content-type": "text/plain" })).status, 415);

  const flood = setup();
  const ip = { "x-forwarded-for": "9.9.9.9" };
  for (let i = 0; i < 10; i++) await flood.call({ idToken: good }, ip);
  assert.equal((await flood.call({ idToken: good }, ip)).status, 429);
});

test("stays switched off until every server setting is present", async () => {
  const { call } = setup({ WIX_API_KEY: "" });
  assert.equal((await call({ idToken: await idToken() })).status, 503);
  const noOrigins = setup({ ALLOWED_ORIGINS: "" });
  assert.equal((await noOrigins.call({ idToken: await idToken() })).status, 403);
});
