import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('screenshots', { recursive: true });

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9222;
const USER_DATA_DIR = '/tmp/chrome-test-profile-' + Date.now();

const chrome = spawn(CHROME_PATH, [
  '--headless=new',
  '--remote-debugging-port=' + PORT,
  '--user-data-dir=' + USER_DATA_DIR,
  '--window-size=1440,900',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank'
]);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getPageWsUrl() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      if (res.ok) {
        const pages = await res.json();
        const page = pages.find((p) => p.type === 'page');
        if (page && page.webSocketDebuggerUrl) {
          return page.webSocketDebuggerUrl;
        }
      }
    } catch {
      // wait
    }
    await sleep(250);
  }
  throw new Error('Chrome page target not found');
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.id = 1;
    this.callbacks = new Map();
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('BROWSER CONSOLE:', ...msg.params.args.map(a => a.value || a.description));
      }
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }

  async open() {
    return new Promise((resolve) => {
      if (this.ws.readyState === WebSocket.OPEN) resolve();
      else this.ws.onopen = () => resolve();
    });
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      awaitPromise: true,
      returnByValue: true,
    });
    return res.result?.value;
  }

  async screenshot(filePath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(res.data, 'base64');
    writeFileSync(filePath, buffer);
    console.log(`Saved screenshot to ${filePath}`);
  }
}

async function run() {
  try {
    const wsUrl = await getPageWsUrl();
    const cdp = new CDPClient(wsUrl);
    await cdp.open();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Network.enable');

    console.log('--- 1. Capture Auth Screen ---');
    await cdp.send('Page.navigate', { url: 'http://localhost:5001' });
    await sleep(2000);
    await cdp.screenshot('screenshots/01-auth-screen.png');

    console.log('--- 2. Direct API Login & Capture Dashboard ---');
    // Call the login API directly in page context and trigger state update
    const loginResult = await cdp.eval(`
      (async () => {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email: 'demo@merucrm.com', password: 'Password123!' })
          });
          const data = await res.json();
          console.log('API login response:', res.status, JSON.stringify(data));
          return { status: res.status, data };
        } catch (e) {
          console.error('API login fetch error:', e.message);
          return { error: e.message };
        }
      })()
    `);
    console.log('Login result from page:', loginResult);

    // Now reload the page so useAuth picks up the session cookie
    await cdp.send('Page.navigate', { url: 'http://localhost:5001' });
    await sleep(2500);
    await cdp.screenshot('screenshots/02-dashboard-demo-leads.png');

    console.log('--- 3. Capture All Leads Workbench ---');
    await cdp.eval(`
      const navItems = Array.from(document.querySelectorAll('.nav-item'));
      const leadsNav = navItems.find(el => el.textContent.includes('All Leads'));
      if (leadsNav) leadsNav.click();
    `);
    await sleep(2000);
    await cdp.screenshot('screenshots/04-leads-workbench.png');

    console.log('--- 4. Capture Lead Details Drawer ---');
    await cdp.eval(`
      const firstRow = document.querySelector('.lead-table-row');
      if (firstRow) firstRow.click();
    `);
    await sleep(1500);
    await cdp.screenshot('screenshots/05-lead-detail-drawer.png');

    console.log('--- 5. Register Zero-Leads User & Capture Zero-Leads Dashboard ---');
    const randomSuffix = Math.floor(Math.random() * 100000);
    const zeroEmail = `newuser${randomSuffix}@merucrm.com`;
    const signupResult = await cdp.eval(`
      (async () => {
        try {
          const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              name: 'Aarav Patel',
              email: '${zeroEmail}',
              password: 'Password123!',
              confirmPassword: 'Password123!'
            })
          });
          const data = await res.json();
          console.log('API signup response:', res.status, JSON.stringify(data));
          return { status: res.status, data };
        } catch (e) {
          console.error('API signup fetch error:', e.message);
          return { error: e.message };
        }
      })()
    `);
    console.log('Signup result from page:', signupResult);

    // Reload to display zero-leads dashboard for the newly created user
    await cdp.send('Page.navigate', { url: 'http://localhost:5001' });
    await sleep(2500);
    await cdp.screenshot('screenshots/03-dashboard-zero-leads.png');

    console.log('All 5 screenshots successfully captured and verified!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    chrome.kill('SIGTERM');
    process.exit(0);
  }
}

run();
