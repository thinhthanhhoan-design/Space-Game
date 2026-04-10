import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { CONFIG } from "./CONFIG.js";

// ===============================
// Scene - Camera - Renderer
// ===============================
const scene = new THREE.Scene();

// Background Blue Bell RGB
scene.background = new THREE.Color("rgb(15, 15, 15)");

const camera = new THREE.PerspectiveCamera(
  CONFIG.CAMERA.FOV,
  window.innerWidth / window.innerHeight,
  0.1,
  3000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// ===============================
// UI Elements
// ===============================
const cinematicText = document.getElementById("cinematicText");
const modeText = document.getElementById("modeText");

// ===============================
// Lights
// ===============================
scene.add(new THREE.AmbientLight(0xffffff, 0.7));

const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(10, 10, 10);
scene.add(dirLight);

// ===============================
// World Group (nghiêng cả thế giới)
// ===============================
const world = new THREE.Group();
scene.add(world);

// ===============================
// Ship Group (movement) + Ship Mesh (rotation visual)
// ===============================
const ship = new THREE.Group();
world.add(ship);

// Ship Mesh giả lập (sau này thay bằng model glb)
const shipMesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 2),
  new THREE.MeshStandardMaterial({ color: "white" })
);

// Cone hướng về phía trước
shipMesh.rotation.x = Math.PI / 2;

// Đẩy mesh ra trước để pivot gần đuôi (nghiêng đẹp hơn)
shipMesh.position.z = -1.1;

ship.add(shipMesh);

// ===============================
// Keyboard input
// ===============================
const keys = {};
window.addEventListener("keydown", (e) => (keys[e.key.toLowerCase()] = true));
window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));

// ===============================
// Helpers
// ===============================
function clamp(x, min, max) {
  return Math.max(min, Math.min(max, x));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

// ===============================
// Starfield (Infinite Stars)
// ===============================
const starGeometry = new THREE.BufferGeometry();
const starCount = 5000;
const positions = new Float32Array(starCount * 3);

const STAR_RANGE_X = 350;
const STAR_RANGE_Y = 220;
const STAR_RANGE_Z = 700;

for (let i = 0; i < starCount; i++) {
  const i3 = i * 3;
  positions[i3] = (Math.random() - 0.5) * STAR_RANGE_X;
  positions[i3 + 1] = (Math.random() - 0.5) * STAR_RANGE_Y;
  positions[i3 + 2] = -Math.random() * STAR_RANGE_Z;
}

starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

const stars = new THREE.Points(
  starGeometry,
  new THREE.PointsMaterial({ color: 0xffffff, size: 0.6 })
);

scene.add(stars);
// ===============================
// Nebula Background (Fullscreen Shader)
// ===============================

// ===============================
// Game State
// ===============================
let gameMode = "CINEMATIC";
let currentShotIndex = -1;

// ===============================
// Camera follow setup
// ===============================
const cameraOffset = new THREE.Vector3(
  CONFIG.CAMERA.OFFSET.x,
  CONFIG.CAMERA.OFFSET.y,
  CONFIG.CAMERA.OFFSET.z
);

const cameraTargetPos = new THREE.Vector3();
const cameraLookTarget = new THREE.Vector3();

// ===============================
// Cinematic setup
// ===============================
const shots = CONFIG.CINEMATIC.SHOTS;

function setShot(index) {
  const shot = shots[index];
  currentShotIndex = index;

  cinematicText.style.opacity = 0;

  setTimeout(() => {
    cinematicText.innerText = shot.text;
    cinematicText.style.opacity = 1;
  }, 250);
}

function updateCinematic(time) {
  for (let i = 0; i < shots.length; i++) {
    if (time >= shots[i].start && time < shots[i].end) {
      if (currentShotIndex !== i) setShot(i);
      break;
    }
  }

  const shot = shots[currentShotIndex];
  if (!shot) return;

  camera.fov = lerp(camera.fov, shot.camera.fov, 0.06);
  camera.updateProjectionMatrix();

  const targetPos = new THREE.Vector3(...shot.camera.pos);
  camera.position.lerp(targetPos, 0.05);

  if (shot.shake) {
    const shakeStrength = 0.12;
    camera.position.x += Math.sin(time * 18) * shakeStrength;
    camera.position.y += Math.cos(time * 22) * shakeStrength;
  }

  const targetLook = new THREE.Vector3(...shot.camera.lookAt);
  camera.lookAt(targetLook);
}

// ===============================
// Gameplay Update
// ===============================
function updateGameplay(time) {
  // forward progression
  ship.position.z -= CONFIG.ENGINE.FORWARD_SPEED;

  // input movement
  if (keys["a"]) ship.position.x -= 0.35;
  if (keys["d"]) ship.position.x += 0.35;
  if (keys["w"]) ship.position.y += 0.25;
  if (keys["s"]) ship.position.y -= 0.25;

  // flight envelope
  ship.position.x = clamp(
    ship.position.x,
    -CONFIG.ENGINE.FLIGHT_ENVELOPE.X,
    CONFIG.ENGINE.FLIGHT_ENVELOPE.X
  );

  ship.position.y = clamp(
    ship.position.y,
    -CONFIG.ENGINE.FLIGHT_ENVELOPE.Y,
    CONFIG.ENGINE.FLIGHT_ENVELOPE.Y
  );

  // detect input direction
  let inputX = 0;
  let inputY = 0;

  if (keys["a"]) inputX = -1;
  if (keys["d"]) inputX = 1;

  if (keys["w"]) inputY = 1;
  if (keys["s"]) inputY = -1;

  // target roll/pitch
  const targetRoll = -inputX * CONFIG.ENGINE.ROTATION_LIMITS.ROLL;
  const targetPitch = inputY * CONFIG.ENGINE.ROTATION_LIMITS.PITCH;

  // ===============================
  // ShipMesh rotation (visual only)
  // ===============================
  shipMesh.rotation.z = lerp(
    shipMesh.rotation.z,
    targetRoll,
    CONFIG.ENGINE.ROTATION_LIMITS.LERP
  );

  shipMesh.rotation.x = lerp(
    shipMesh.rotation.x,
    Math.PI / 2 + targetPitch,
    CONFIG.ENGINE.ROTATION_LIMITS.LERP
  );

  // ===============================
  // World Banking
  // ===============================
  const worldTargetRoll = -inputX * CONFIG.ENGINE.DYNAMIC_BANKING.WORLD_ROLL_LIMIT;

  world.rotation.z = lerp(
    world.rotation.z,
    worldTargetRoll,
    CONFIG.ENGINE.DYNAMIC_BANKING.SMOOTHNESS
  );

  // ===============================
  // Camera Follow
  // ===============================
  cameraTargetPos.copy(ship.position).add(cameraOffset);

  // Horizon shift
  const horizonShift = shipMesh.rotation.z * CONFIG.ENGINE.DYNAMIC_BANKING.HORIZON_SHIFT;
  cameraTargetPos.x += horizonShift;

  camera.position.lerp(cameraTargetPos, CONFIG.CAMERA.FOLLOW_LERP);

  // Camera shake
  const shake = CONFIG.CAMERA.SHAKE_INTENSITY * 0.02;
  camera.position.x += Math.sin(time * 20) * shake;
  camera.position.y += Math.cos(time * 25) * shake;

  // Camera roll theo tàu
  camera.rotation.z = lerp(camera.rotation.z, shipMesh.rotation.z * 0.5, 0.08);

  // Look ahead
  cameraLookTarget.copy(ship.position);
  cameraLookTarget.z -= 15;

  camera.lookAt(cameraLookTarget);
}

// ===============================
// Infinite Stars Update
// ===============================
function updateStars() {
  const starSpeed = 1.4;
  const posAttr = starGeometry.attributes.position;

  for (let i = 0; i < starCount; i++) {
    const i3 = i * 3;

    posAttr.array[i3 + 2] += starSpeed;

    if (posAttr.array[i3 + 2] > 10) {
      posAttr.array[i3] = (Math.random() - 0.5) * STAR_RANGE_X;
      posAttr.array[i3 + 1] = (Math.random() - 0.5) * STAR_RANGE_Y;
      posAttr.array[i3 + 2] = -STAR_RANGE_Z;
    }
  }

  posAttr.needsUpdate = true;
}

// ===============================
// Clock
// ===============================
const clock = new THREE.Clock();

// ===============================
// Animate
// ===============================
function animate() {
  requestAnimationFrame(animate);

  const time = clock.getElapsedTime();
      
  updateStars();

  if (gameMode === "CINEMATIC") {
    modeText.innerText = "Mode: CINEMATIC";

    // tàu bay nhẹ trong cinematic
    ship.position.z -= 0.12;

    updateCinematic(time);

    if (time >= CONFIG.CINEMATIC.INTRO_DURATION) {
      gameMode = "GAMEPLAY";
      cinematicText.style.opacity = 0;
    }
  }

  if (gameMode === "GAMEPLAY") {
    modeText.innerText = "Mode: GAMEPLAY";
    updateGameplay(time);
  }

  renderer.render(scene, camera);
}

animate();

// ===============================
// Resize
// ===============================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});