// DeepSeek Harness 桌面客户端
// 窗口 + 系统托盘 + 开机自启 + 自动拉起 dsh 服务
const { app, BrowserWindow, Tray, Menu, nativeImage, shell } = require('electron');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const DSH_HOST = '127.0.0.1';
const DSH_PORT = 3080;
const DSH_URL = `http://${DSH_HOST}:${DSH_PORT}`;

let mainWindow = null;
let tray = null;
let quitting = false;
let dshProcess = null;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function checkPort(host, port, timeoutMs = 800) {
  return new Promise((resolve) => {
    const req = http.request({ host, port, method: 'GET', timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

function findDsh() {
  const appdata = process.env.APPDATA || '';
  const candidates = [
    path.join(appdata, 'npm', 'dsh.cmd'),
    path.join(appdata, 'npm', 'dsh.ps1'),
    'D:\\dsh\\dsh.cmd',
    'D:\\dsh\\node_modules\\.bin\\dsh.cmd',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return 'dsh'; // 回退到 PATH
}

async function ensureDshRunning() {
  // 已经起来了就直接用
  for (let i = 0; i < 6; i++) {
    if (await checkPort(DSH_HOST, DSH_PORT, 700)) return true;
    await sleep(500);
  }
  // 尝试拉起 dsh web
  const dsh = findDsh();
  try {
    dshProcess = spawn(dsh, ['web'], {
      shell: true,
      detached: true,
      windowsHide: true,
      stdio: 'ignore',
    });
    dshProcess.unref();
  } catch (e) {
    console.error('启动 dsh 失败:', e);
    return false;
  }
  // 等它起来, 最多 60 秒
  for (let i = 0; i < 60; i++) {
    if (await checkPort(DSH_HOST, DSH_PORT, 700)) return true;
    await sleep(1000);
  }
  return false;
}

function errorPageHtml() {
  return `<!doctype html><html><head><meta charset="utf-8"><title>DeepSeek 聊天</title></head>
  <body style="background:#0f1115;color:#e6e8ee;font-family:'Microsoft YaHei',sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
    <div style="text-align:center;max-width:420px;">
      <h2>连不上 DeepSeek Harness 服务</h2>
      <p style="color:#8b93a7;line-height:1.8;">没能自动拉起 dsh 服务（http://${DSH_HOST}:${DSH_PORT}）。<br>请在终端手动运行 <code>dsh web</code>，然后点下面重试。</p>
      <button onclick="location.href='${DSH_URL}'" style="background:#4c8dff;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer;">重试</button>
    </div></body></html>`;
}

function createWindow(showImmediately = true) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: showImmediately,
    title: 'DeepSeek 聊天',
    icon: path.join(__dirname, 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });
  mainWindow.loadURL(DSH_URL).catch(() => {
    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(errorPageHtml()));
  });
  // 新窗口用系统浏览器打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url && url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });
  // 点关闭 = 最小化到托盘(不退出)
  mainWindow.on('close', (e) => {
    if (!quitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  const raw = nativeImage.createFromPath(path.join(__dirname, 'icon.png'));
  const trayIcon = raw.isEmpty()
    ? nativeImage.createEmpty()
    : raw.resize({ width: 16, height: 16 });
  tray = new Tray(trayIcon);
  const menu = Menu.buildFromTemplate([
    { label: '显示窗口', click: () => { mainWindow.show(); mainWindow.focus(); } },
    {
      label: '开机自启',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (item) => {
        app.setLoginItemSettings({ openAtLogin: item.checked, args: ['--hidden'] });
      },
    },
    { type: 'separator' },
    { label: '退出', click: () => { quitting = true; app.quit(); } },
  ]);
  tray.setToolTip('DeepSeek 聊天');
  tray.setContextMenu(menu);
  tray.on('click', () => { mainWindow.show(); mainWindow.focus(); });
  tray.on('double-click', () => { mainWindow.show(); mainWindow.focus(); });
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) { mainWindow.show(); mainWindow.focus(); }
  });

  app.whenReady().then(async () => {
    const up = await ensureDshRunning();
    const hidden = process.argv.includes('--hidden');
    createWindow(!hidden && up);
    createTray();
    if (!up) {
      // 窗口已加载错误页, 托盘仍可用
    }
  });

  app.on('window-all-closed', (e) => {
    // 常驻托盘, 不退出
  });

  app.on('before-quit', () => { quitting = true; });
}
