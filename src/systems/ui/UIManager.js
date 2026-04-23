console.log("UIManager loaded");
export class UIManager {
  constructor() {
    this.isVisible = false;


    // ===== CONTAINER =====
    this.container = document.createElement("div");
    this.container.id = "hud";
    this.container.style.position = "fixed";
    this.container.style.top = "20px";
    this.container.style.left = "20px";
    this.container.style.fontFamily = "Orbitron, sans-serif";
    this.container.style.fontSize = "18px";
    this.container.style.zIndex = "999";
    this.container.style.display = "none";


    // ===== STYLE CHUNG =====
    const baseStyle = (el) => {
      el.style.marginBottom = "6px";
      el.style.padding = "6px 10px";
      el.style.borderRadius = "8px";
      el.style.background = "rgba(0,0,0,0.4)";
      el.style.backdropFilter = "blur(4px)";
      el.style.boxShadow = "0 0 8px rgba(255,255,255,0.2)";
    };


    // ===== HP =====  // Máu
    this.hpText = document.createElement("div");
    baseStyle(this.hpText);
    this.hpText.style.color = "#ff4d4d"; // đỏ
    this.hpText.style.textShadow = "0 0 8px #ff0000";


    // ===== AMMO =====  // Đạn
    this.ammoText = document.createElement("div");
    baseStyle(this.ammoText);
    this.ammoText.style.color = "#ffd633"; // vàng
    this.ammoText.style.textShadow = "0 0 8px #ffaa00";


    // ===== SPEED ===== // Tốc độ
    this.speedText = document.createElement("div");
    baseStyle(this.speedText);
    this.speedText.style.color = "#33ccff"; // xanh cyan
    this.speedText.style.textShadow = "0 0 8px #00ccff";

    // ===== KILL COUNT ==== // Số enemy đã giết
    this.killText = document.createElement("div");
    baseStyle(this.killText);
    this.killText.style.color = "#00ff99";
    this.killText.style.textShadow = "0 0 8px #00ffcc";


    // ===== APPEND =====
    this.container.appendChild(this.hpText);
    this.container.appendChild(this.ammoText);
    this.container.appendChild(this.speedText);
    this.container.appendChild(this.killText);


    document.body.appendChild(this.container);
  }


  show() {
    this.container.style.display = "block";
    this.isVisible = true;
  }


  hide() {
    this.container.style.display = "none";
    this.isVisible = false;
  }


  update(player, killCount = 0) {
    if (!this.isVisible || !player) return;


    // ===== HP =====
    this.hpText.innerText = `❤️ HP: ${player.hp}`;


    // ===== AMMO =====
    let ammo = player.ammo;
    if (player.weapon && player.weapon.ammo !== undefined) {
      ammo = player.weapon.ammo;
    }
    this.ammoText.innerText = `🔫 Ammo: ${ammo}`;


    // ===== SPEED =====
    this.speedText.innerText = `⚡ Speed: ${player.speed || 10}`;

    // ===== KILL COUNT =====
    this.killText.innerText = `💀 Kills: ${killCount}`;
  }
}
