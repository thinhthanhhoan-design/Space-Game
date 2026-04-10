/* ========================= STATE ========================= */
const STATE = {
  MENU: "menu",
  PLAYING: "playing"
};

let currentState = STATE.MENU;


/* ========================= STORY ========================= */
const Story = {
  lines: [
    "Năm 2147...",
    "Thế giới bị AI kiểm soát...",
    "Bạn là hy vọng cuối cùng..."
  ],
  start() {
    console.log("Story bắt đầu...");
    this.lines.forEach(line => console.log(line));
  }
};


/* ========================= CINEMATIC ========================= */
const CINEMATIC = {
  duration: 10,
  texts: [
    { time: 0, text: "Năm 2147..." },
    { time: 2, text: "Nhân loại chinh phục liên sao..." },
    { time: 4, text: "Tàu UETE-3637 tiến vào 'Vùng Tối'..." },
    { time: 6, text: "CẢNH BÁO: Tín hiệu lạ phát hiện!" },
    { time: 8, text: "Hệ thống AI vô hiệu hóa. Đang rơi tự do..." }
  ]
};


/* ========================= DOM ========================= */
const startBtn = document.getElementById("startBtn");
const menu = document.getElementById("menu");
const textDiv = document.getElementById("cinematicText");

// 👉 flash đỏ (cũ)
let flash = document.getElementById("flash");
if (!flash) {
  flash = document.createElement("div");
  flash.id = "flash";
  document.body.appendChild(flash);
}

// 👉 flash trắng (mới)
let whiteFlash = document.createElement("div");
whiteFlash.style.position = "absolute";
whiteFlash.style.top = 0;
whiteFlash.style.left = 0;
whiteFlash.style.width = "100%";
whiteFlash.style.height = "100%";
whiteFlash.style.background = "white";
whiteFlash.style.opacity = 0;
whiteFlash.style.pointerEvents = "none";
whiteFlash.style.zIndex = 30;
document.body.appendChild(whiteFlash);

flash.style.position = "absolute";
flash.style.top = 0;
flash.style.left = 0;
flash.style.width = "100%";
flash.style.height = "100%";
flash.style.background = "red";
flash.style.opacity = 0;
flash.style.pointerEvents = "none";
flash.style.zIndex = 20;


/* ========================= THREE ========================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// ánh sáng
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 5, 5);
light.castShadow = true;
scene.add(light);

const ambient = new THREE.AmbientLight(0x404040, 1.5);
scene.add(ambient);

renderer.shadowMap.enabled = true;

// quả cầu
const cube = new THREE.Mesh(
  new THREE.SphereGeometry(1, 64, 64),
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.3,
    roughness: 0.4
  })
);
cube.castShadow = true;
cube.receiveShadow = true;
scene.add(cube);

/* ========================= BLACK HOLE ========================= */
let blackHole;
let blackGlow;

function createBlackHole() {
  // lõi đen (hố đen thật)
  const geo = new THREE.CircleGeometry(2, 64);
  const mat = new THREE.MeshBasicMaterial({
    color: 0x000000
  });

  blackHole = new THREE.Mesh(geo, mat);
  blackHole.position.z = -3;
  scene.add(blackHole);

  // glow viền (tạo cảm giác năng lượng)
  const glowGeo = new THREE.RingGeometry(2.1, 2.6, 64);
  const glowMat = new THREE.MeshBasicMaterial({
  color: 0x222222,
  transparent: true,
  opacity: 0.5,
  side: THREE.DoubleSide
});

  blackGlow = new THREE.Mesh(glowGeo, glowMat);
  blackGlow.position.z = -3.01;
  scene.add(blackGlow);
}

function triggerBlackHole() {
  createBlackHole();

  // hiệu ứng "xuất hiện đột ngột"
  blackHole.scale.set(0.1, 0.1, 0.1);
  blackGlow.scale.set(0.1, 0.1, 0.1);

  gsap.to([blackHole.scale, blackGlow.scale], {
    x: 1,
    y: 1,
    duration: 0.3,
    ease: "power2.out"
  });

  // glow quay nhẹ
  gsap.to(blackGlow.rotation, {
    z: "+=6",
    duration: 3,
    repeat: -1,
    ease: "none"
  });

  // hút quả cầu vào tâm
  gsap.to(cube.position, {
    x: 0,
    y: 0,
    z: -3,
    duration: 1.5,
    ease: "power3.in"
  });

  // thu nhỏ dần → biến mất
  gsap.to(cube.scale, {
    x: 0.01,
    y: 0.01,
    z: 0.01,
    duration: 1.5,
    ease: "power3.in"
  });

  // flash trắng mạnh hơn
  gsap.to(whiteFlash, {
    opacity: 1,
    duration: 0.2,
    delay: 1.2
  });

  // nền chuyển trắng mượt
  gsap.to(scene.background, {
    r: 1,
    g: 1,
    b: 1,
    duration: 2,
    delay: 1
  });
}

/* ========================= STARFIELD ========================= */
let stars;

function createStars() {
  const count = 10000;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);

  for (let i = 0; i < pos.length; i++) {
    pos[i] = (Math.random() - 0.5) * 100;
  }

  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));

  const mat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1
  });

  stars = new THREE.Points(geo, mat);
  scene.add(stars);
}
createStars();

function updateStars() {
  const arr = stars.geometry.attributes.position.array;

  for (let i = 2; i < arr.length; i += 3) {
    arr[i] += 0.2;
    if (arr[i] > 50) arr[i] = -50;
  }

  stars.geometry.attributes.position.needsUpdate = true;
}


/* ========================= TEXT ========================= */
function showText(text) {
  textDiv.innerText = text;
  textDiv.style.opacity = 1;
}


/* ========================= EFFECT: WARNING ========================= */
function warningEffect() {
  gsap.to(flash, {
    opacity: 0.6,
    duration: 0.1,
    yoyo: true,
    repeat: 5
  });

  gsap.to(camera.position, {
    x: "+=0.2",
    y: "+=0.2",
    duration: 0.05,
    repeat: 10,
    yoyo: true
  });

  gsap.to(cube.position, {
    x: "+=0.1",
    y: "+=0.1",
    duration: 0.05,
    repeat: 10,
    yoyo: true
  });
}


/* ========================= CINEMATIC ========================= */
function startCinematic() {
  let start = Date.now();
  let shown = new Array(CINEMATIC.texts.length).fill(false);

  function update() {
    let t = (Date.now() - start) / 1000;

    CINEMATIC.texts.forEach((item, i) => {
      if (t >= item.time && !shown[i]) {
        shown[i] = true;
        showText(item.text);

        if (item.text.includes("Tín hiệu lạ")) {
          warningEffect();
        }

        // 👉 trigger darkhole ở câu cuối
        if (item.text.includes("rơi tự do")) {
          triggerBlackHole();
        }
      }
    });

    if (t < CINEMATIC.duration) {
      requestAnimationFrame(update);
    } else {
      endCinematic();
    }
  }

  update();
}

function endCinematic() {
  textDiv.style.opacity = 0;
  currentState = STATE.PLAYING;
  Story.start();
}


/* ========================= LOOP ========================= */
function animate() {
  requestAnimationFrame(animate);

  updateStars();

  if (blackHole) {
    blackHole.rotation.x += 0.02;
  }

  if (currentState === STATE.PLAYING) {
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;
  }

  renderer.render(scene, camera);
}
animate();


/* ========================= START ========================= */
startBtn.addEventListener("click", () => {
  gsap.to(menu, {
    opacity: 0,
    duration: 1,
    onComplete: () => {
      menu.style.display = "none";
      startCinematic();
    }
  });
});


/* ========================= RESIZE ========================= */
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});