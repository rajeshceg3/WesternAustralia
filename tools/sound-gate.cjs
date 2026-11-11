const pp = require('puppeteer-core');
const { spawn } = require('child_process');
(async () => {
  const s = spawn('python3', ['-m', 'http.server', '8849'], { cwd: 'dist', stdio: 'ignore' });
  await new Promise(r => setTimeout(r, 500));
  const b = await pp.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844 });
  const errors = [];
  p.on('pageerror', e => errors.push(String(e)));
  await p.goto('http://127.0.0.1:8849');
  await p.waitForSelector('canvas[data-ready=true]', { timeout: 30000 });
  const before = await p.evaluate(() => ({ engine: !!window.__soundscape, soundCtx: window.wildlife.sound.ctx }));
  await p.click('#sound');
  await new Promise(r => setTimeout(r, 1200));
  const on = await p.evaluate(() => ({ state: window.__soundscape?.context?.state, pressed: document.querySelector('#sound').getAttribute('aria-pressed') }));
  // change study -> scene should follow without errors
  await p.select('#chapter', '1');
  await new Promise(r => setTimeout(r, 900));
  const wetland = await p.evaluate(() => window.__soundscape?.context?.state);
  await p.select('#chapter', '3');
  await new Promise(r => setTimeout(r, 900));
  await p.click('#sound');
  await new Promise(r => setTimeout(r, 500));
  const off = await p.evaluate(() => ({ engine: !!window.__soundscape, soundCtx: window.wildlife.sound.ctx, pressed: document.querySelector('#sound').getAttribute('aria-pressed') }));
  await p.screenshot({ path: '/tmp/wa-390.png' });
  console.log(JSON.stringify({ before, on, wetland, off, errors }, null, 1));
  await b.close(); s.kill();
})();
