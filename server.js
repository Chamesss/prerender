#!/usr/bin/env node
var prerender = require('./lib');

const fs = require('fs');

function exists(p) {
  try {
    return !!p && fs.existsSync(p);
  } catch (e) {
    return false;
  }
}

function resolveChrome() {
  // explicit env override
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;

  // puppeteer bundled chromium
  try {
    const puppeteer = require('puppeteer');
    const exe = puppeteer.executablePath();
    if (exe && exists(exe)) return exe;
  } catch (e) {
    // puppeteer not installed or failed, continue to probes
  }

  // platform-specific common locations (Windows and Linux only)
  const platform = process.platform;
  const windowsCandidates = [
    process.env['PROGRAMFILES'] &&
      process.env['PROGRAMFILES'] + '\\Google\\Chrome\\Application\\chrome.exe',
    process.env['PROGRAMFILES(X86)'] &&
      process.env['PROGRAMFILES(X86)'] +
        '\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Chromium\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Chromium\\Application\\chrome.exe',
  ].filter(Boolean);

  const linuxCandidates = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/snap/bin/chromium',
  ];

  const candidates = platform === 'win32' ? windowsCandidates : linuxCandidates;

  for (const p of candidates) if (exists(p)) return p;

  return null;
}

const chromeLocation = resolveChrome();
if (!chromeLocation) {
  console.error(
    'Chrome/Chromium not found. Set CHROME_PATH or install puppeteer, or install Chrome/Chromium on the system.',
  );
  process.exit(1);
}

var server = prerender({
  chromeLocation: chromeLocation,
});

server.use(prerender.sendPrerenderHeader());
server.use(prerender.browserForceRestart());
// server.use(prerender.blockResources());
server.use(prerender.addMetaTags());
server.use(prerender.removeScriptTags());
server.use(prerender.httpHeaders());

server.start();
