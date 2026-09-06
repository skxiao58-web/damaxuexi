/** boot template */
const CDN_SOURCES = [
  'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js',
  'https://unpkg.com/three@0.170.0/build/three.module.js',
  './vendor-three-170.js',
];

const statusEl = document.getElementById('status');
const startBtn = document.getElementById('start');
const errorEl = document.getElementById('error');

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function setStart(text, disabled = true) {
  if (!startBtn) return;
  startBtn.textContent = text;
  startBtn.disabled = disabled;
}

function showError(msg) {
  setStart('加载失败', true);
  if (errorEl) {
    errorEl.hidden = false;
    errorEl.textContent = msg;
  }
  setStatus(msg);
}

const failTimer = setTimeout(() => {
  showError('还在加载或已失败。请用 Chrome 打开本页，或再等几秒。');
}, 25000);

function clearFailTimer() {
  clearTimeout(failTimer);
}

async function loadThree() {
  const errors = [];
  for (let i = 0; i < CDN_SOURCES.length; i++) {
    const url = CDN_SOURCES[i];
    const label =
      i === 0 ? 'jsDelivr CDN' : i === 1 ? 'unpkg CDN' : '本地 vendor';
    setStatus('正在加载 Three.js（' + label + '）…');
    setStart('加载引擎 ' + (i + 1) + '/' + CDN_SOURCES.length + '…', true);
    try {
      const mod = await import(url);
      return mod;
    } catch (err) {
      console.warn('[boot] Three failed:', url, err);
      errors.push(label + ': ' + (err && err.message ? err.message : err));
    }
  }
  throw new Error('Three.js 全部来源失败:\n' + errors.join('\n'));
}

async function main() {
  setStatus('准备加载…');
  setStart('加载中…', true);

  let THREE;
  try {
    THREE = await loadThree();
  } catch (err) {
    clearFailTimer();
    console.error(err);
    showError(err && err.message ? err.message : String(err));
    return;
  }

  clearFailTimer();
  setStatus('正在构建战场…');
  setStart('构建场景…', true);

  try {
    const game = await import('./game.js');
    const init = game.init || game.default;
    if (typeof init !== 'function') {
      throw new Error('game.js 未导出 init');
    }
    await init(THREE, { statusEl, startBtn });
  } catch (err) {
    console.error(err);
    showError('初始化失败: ' + (err && err.message ? err.message : err));
  }
}

main();

