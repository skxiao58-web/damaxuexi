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

function bump() {
  clicks += 1;
  clicksEl.textContent = String(clicks);
  greeting.classList.remove("bounce");
  void greeting.offsetWidth;
  greeting.classList.add("bounce");
}

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
