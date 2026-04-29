import { CONFIG } from '../../utils/CONFIG.JS';

export class UIManager {
  constructor() {
    this.isVisible = false;
    this.warningActive = false;
    this.warningTime = 0;
    this.warningDuration = 0;

    this.createWarningOverlay();

    // Container chính cho HUD
    this.container = document.createElement("div");
    this.container.id = "hud";
    this.container.style.position = "fixed";
    this.container.style.top = "20px";
    this.container.style.left = "20px";
    this.container.style.fontFamily = "Orbitron, sans-serif";
    this.container.style.fontSize = "18px";
    this.container.style.zIndex = "999";
    this.container.style.display = "none";

    const baseStyle = (el) => {
      el.style.marginBottom = "6px";
      el.style.padding = "6px 10px";
      el.style.borderRadius = "8px";
      el.style.background = "rgba(0,0,0,0.4)";
      el.style.backdropFilter = "blur(4px)";
      el.style.boxShadow = "0 0 8px rgba(255,255,255,0.2)";
    };

    // Hiển thị chỉ số HP
    this.hpContainer = document.createElement("div");
    baseStyle(this.hpContainer);
    
    this.hpText = document.createElement("div");
    this.hpText.style.color = "#00ffcc";
    this.hpText.style.textShadow = "0 0 8px #00ffcc";
    this.hpText.style.marginBottom = "5px";
    this.hpText.style.fontWeight = "bold";

    this.hpContainer.appendChild(this.hpText);

    this.hpBarWrapper = document.createElement("div");
    this.hpBarWrapper.style.width = "200px";
    this.hpBarWrapper.style.height = "12px";
    this.hpBarWrapper.style.background = "rgba(0,0,0,0.6)";
    this.hpBarWrapper.style.border = "1px solid #00ffcc";
    this.hpBarWrapper.style.borderRadius = "6px";
    this.hpBarWrapper.style.boxShadow = "inset 0 0 5px rgba(0,0,0,0.8)";
    this.hpBarWrapper.style.overflow = "hidden";
    this.hpBarWrapper.style.position = "relative";
    this.hpBarWrapper.style.marginTop = "4px";

    this.hpDamageBar = document.createElement("div");
    this.hpDamageBar.style.position = "absolute";
    this.hpDamageBar.style.top = "0";
    this.hpDamageBar.style.left = "0";
    this.hpDamageBar.style.height = "100%";
    this.hpDamageBar.style.width = "100%";
    this.hpDamageBar.style.background = "rgba(255,255,255,0.6)";
    this.hpDamageBar.style.transition = "width 0.5s ease-out";

    this.hpBar = document.createElement("div");
    this.hpBar.style.position = "absolute";
    this.hpBar.style.top = "0";
    this.hpBar.style.left = "0";
    this.hpBar.style.height = "100%";
    this.hpBar.style.width = "100%";
    this.hpBar.style.background = "linear-gradient(90deg, #009977, #00ffcc)";
    this.hpBar.style.boxShadow = "0 0 8px #00ffcc";
    this.hpBar.style.transition = "width 0.2s ease-out";

    this.hpBarWrapper.appendChild(this.hpDamageBar);
    this.hpBarWrapper.appendChild(this.hpBar);
    this.hpContainer.appendChild(this.hpBarWrapper);
    
    this.currentHP = 0;
    this.maxHP = 0;

    // Hiển thị đạn (Ammo)
    this.ammoText = document.createElement("div");
    baseStyle(this.ammoText);
    this.ammoText.style.color = "#ffd633";
    this.ammoText.style.textShadow = "0 0 8px #ffaa00";

    // Thông tin màn chơi và tàu
    this.infoContainer = document.createElement("div");
    baseStyle(this.infoContainer);
    this.infoContainer.style.color = "#00ccff";
    this.infoContainer.style.textShadow = "0 0 8px #00ccff";
    
    this.levelText = document.createElement("div");
    this.levelText.style.fontSize = "14px";
    this.levelText.style.opacity = "0.8";
    
    this.modelText = document.createElement("div");
    this.modelText.style.fontSize = "18px";
    this.modelText.style.fontWeight = "bold";
    this.modelText.style.marginTop = "2px";

    this.infoContainer.appendChild(this.levelText);
    this.infoContainer.appendChild(this.modelText);
    
    // Điểm số (Score)
    this.scoreText = document.createElement("div");
    baseStyle(this.scoreText);
    this.scoreText.style.color = "#ffffff";
    this.scoreText.style.fontSize = "22px";
    this.scoreText.style.fontWeight = "bold";
    this.scoreText.style.textShadow = "0 0 10px rgba(255,255,255,0.5)";
    this.scoreText.innerText = "✨ SCORE: 0";

    this.container.appendChild(this.hpContainer);
    this.container.appendChild(this.ammoText);
    this.container.appendChild(this.scoreText);
    this.container.appendChild(this.infoContainer);

    // Thanh máu Boss
    this.bossHpContainer = document.createElement("div");
    this.bossHpContainer.style.position = "fixed";
    this.bossHpContainer.style.top = "70px";
    this.bossHpContainer.style.right = "20px";
    this.bossHpContainer.style.width = "300px";
    this.bossHpContainer.style.background = "rgba(0,0,0,0.6)";
    this.bossHpContainer.style.padding = "10px";
    this.bossHpContainer.style.borderRadius = "10px";
    this.bossHpContainer.style.border = "1px solid #ff3333";
    this.bossHpContainer.style.backdropFilter = "blur(10px)";
    this.bossHpContainer.style.display = "none";
    this.bossHpContainer.style.zIndex = "1000";

    this.bossNameText = document.createElement("div");
    this.bossNameText.innerText = "⚠️ BOSS: TRÙM CUỐI";
    this.bossNameText.style.color = "#ff3333";
    this.bossNameText.style.fontSize = "16px";
    this.bossNameText.style.fontWeight = "bold";
    this.bossNameText.style.textAlign = "center";
    this.bossNameText.style.marginBottom = "8px";
    this.bossNameText.style.textShadow = "0 0 10px #ff3333";

    this.bossHpBarWrapper = document.createElement("div");
    this.bossHpBarWrapper.style.width = "100%";
    this.bossHpBarWrapper.style.height = "15px";
    this.bossHpBarWrapper.style.background = "rgba(255,0,0,0.1)";
    this.bossHpBarWrapper.style.border = "1px solid #ff3333";
    this.bossHpBarWrapper.style.borderRadius = "4px";
    this.bossHpBarWrapper.style.position = "relative";
    this.bossHpBarWrapper.style.overflow = "hidden";

    this.bossHpDamageBar = document.createElement("div");
    this.bossHpDamageBar.style.position = "absolute";
    this.bossHpDamageBar.style.top = "0";
    this.bossHpDamageBar.style.left = "0";
    this.bossHpDamageBar.style.width = "100%";
    this.bossHpDamageBar.style.height = "100%";
    this.bossHpDamageBar.style.background = "rgba(255, 255, 255, 0.7)";
    this.bossHpDamageBar.style.transition = "width 0.5s ease-out";

    this.bossHpBar = document.createElement("div");
    this.bossHpBar.style.position = "absolute";
    this.bossHpBar.style.top = "0";
    this.bossHpBar.style.left = "0";
    this.bossHpBar.style.width = "100%";
    this.bossHpBar.style.height = "100%";
    this.bossHpBar.style.background = "linear-gradient(90deg, #990000, #ff3333)";
    this.bossHpBar.style.transition = "width 0.15s ease-out";
    this.bossHpBar.style.boxShadow = "0 0 10px #ff3333";

    this.bossHpBarWrapper.appendChild(this.bossHpDamageBar);
    this.bossHpBarWrapper.appendChild(this.bossHpBar);
    this.bossHpContainer.appendChild(this.bossNameText);
    this.bossHpContainer.appendChild(this.bossHpBarWrapper);
    
    // FPS Counter
    this.fpsText = document.createElement("div");
    this.fpsText.id = "fps-counter";
    this.fpsText.style.position = "fixed";
    this.fpsText.style.top = "20px";
    this.fpsText.style.right = "20px";
    this.fpsText.style.fontFamily = "Orbitron, sans-serif";
    this.fpsText.style.fontSize = "14px";
    this.fpsText.style.color = "#00ff00";
    this.fpsText.style.textShadow = "0 0 5px #00ff00";
    this.fpsText.style.background = "rgba(0,0,0,0.5)";
    this.fpsText.style.padding = "5px 10px";
    this.fpsText.style.borderRadius = "5px";
    this.fpsText.style.zIndex = "1001";
    this.fpsText.innerText = "FPS: --";

    // Vùng hiển thị thông báo (Message Notification)
    this.messageContainer = document.createElement("div");
    this.messageContainer.style.position = "fixed";
    this.messageContainer.style.top = "50%";
    this.messageContainer.style.left = "50%";
    this.messageContainer.style.transform = "translate(-50%, -50%)";
    this.messageContainer.style.fontFamily = "Orbitron, sans-serif";
    this.messageContainer.style.fontSize = "32px";
    this.messageContainer.style.fontWeight = "bold";
    this.messageContainer.style.color = "#ffffff";
    this.messageContainer.style.textAlign = "center";
    this.messageContainer.style.pointerEvents = "none";
    this.messageContainer.style.zIndex = "2000";
    this.messageContainer.style.textShadow = "0 0 15px rgba(255,255,255,0.5)";
    this.messageContainer.style.opacity = "0";
    this.messageContainer.style.transition = "opacity 0.3s ease-out, transform 0.3s ease-out";
    
    document.body.appendChild(this.container);
    document.body.appendChild(this.bossHpContainer);
    document.body.appendChild(this.fpsText);
    document.body.appendChild(this.messageContainer);
  }

  // Tạo lớp phủ cảnh báo nguy hiểm (màu đỏ nhấp nháy)
  createWarningOverlay() {
    this.warningDOM = document.createElement("div");
    this.warningDOM.id = "flash-red-overlay";
    Object.assign(this.warningDOM.style, {
        position: "fixed",
        top: 0, left: 0, width: "100%", height: "100%",
        background: "radial-gradient(circle, transparent 60%, rgba(255, 0, 0, 0.4) 100%)",
        boxShadow: "inset 0 0 150px rgba(255, 0, 0, 0.6)",
        opacity: 0,
        pointerEvents: "none",
        zIndex: 10
    });
    document.body.appendChild(this.warningDOM);
  }

  startWarning(duration = 2.5) {
    this.warningActive = true;
    this.warningTime = 0;
    this.warningDuration = duration;
  }

  updateWarning(delta) {
    if (!this.warningActive || !this.warningDOM) return;

    this.warningTime += delta;
    const flash = Math.abs(Math.sin(this.warningTime * 12)); 
    this.warningDOM.style.opacity = (flash * 0.7).toString();

    if (this.warningTime > this.warningDuration) {
        this.warningActive = false;
        this.warningDOM.style.opacity = "0";
    }
  }

  // Hiển thị thông báo văn bản giữa màn hình
  showMessage(text, color = "#ffffff", duration = 2000) {
    this.messageContainer.innerText = text;
    this.messageContainer.style.color = color;
    this.messageContainer.style.textShadow = `0 0 20px ${color}`;
    this.messageContainer.style.opacity = "1";
    this.messageContainer.style.transform = "translate(-50%, -50%) scale(1.1)";

    if (this.messageTimeout) clearTimeout(this.messageTimeout);
    this.messageTimeout = setTimeout(() => {
        this.messageContainer.style.opacity = "0";
        this.messageContainer.style.transform = "translate(-50%, -50%) scale(1)";
    }, duration);
  }

  show() {
    this.container.style.display = "block";
    this.isVisible = true;
  }

  hide() {
    this.container.style.display = "none";
    this.isVisible = false;
  }

  // Cập nhật toàn bộ các thành phần trên HUD
  update(player, levelKey = 'LEVEL_1', delta = 0, score = 0) {
    if (delta > 0) this.updateWarning(delta);
    if (!this.isVisible || !player) return;

    if (this.maxHP === 0 && player.hp > 0) {
        this.maxHP = player.hp;
        this.currentHP = player.hp;
    }
    const displayHP = Math.max(0, player.hp);
    this.hpText.innerText = `❤️ HP: ${displayHP} / ${this.maxHP}`;
    const hpPercent = Math.max(0, player.hp / this.maxHP);
    
    this.hpBar.style.width = (hpPercent * 100) + '%';
    setTimeout(() => {
        if (this.hpDamageBar) this.hpDamageBar.style.width = (hpPercent * 100) + '%';
    }, 200);

    if (hpPercent < 0.3) {
        this.hpText.style.color = "#ff3333";
        this.hpBar.style.background = "linear-gradient(90deg, #cc0000, #ff3333)";
        this.hpBarWrapper.style.border = "1px solid #ff3333";
    } else {
        this.hpText.style.color = "#00ffcc";
        this.hpBar.style.background = "linear-gradient(90deg, #009977, #00ffcc)";
        this.hpBarWrapper.style.border = "1px solid #00ffcc";
    }

    this.currentHP = player.hp;  
    
    const ammo = (player.weapon && player.weapon.ammo !== undefined) ? player.weapon.ammo : player.ammo;
    this.ammoText.innerText = `🔫 Ammo: ${ammo}`;

    this.scoreText.innerText = `✨ SCORE: ${score.toLocaleString()}`;

    this.levelText.innerText = `📍 Level: ${levelKey.replace(/_/g, ' ')}`;
    
    const modelKey = player.modelKey || 'PLAYER_V1';
    const vKey = modelKey.replace('PLAYER_', '');
    const shipName = CONFIG.PLAYER.MODELS[vKey]?.name || modelKey;
    
    this.modelText.innerText = `🚀 Ship: ${shipName}`;
  }

  showBossHP(name = "TRÙM CUỐI") {
    this.bossHpContainer.style.display = "block";
    this.bossNameText.innerText = `⚠️ BOSS: ${name}`;
    this.bossHpBar.style.width = "100%";
  }

  updateBossHP(current, max) {
    const percent = Math.max(0, (current / max) * 100);
    this.bossHpBar.style.width = percent + "%";
    
    setTimeout(() => {
        if (this.bossHpDamageBar) {
            this.bossHpDamageBar.style.width = percent + "%";
        }
    }, 300);
  }

  hideBossHP() {
    this.bossHpContainer.style.display = "none";
  }

  // Cập nhật và hiển thị chỉ số FPS
  updateFPS(delta) {
    if (!this.fpsText || delta <= 0) return;
    
    if (!this.fpsSamples) this.fpsSamples = [];
    this.fpsSamples.push(delta);

    if (this.fpsSamples.length > 600) {
      this.fpsSamples.shift();
    }

    this.fpsUpdateTimer = (this.fpsUpdateTimer || 0) + 1;
    if (this.fpsUpdateTimer >= 30) {
      this.fpsUpdateTimer = 0;
      
      const sumDelta = this.fpsSamples.reduce((a, b) => a + b, 0);
      const avgDelta = sumDelta / this.fpsSamples.length;
      const fps = Math.round(1 / avgDelta);
      
      this.fpsText.innerText = `FPS: ${fps}`;
      
      if (fps < 30) this.fpsText.style.color = "#ff3333";
      else if (fps < 50) this.fpsText.style.color = "#ffff33";
      else this.fpsText.style.color = "#00ff00";
    }
  }
}
