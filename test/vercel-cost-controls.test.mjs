import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

const scriptUrl = new URL("../scripts/vercel-ignore-build.mjs", import.meta.url);

test("only main and the designated release-preview branch may deploy", async () => {
  const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url)));
  assert.equal(config.git.deploymentEnabled["*"], false);
  assert.equal(config.git.deploymentEnabled.main, true);
  assert.equal(config.git.deploymentEnabled["release/vercel-preview"], true);
  assert.equal(config.ignoreCommand, "node scripts/vercel-ignore-build.mjs");
  assert.deepEqual(config.crons, [
    { path: "/api/cron/commitment-audit", schedule: "0 8 * * *" },
  ]);
});

test("unapproved branches skip before Git comparison", () => {
  const result = spawnSync(process.execPath, [scriptUrl.pathname], {
    encoding: "utf8",
    env: {
      ...process.env,
      VERCEL_GIT_COMMIT_REF: "feature/example",
      VERCEL_GIT_PREVIOUS_SHA: "invalid",
      VERCEL_GIT_COMMIT_SHA: "invalid",
    },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /"skip":true/u);
});

test("approved-branch uncertainty builds conservatively", () => {
  const result = spawnSync(process.execPath, [scriptUrl.pathname], {
    encoding: "utf8",
    env: {
      ...process.env,
      VERCEL_GIT_COMMIT_REF: "main",
      VERCEL_GIT_PREVIOUS_SHA: "invalid",
      VERCEL_GIT_COMMIT_SHA: "invalid",
    },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /"skip":false/u);
});
