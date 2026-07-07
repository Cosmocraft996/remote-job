const puppeteer = require("puppeteer");

const LOCAL_CHROME_PATH =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const DEFAULT_CHROME_PATH = "/usr/bin/chromium";

function resolveExecutablePath() {
  const configuredPath = process.env.CHROME_EXECUTABLE_PATH?.trim();
  if (configuredPath) {
    return configuredPath;
  }

  return process.env.LOCAL === "true" ? LOCAL_CHROME_PATH : DEFAULT_CHROME_PATH;
}

async function launchBrowser() {
  const IS_LOCAL = process.env.LOCAL === "true";
  const browser = await puppeteer.launch({
    executablePath: resolveExecutablePath(),
    headless: IS_LOCAL ? false : "new",
    defaultViewport: null,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  return browser;
}

module.exports = { launchBrowser, resolveExecutablePath };
