const assert = require("assert");
const Module = require("module");

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === "puppeteer") {
    return { launch: async () => ({}) };
  }

  return originalLoad.call(this, request, parent, isMain);
};

const { resolveExecutablePath } = require("../utils/crawler");
Module._load = originalLoad;

function withEnv(nextEnv, fn) {
  const previousEnv = { ...process.env };
  Object.assign(process.env, nextEnv);

  try {
    fn();
  } finally {
    process.env = previousEnv;
  }
}

withEnv({ LOCAL: "false", CHROME_EXECUTABLE_PATH: "/custom/chromium" }, () => {
  assert.strictEqual(resolveExecutablePath(), "/custom/chromium");
});

withEnv({ LOCAL: "false", CHROME_EXECUTABLE_PATH: "" }, () => {
  assert.strictEqual(resolveExecutablePath(), "/usr/bin/chromium");
});

withEnv({ LOCAL: "true", CHROME_EXECUTABLE_PATH: "" }, () => {
  assert.strictEqual(
    resolveExecutablePath(),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
  );
});

console.log("crawler config tests passed");
