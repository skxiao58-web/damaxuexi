/**
 * Night combat cinematic (~30s) — Three.js r160 ES module
 * Primitives only; UI lives outside the canvas.
 */
import * as THREE from 'three';

const DURATION = 30;
const canvas = document.getElementById('fps-canvas');
const btnStart = document.getElementById('btn-start');
const btnReplay = document.getElementById('btn-replay');

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.setClearColor(0x05070c, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x070a12, 0.028);
scene.background = new THREE.Color(0x05070c);

const camera = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 220);
camera.position.set(0, 1.7, 8);

const clock = new THREE.Clock();
let elapsed = 0;
let playing = true;
let shake = 0;
const camNoise = { x: 0, y: 0, z: 0, t: 0 };

/* ---------- shared mats / geos ---------- */
const matBuilding = new THREE.MeshStandardMaterial({
  color: 0x1a222e, roughness: 0.92, metalness: 0.08,
});
const matBuilding2 = new THREE.MeshStandardMaterial({
  color: 0x121820, roughness: 0.95, metalness: 0.05,
});
const matRoad = new THREE.MeshStandardMaterial({
  color: 0x0c1018, roughness: 0.98, metalness: 0.02,
});
const matRubble = new THREE.MeshStandardMaterial({
  color: 0x2a3038, roughness: 1, metalness: 0.05,
});
const matBarrier = new THREE.MeshStandardMaterial({
  color: 0x4a5560, roughness: 0.85, metalness: 0.15,
});
const matVehicle = new THREE.MeshStandardMaterial({
  color: 0x1e2a1a, roughness: 0.75, metalness: 0.25,
});
const matBody = new THREE.MeshStandardMaterial({
  color: 0x2d3a2a, roughness: 0.7, metalness: 0.2,
});
const matBody2 = new THREE.MeshStandardMaterial({
  color: 0x243028, roughness: 0.72, metalness: 0.18,
});
const matHelmet = new THREE.MeshStandardMaterial({
  color: 0x1a2218, roughness: 0.55, metalness: 0.35,
});
const matGun = new THREE.MeshStandardMaterial({
  color: 0x111418, roughness: 0.45, metalness: 0.55,
});
const matHeli = new THREE.MeshStandardMaterial({
  color: 0x1c241c, roughness: 0.6, metalness: 0.4,
});
const matRotor = new THREE.MeshStandardMaterial({
  color: 0x333a40, roughness: 0.5, metalness: 0.5, side: THREE.DoubleSide,
});

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const sphereGeo = new THREE.SphereGeometry(0.5, 10, 8);
const cylGeo = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);

function meshBox(mat, sx, sy, sz, x, y, z) {
  const m = new THREE.Mesh(boxGeo, mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  m.castShadow = false;
  m.receiveShadow = false;
  return m;
}

/* ---------- world ---------- */
const world = new THREE.Group();
scene.add(world);

// road
world.add(meshBox(matRoad, 18, 0.08, 120, 0, 0, -40));
// sidewalks
world.add(meshBox(matRubble, 3.2, 0.12, 120, -10.5, 0.05, -40));
world.add(meshBox(matRubble, 3.2, 0.12, 120, 10.5, 0.05, -40));

// buildings left / right
function addBuilding(x, z, w, h, d, mat) {
  const b = meshBox(mat, w, h, d, x, h / 2, z);
  world.add(b);
  // dark window strip accents (cheap)
  if (h > 6) {
    const win = meshBox(
      new THREE.MeshStandardMaterial({
        color: 0x0a0e14, emissive: 0x1a1208, emissiveIntensity: 0.15 + Math.random() * 0.25,
        roughness: 0.9, metalness: 0.1,
      }),
      w * 0.85, h * 0.08, 0.08,
      x + (x < 0 ? w * 0.48 : -w * 0.48),
      h * (0.35 + Math.random() * 0.4),
      z
    );
    world.add(win);
  }
}

for (let i = 0; i < 14; i++) {
  const z = 8 - i * 8.5;
  addBuilding(-9.5 - Math.random() * 2, z, 5 + Math.random() * 3, 7 + Math.random() * 14, 5 + Math.random() * 3, i % 2 ? matBuilding : matBuilding2);
  addBuilding(9.5 + Math.random() * 2, z - 2, 5 + Math.random() * 3, 6 + Math.random() * 16, 5 + Math.random() * 3, i % 2 ? matBuilding2 : matBuilding);
}

// rubble piles
for (let i = 0; i < 18; i++) {
  const side = i % 2 === 0 ? -1 : 1;
  const r = meshBox(
    matRubble,
    1.2 + Math.random() * 2,
    0.4 + Math.random() * 1.2,
    1.2 + Math.random() * 2,
    side * (3.5 + Math.random() * 5),
    0.3,
    6 - i * 5.5 + Math.random() * 2
  );
  r.rotation.y = Math.random() * Math.PI;
  world.add(r);
}

// concrete barrier (cover)
const barrier = new THREE.Group();
barrier.position.set(-1.2, 0, -2.5);
for (let i = 0; i < 4; i++) {
  const block = meshBox(matBarrier, 1.4, 0.85, 0.55, i * 1.45 - 2.1, 0.42, 0);
  barrier.add(block);
}
world.add(barrier);

// military vehicle blocks
function makeVehicle(x, z, rotY) {
  const g = new THREE.Group();
  g.add(meshBox(matVehicle, 2.4, 1.1, 4.2, 0, 0.7, 0));
  g.add(meshBox(matVehicle, 2.2, 0.9, 2.0, 0, 1.5, -0.4));
  g.add(meshBox(matGun, 0.25, 0.25, 1.6, 0, 1.85, 1.2));
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  world.add(g);
  return g;
}
makeVehicle(5.5, -12, -0.35);
makeVehicle(-6.2, -28, 0.5);
makeVehicle(4.8, -45, -0.2);

/* ---------- lighting ---------- */
const ambient = new THREE.AmbientLight(0x2a3344, 0.45);
scene.add(ambient);
const moon = new THREE.DirectionalLight(0x6a7aaa, 0.55);
moon.position.set(-20, 40, 10);
scene.add(moon);
const streetFill = new THREE.PointLight(0xffaa66, 0.35, 40, 2);
streetFill.position.set(0, 4, 2);
scene.add(streetFill);
const streetFill2 = new THREE.PointLight(0x6688ff, 0.2, 50, 2);
streetFill2.position.set(-4, 5, -30);
scene.add(streetFill2);

const flashLights = [];
function borrowFlash(color, intensity, distance) {
  let L = flashLights.find((l) => !l.userData.busy);
  if (!L) {
    L = new THREE.PointLight(color, 0, distance, 2);
    L.userData.busy = false;
    scene.add(L);
    flashLights.push(L);
  }
  L.color.set(color);
  L.intensity = intensity;
  L.distance = distance;
  L.userData.busy = true;
  L.userData.life = 0.18;
  L.userData.decay = intensity / 0.18;
  return L;
}

/* ---------- particles ---------- */
const MAX_P = 420;
const pPositions = new Float32Array(MAX_P * 3);
const pColors = new Float32Array(MAX_P * 3);
const pLife = new Float32Array(MAX_P);
const pMaxLife = new Float32Array(MAX_P);
const pVel = new Float32Array(MAX_P * 3);
const pSize = new Float32Array(MAX_P);
let pCount = 0;

const pGeo = new THREE.BufferGeometry();
pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));
const pMat = new THREE.PointsMaterial({
  size: 0.18,
  vertexColors: true,
  transparent: true,
  opacity: 0.9,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  sizeAttenuation: true,
});
const points = new THREE.Points(pGeo, pMat);
scene.add(points);

function spawnBurst(x, y, z, n, opts = {}) {
  const {
    color = new THREE.Color(1, 0.6, 0.2),
    speed = 6,
    life = 0.8,
    upward = 2,
    smoke = false,
  } = opts;
  for (let i = 0; i < n; i++) {
    const idx = pCount % MAX_P;
    pPositions[idx * 3] = x + (Math.random() - 0.5) * 0.4;
    pPositions[idx * 3 + 1] = y + (Math.random() - 0.5) * 0.4;
    pPositions[idx * 3 + 2] = z + (Math.random() - 0.5) * 0.4;
    const dir = new THREE.Vector3(
      (Math.random() - 0.5) * 2,
      Math.random() * upward + (smoke ? 0.5 : 0),
      (Math.random() - 0.5) * 2
    ).normalize();
    const spd = speed * (0.4 + Math.random());
    pVel[idx * 3] = dir.x * spd * (smoke ? 0.35 : 1);
    pVel[idx * 3 + 1] = dir.y * spd * (smoke ? 0.5 : 1);
    pVel[idx * 3 + 2] = dir.z * spd * (smoke ? 0.35 : 1);
    const c = color.clone();
    if (smoke) c.multiplyScalar(0.35 + Math.random() * 0.25);
    else c.offsetHSL(0, 0, (Math.random() - 0.5) * 0.15);
    pColors[idx * 3] = c.r;
    pColors[idx * 3 + 1] = c.g;
    pColors[idx * 3 + 2] = c.b;
    pMaxLife[idx] = life * (0.6 + Math.random() * 0.6);
    pLife[idx] = pMaxLife[idx];
    pSize[idx] = smoke ? 0.35 : 0.12;
    pCount++;
  }
  pGeo.attributes.position.needsUpdate = true;
  pGeo.attributes.color.needsUpdate = true;
}

function updateParticles(dt) {
  for (let i = 0; i < MAX_P; i++) {
    if (pLife[i] <= 0) continue;
    pLife[i] -= dt;
    pVel[i * 3 + 1] -= 4.5 * dt;
    pPositions[i * 3] += pVel[i * 3] * dt;
    pPositions[i * 3 + 1] += pVel[i * 3 + 1] * dt;
    pPositions[i * 3 + 2] += pVel[i * 3 + 2] * dt;
    // fade via color dim
    const k = Math.max(0, pLife[i] / pMaxLife[i]);
    pColors[i * 3] *= 0.98;
    pColors[i * 3 + 1] *= 0.98;
    pColors[i * 3 + 2] *= 0.98;
    if (k < 0.2) {
      pColors[i * 3] *= 0.9;
      pColors[i * 3 + 1] *= 0.9;
      pColors[i * 3 + 2] *= 0.9;
    }
  }
  pGeo.attributes.position.needsUpdate = true;
  pGeo.attributes.color.needsUpdate = true;
}

/* ---------- soldiers ---------- */
function makeSoldier(mat) {
  const g = new THREE.Group();
  const torso = meshBox(mat, 0.55, 0.75, 0.32, 0, 1.15, 0);
  const head = meshBox(matHelmet, 0.32, 0.28, 0.34, 0, 1.72, 0.02);
  const legL = meshBox(mat, 0.18, 0.7, 0.22, -0.14, 0.4, 0);
  const legR = meshBox(mat, 0.18, 0.7, 0.22, 0.14, 0.4, 0);
  const armL = meshBox(mat, 0.14, 0.55, 0.16, -0.4, 1.2, 0.05);
  const armR = meshBox(mat, 0.14, 0.55, 0.16, 0.4, 1.15, 0.15);
  const rifle = meshBox(matGun, 0.08, 0.08, 0.95, 0.35, 1.15, 0.55);
  g.add(torso, head, legL, legR, armL, armR, rifle);
  g.userData = { legL, legR, armR, rifle, phase: Math.random() * Math.PI * 2 };
  return g;
}

const lead = makeSoldier(matBody);
lead.position.set(0.3, 0, 5);
scene.add(lead);

const squad = [];
const squadOffsets = [
  new THREE.Vector3(-1.6, 0, 1.4),
  new THREE.Vector3(1.8, 0, 2.1),
  new THREE.Vector3(-0.9, 0, 3.0),
];
for (let i = 0; i < 3; i++) {
  const s = makeSoldier(i === 1 ? matBody2 : matBody);
  s.position.copy(lead.position).add(squadOffsets[i]);
  scene.add(s);
  squad.push(s);
}

function animateSoldier(s, t, speed, duck = 0) {
  const ph = s.userData.phase + t * speed * 8;
  const swing = Math.sin(ph) * 0.35 * (1 - duck);
  s.userData.legL.rotation.x = swing;
  s.userData.legR.rotation.x = -swing;
  s.userData.armR.rotation.x = -swing * 0.5 - duck * 0.6;
  s.position.y = duck * -0.35;
  s.scale.y = 1 - duck * 0.12;
}

/* ---------- helicopter ---------- */
const heli = new THREE.Group();
heli.add(meshBox(matHeli, 1.2, 0.55, 3.2, 0, 0, 0));
heli.add(meshBox(matHeli, 0.5, 0.45, 1.1, 0, 0.15, 1.8));
heli.add(meshBox(matHeli, 0.15, 0.15, 2.4, 0, 0.2, -2.4));
const rotor = new THREE.Mesh(
  new THREE.BoxGeometry(5.5, 0.05, 0.35),
  matRotor
);
rotor.position.y = 0.45;
heli.add(rotor);
const rotor2 = new THREE.Mesh(
  new THREE.BoxGeometry(0.35, 0.05, 5.5),
  matRotor
);
rotor2.position.y = 0.45;
heli.add(rotor2);
heli.position.set(-30, 14, -20);
heli.visible = false;
scene.add(heli);

/* ---------- enemy muzzle markers ---------- */
const muzzleSprites = [];
function flashMuzzle(x, y, z) {
  const L = borrowFlash(0xffcc66, 4.5, 18);
  L.position.set(x, y, z);
  spawnBurst(x, y, z, 8, {
    color: new THREE.Color(1, 0.75, 0.3),
    speed: 3,
    life: 0.25,
    upward: 0.5,
  });
}

/* ---------- explosions ---------- */
const scheduled = [];
function scheduleExplosion(time, pos, power, nearby) {
  scheduled.push({ time, pos, power, nearby, done: false });
}

// timeline fx
scheduleExplosion(2.2, new THREE.Vector3(-8, 2, -35), 1.0, false);
scheduleExplosion(4.5, new THREE.Vector3(10, 3, -50), 1.2, false);
scheduleExplosion(6.8, new THREE.Vector3(-6, 1.5, -22), 0.9, false);
scheduleExplosion(9.5, new THREE.Vector3(7, 2, -18), 1.1, false);
scheduleExplosion(11.2, new THREE.Vector3(-9, 2.5, -40), 1.4, false);
scheduleExplosion(14.0, new THREE.Vector3(5, 1.8, -10), 1.0, false);
scheduleExplosion(17.2, new THREE.Vector3(1.5, 1.2, -4), 1.6, true);
scheduleExplosion(19.5, new THREE.Vector3(-5, 2, -30), 1.0, false);
scheduleExplosion(24.5, new THREE.Vector3(8, 3, -55), 1.3, false);
scheduleExplosion(27.0, new THREE.Vector3(-7, 2, -60), 1.1, false);

function triggerExplosion(e) {
  const { pos, power, nearby } = e;
  const L = borrowFlash(0xff9944, 12 * power, 35 * power);
  L.position.copy(pos);
  spawnBurst(pos.x, pos.y, pos.z, Math.floor(40 * power), {
    color: new THREE.Color(1, 0.45, 0.1),
    speed: 8 * power,
    life: 0.9,
    upward: 3,
  });
  spawnBurst(pos.x, pos.y + 0.5, pos.z, Math.floor(25 * power), {
    color: new THREE.Color(0.4, 0.4, 0.42),
    speed: 3,
    life: 1.6,
    upward: 4,
    smoke: true,
  });
  if (nearby) {
    spawnBurst(pos.x, pos.y + 0.2, pos.z, 50, {
      color: new THREE.Color(0.55, 0.5, 0.4),
      speed: 10,
      life: 1.1,
      upward: 2.5,
    });
    shake = Math.max(shake, 0.55 * power);
  } else {
    shake = Math.max(shake, 0.18 * power);
  }
}

/* ---------- muzzle schedule ---------- */
const muzzleTimes = [];
for (let t = 1.5; t < 28; t += 0.45 + Math.random() * 0.55) {
  muzzleTimes.push({
    t,
    x: -3 + Math.random() * 8,
    y: 1.2 + Math.random() * 0.8,
    z: -8 - Math.random() * 40,
    done: false,
  });
}

/* ---------- squad return fire (visual only) ---------- */
function squadFire(t) {
  if (t < 10 || t > 21) return;
  if (Math.random() > 0.04) return;
  const s = squad[Math.floor(Math.random() * squad.length)];
  const tip = s.localToWorld(new THREE.Vector3(0.35, 1.15, 1.0));
  flashMuzzle(tip.x, tip.y, tip.z);
}

/* ---------- camera path ---------- */
const leadPos = new THREE.Vector3();
const camTarget = new THREE.Vector3();
const lookAt = new THREE.Vector3();

function updateCamera(t, dt) {
  // advance along street
  let zProgress;
  let duckLead = 0;
  let lowAngle = 0;

  if (t < 8) {
    zProgress = THREE.MathUtils.lerp(5, -1, t / 8);
  } else if (t < 16) {
    zProgress = THREE.MathUtils.lerp(-1, -3.5, (t - 8) / 8);
    duckLead = THREE.MathUtils.smoothstep(8.5, 10, t) * (1 - THREE.MathUtils.smoothstep(15, 16, t));
  } else if (t < 22) {
    zProgress = THREE.MathUtils.lerp(-3.5, -10, (t - 16) / 6);
    lowAngle = THREE.MathUtils.smoothstep(18, 19.5, t) * (1 - THREE.MathUtils.smoothstep(21, 22, t));
  } else {
    zProgress = THREE.MathUtils.lerp(-10, -22, (t - 22) / 8);
  }

  lead.position.x = THREE.MathUtils.lerp(0.3, -0.4, Math.min(1, t / 20));
  lead.position.z = zProgress;
  lead.rotation.y = Math.sin(t * 0.4) * 0.05;

  animateSoldier(lead, t, t < 8 ? 0.7 : t < 16 ? 0.25 : 0.85, duckLead);

  for (let i = 0; i < squad.length; i++) {
    const off = squadOffsets[i];
    const coverPull = t >= 8 && t < 16 ? 1 : 0;
    const ox = off.x + (coverPull ? (off.x < 0 ? -0.4 : 0.5) : 0);
    const oz = off.z + (coverPull ? -0.8 : 0);
    squad[i].position.x = THREE.MathUtils.damp(squad[i].position.x, lead.position.x + ox, 3, dt);
    squad[i].position.z = THREE.MathUtils.damp(squad[i].position.z, lead.position.z + oz, 3, dt);
    const duckS = coverPull * (0.4 + i * 0.15);
    animateSoldier(squad[i], t + i, coverPull ? 0.15 : 0.75, duckS);
    squad[i].rotation.y = lead.rotation.y;
  }

  leadPos.copy(lead.position);

  // handheld follow behind/side
  const side = 1.8 + Math.sin(t * 0.35) * 0.4;
  const back = 4.2 - lowAngle * 1.2;
  const height = THREE.MathUtils.lerp(1.85, 0.95, lowAngle) + duckLead * 0.2;

  camTarget.set(
    leadPos.x + side * 0.55,
    height,
    leadPos.z + back
  );

  camNoise.t += dt;
  camNoise.x = Math.sin(camNoise.t * 7.3) * 0.035 + Math.sin(camNoise.t * 13.1) * 0.015;
  camNoise.y = Math.cos(camNoise.t * 6.1) * 0.028 + Math.sin(camNoise.t * 11.7) * 0.012;
  camNoise.z = Math.sin(camNoise.t * 5.5) * 0.03;

  const sh = shake;
  camera.position.x = THREE.MathUtils.damp(camera.position.x, camTarget.x + camNoise.x + (Math.random() - 0.5) * sh, 5, dt);
  camera.position.y = THREE.MathUtils.damp(camera.position.y, camTarget.y + camNoise.y + (Math.random() - 0.5) * sh * 0.6, 5, dt);
  camera.position.z = THREE.MathUtils.damp(camera.position.z, camTarget.z + camNoise.z, 5, dt);

  lookAt.set(
    leadPos.x + Math.sin(t * 0.2) * 0.3,
    1.3 - lowAngle * 0.25,
    leadPos.z - 6 - lowAngle * 2
  );
  camera.lookAt(lookAt);
  camera.rotation.z = camNoise.x * 0.15 + (Math.random() - 0.5) * sh * 0.08;

  shake = Math.max(0, shake - dt * 1.8);
}

function updateHeli(t, dt) {
  if (t < 22) {
    heli.visible = false;
    return;
  }
  heli.visible = true;
  const u = (t - 22) / 7;
  heli.position.x = THREE.MathUtils.lerp(-22, 24, u);
  heli.position.y = 11 + Math.sin(u * Math.PI) * 2;
  heli.position.z = lead.position.z - 8 + u * -6;
  heli.rotation.y = -0.9;
  heli.rotation.z = Math.sin(t * 2) * 0.04;
  rotor.rotation.y += dt * 28;
  rotor2.rotation.y += dt * 28;
  if (Math.random() < 0.08) {
    spawnBurst(heli.position.x, heli.position.y - 0.5, heli.position.z, 4, {
      color: new THREE.Color(0.35, 0.35, 0.35),
      speed: 2,
      life: 1.2,
      upward: 1,
      smoke: true,
    });
  }
}

function updateFlashes(dt) {
  for (const L of flashLights) {
    if (!L.userData.busy) continue;
    L.userData.life -= dt;
    L.intensity = Math.max(0, L.intensity - L.userData.decay * dt);
    if (L.userData.life <= 0) {
      L.intensity = 0;
      L.userData.busy = false;
    }
  }
}


/* ---------- signal flare ---------- */
let signalDone = false;
function signalFlare(t) {
  if (signalDone || t < 18.4 || t > 19.2) return;
  signalDone = true;
  const x = lead.position.x + 0.8;
  const y = 2.2;
  const z = lead.position.z - 1.5;
  const L = borrowFlash(0x66ffaa, 8, 28);
  L.position.set(x, y, z);
  L.userData.life = 0.9;
  L.userData.decay = 8 / 0.9;
  spawnBurst(x, y, z, 30, {
    color: new THREE.Color(0.4, 1, 0.55),
    speed: 5,
    life: 1.1,
    upward: 5,
  });
  spawnBurst(x, y + 1, z, 18, {
    color: new THREE.Color(0.5, 0.5, 0.52),
    speed: 2,
    life: 1.8,
    upward: 4,
    smoke: true,
  });
  shake = Math.max(shake, 0.12);
}

/* ---------- ambient drifting smoke ---------- */
function ambientSmoke(t) {
  if (Math.random() > 0.12) return;
  const z = lead.position.z - 5 - Math.random() * 30;
  spawnBurst(
    (Math.random() - 0.5) * 12,
    0.5 + Math.random() * 2,
    z,
    3,
    {
      color: new THREE.Color(0.45, 0.45, 0.48),
      speed: 1.2,
      life: 2.2,
      upward: 2.5,
      smoke: true,
    }
  );
}

/* ---------- resize ---------- */
function resize() {
  const wrap = canvas.parentElement;
  const w = wrap.clientWidth;
  const h = wrap.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / Math.max(1, h);
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

/* ---------- reset / controls ---------- */
function resetAll() {
  elapsed = 0;
  playing = true;
  shake = 0;
  clock.start();
  for (const e of scheduled) e.done = false;
  signalDone = false;
  for (const m of muzzleTimes) m.done = false;
  for (let i = 0; i < MAX_P; i++) pLife[i] = 0;
  lead.position.set(0.3, 0, 5);
  for (let i = 0; i < squad.length; i++) {
    squad[i].position.copy(lead.position).add(squadOffsets[i]);
  }
  heli.visible = false;
  heli.position.set(-30, 14, -20);
  camera.position.set(2, 1.85, 9);
}

btnStart.addEventListener('click', () => {
  if (!playing || elapsed >= DURATION) resetAll();
  else playing = true;
});
btnReplay.addEventListener('click', () => resetAll());

/* ---------- loop ---------- */
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, clock.getDelta());
  if (playing) {
    elapsed += dt;
    if (elapsed > DURATION) {
      elapsed = DURATION;
      playing = false;
    }
  }

  const t = elapsed;

  for (const e of scheduled) {
    if (!e.done && t >= e.time) {
      e.done = true;
      triggerExplosion(e);
    }
  }
  for (const m of muzzleTimes) {
    if (!m.done && t >= m.t) {
      m.done = true;
      flashMuzzle(m.x, m.y, m.z);
      // denser enemy fire in heavy phase
      if (t >= 8 && t <= 16) {
        flashMuzzle(m.x + 1.2, m.y, m.z - 1.5);
      }
    }
  }

  if (playing) {
    updateCamera(t, dt);
    updateHeli(t, dt);
    squadFire(t);
    signalFlare(t);
    ambientSmoke(t);
    // late push smoke wall
    if (t > 22 && Math.random() < 0.15) {
      spawnBurst(lead.position.x + (Math.random() - 0.5) * 6, 0.8, lead.position.z - 3, 5, {
        color: new THREE.Color(0.4, 0.4, 0.42),
        speed: 1.5,
        life: 2,
        upward: 2,
        smoke: true,
      });
    }
  }

  updateParticles(dt);
  updateFlashes(dt);
  renderer.render(scene, camera);
}

resetAll();
frame();
