const hellos = [
  ["你好，世界", "Hello, world."],
  ["嘿，今天也顺利", "Hey, make it a good day."],
  ["咖啡续命中", "Powered by coffee."],
  ["Bug 先放一边", "Ship it (carefully)."],
  ["学溪冲冲冲", "damaxuexi go go go."],
  ["你点一下，我变一下", "You click, I remix."],
];

const facts = [
  "章鱼有三颗心脏，两颗在游动时会停。",
  "香蕉其实是浆果，草莓反而不算。",
  "太空里没有声音，因为几乎没有空气。",
  "蜂蜜几乎不会坏，考古发现过还能吃的蜂蜜。",
  "闪电比火山爆发还烫，大约是太阳表面的五倍。",
  "考拉指纹和人类很像，曾经难倒过刑侦。",
];

let clicks = 0;
const greeting = document.getElementById("greeting");
const greetingEn = document.getElementById("greeting-en");
const factEl = document.getElementById("fact");
const clicksEl = document.getElementById("clicks");
const themeBtn = document.getElementById("btn-theme");

function bump() {
  clicks += 1;
  clicksEl.textContent = String(clicks);
  greeting.classList.remove("bounce");
  void greeting.offsetWidth;
  greeting.classList.add("bounce");
}

function applyTheme(light) {
  document.documentElement.classList.toggle("light", light);
  themeBtn.textContent = light ? "深色" : "浅色";
  localStorage.setItem("damaxuexi-theme", light ? "light" : "dark");
}

const saved = localStorage.getItem("damaxuexi-theme");
applyTheme(saved === "light");

themeBtn.addEventListener("click", () => {
  applyTheme(!document.documentElement.classList.contains("light"));
  bump();
});

document.getElementById("btn-hello").addEventListener("click", () => {
  const [zh, en] = hellos[Math.floor(Math.random() * hellos.length)];
  greeting.textContent = zh;
  greetingEn.textContent = en;
  bump();
});

document.getElementById("btn-fact").addEventListener("click", () => {
  factEl.hidden = false;
  factEl.textContent = facts[Math.floor(Math.random() * facts.length)];
  bump();
});

/* ---- shooting mini game ---- */
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const bestEl = document.getElementById("best");
const gameOverEl = document.getElementById("game-over");

const W = canvas.width;
const H = canvas.height;
let best = Number(localStorage.getItem("damaxuexi-best") || 0);
bestEl.textContent = String(best);

const state = {
  running: false,
  paused: false,
  score: 0,
  lives: 3,
  shipX: W / 2,
  bullets: [],
  targets: [],
  particles: [],
  cooldown: 0,
  spawn: 0,
  last: 0,
};

function resetGame() {
  state.running = true;
  state.paused = false;
  state.score = 0;
  state.lives = 3;
  state.shipX = W / 2;
  state.bullets = [];
  state.targets = [];
  state.particles = [];
  state.cooldown = 0;
  state.spawn = 0;
  state.last = performance.now();
  gameOverEl.hidden = true;
  scoreEl.textContent = "0";
  livesEl.textContent = "3";
}

function shoot() {
  if (!state.running || state.paused || state.cooldown > 0) return;
  state.bullets.push({ x: state.shipX, y: H - 48, vy: -520 });
  state.cooldown = 0.18;
}

function burst(x, y, color) {
  for (let i = 0; i < 10; i++) {
    state.particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 220,
      vy: (Math.random() - 0.5) * 220,
      life: 0.35 + Math.random() * 0.25,
      color,
    });
  }
}

function pointerX(evt) {
  const rect = canvas.getBoundingClientRect();
  const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
  return ((clientX - rect.left) / rect.width) * W;
}

canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (!state.running) resetGame();
  state.shipX = Math.max(24, Math.min(W - 24, pointerX(e)));
  shoot();
});
canvas.addEventListener("pointermove", (e) => {
  if (!state.running) return;
  state.shipX = Math.max(24, Math.min(W - 24, pointerX(e)));
});
window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    if (!state.running) resetGame();
    shoot();
  }
  if (e.code === "ArrowLeft") state.shipX = Math.max(24, state.shipX - 28);
  if (e.code === "ArrowRight") state.shipX = Math.min(W - 24, state.shipX + 28);
});

document.getElementById("btn-start").addEventListener("click", resetGame);
document.getElementById("btn-pause").addEventListener("click", () => {
  if (!state.running) return;
  state.paused = !state.paused;
  document.getElementById("btn-pause").textContent = state.paused ? "继续" : "暂停";
});

function tick(now) {
  const dt = Math.min(0.033, (now - state.last) / 1000 || 0.016);
  state.last = now;

  if (state.running && !state.paused) {
    state.cooldown = Math.max(0, state.cooldown - dt);
    state.spawn -= dt;
    if (state.spawn <= 0) {
      state.targets.push({
        x: 30 + Math.random() * (W - 60),
        y: -20,
        r: 14 + Math.random() * 12,
        vy: 70 + Math.random() * 90 + state.score * 1.2,
        hue: 20 + Math.random() * 40,
      });
      state.spawn = Math.max(0.35, 1.05 - state.score * 0.012);
    }

    state.bullets.forEach((b) => { b.y += b.vy * dt; });
    state.targets.forEach((t) => { t.y += t.vy * dt; });
    state.particles.forEach((p) => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    });

    for (let i = state.bullets.length - 1; i >= 0; i--) {
      const b = state.bullets[i];
      if (b.y < -10) { state.bullets.splice(i, 1); continue; }
      for (let j = state.targets.length - 1; j >= 0; j--) {
        const t = state.targets[j];
        const dx = b.x - t.x;
        const dy = b.y - t.y;
        if (dx * dx + dy * dy < (t.r + 4) ** 2) {
          burst(t.x, t.y, `hsl(${t.hue} 90% 60%)`);
          state.targets.splice(j, 1);
          state.bullets.splice(i, 1);
          state.score += 1;
          scoreEl.textContent = String(state.score);
          if (state.score > best) {
            best = state.score;
            bestEl.textContent = String(best);
            localStorage.setItem("damaxuexi-best", String(best));
          }
          break;
        }
      }
    }

    for (let i = state.targets.length - 1; i >= 0; i--) {
      if (state.targets[i].y - state.targets[i].r > H) {
        state.targets.splice(i, 1);
        state.lives -= 1;
        livesEl.textContent = String(state.lives);
        if (state.lives <= 0) {
          state.running = false;
          gameOverEl.hidden = false;
        }
      }
    }
    state.particles = state.particles.filter((p) => p.life > 0);
  }

  // draw
  ctx.clearRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#0f172a");
  g.addColorStop(1, "#020617");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  // stars
  ctx.fillStyle = "rgba(255,255,255,.35)";
  for (let i = 0; i < 40; i++) {
    const x = (i * 97) % W;
    const y = (i * 53 + now * 0.02) % H;
    ctx.fillRect(x, y, 2, 2);
  }

  state.targets.forEach((t) => {
    ctx.beginPath();
    ctx.fillStyle = `hsl(${t.hue} 90% 55%)`;
    ctx.arc(t.x, t.y, t.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,.35)";
    ctx.stroke();
  });

  state.bullets.forEach((b) => {
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(b.x - 2, b.y - 10, 4, 14);
  });

  state.particles.forEach((p) => {
    ctx.globalAlpha = Math.max(0, p.life * 2);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 3, 3);
    ctx.globalAlpha = 1;
  });

  // ship
  ctx.fillStyle = "#e2e8f0";
  ctx.beginPath();
  ctx.moveTo(state.shipX, H - 28);
  ctx.lineTo(state.shipX - 18, H - 10);
  ctx.lineTo(state.shipX + 18, H - 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#38bdf8";
  ctx.fillRect(state.shipX - 3, H - 34, 6, 8);

  if (!state.running && gameOverEl.hidden) {
    ctx.fillStyle = "rgba(248,250,252,.8)";
    ctx.font = "600 18px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("点击画布或按「开始」", W / 2, H / 2);
  }
  if (state.paused) {
    ctx.fillStyle = "rgba(2,6,23,.55)";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#fff";
    ctx.font = "700 22px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("暂停", W / 2, H / 2);
  }

  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
