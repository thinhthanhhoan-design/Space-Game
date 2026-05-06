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

    // === CINEMATIC BARS ===
    this.topBar = document.createElement("div");
    this.bottomBar = document.createElement("div");
    [this.topBar, this.bottomBar].forEach(bar => {
        bar.style.position = "fixed";
        bar.style.left = "0";
        bar.style.width = "100%";
        bar.style.height = "12vh";
        bar.style.background = "#000";
        bar.style.zIndex = "1500";
        bar.style.transition = "transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)";
    });
    this.topBar.style.top = "0";
    this.topBar.style.transform = "translateY(-100%)";
    this.bottomBar.style.bottom = "0";
    this.bottomBar.style.transform = "translateY(100%)";
    document.body.appendChild(this.topBar);
    document.body.appendChild(this.bottomBar);

    // === TUTORIAL KEYBOARD UI ===
    this.tutorialContainer = document.createElement("div");
    this.tutorialContainer.style.position = "fixed";
    this.tutorialContainer.style.top = "65%";
    this.tutorialContainer.style.left = "50%";
    this.tutorialContainer.style.transform = "translate(-50%, -50%)";
    this.tutorialContainer.style.zIndex = "1600";
    this.tutorialContainer.style.display = "flex";
    this.tutorialContainer.style.flexDirection = "column";
    this.tutorialContainer.style.alignItems = "center";
    this.tutorialContainer.style.gap = "10px";
    this.tutorialContainer.style.opacity = "0";
    this.tutorialContainer.style.transition = "opacity 0.5s, transform 0.5s";
    this.tutorialContainer.style.pointerEvents = "none";
    document.body.appendChild(this.tutorialContainer);

    const createKey = (letter) => {
        const k = document.createElement("div");
        k.innerText = letter;
        k.style.width = "60px";
        k.style.height = "60px";
        k.style.background = "rgba(0, 0, 0, 0.7)";
        k.style.border = "2px solid #00ffff";
        k.style.borderRadius = "8px";
        k.style.color = "#00ffff";
        k.style.fontFamily = "Orbitron, sans-serif";
        k.style.fontSize = "24px";
        k.style.fontWeight = "bold";
        k.style.display = "flex";
        k.style.justifyContent = "center";
        k.style.alignItems = "center";
        k.style.boxShadow = "0 0 10px rgba(0, 255, 255, 0.5)";
        k.style.transition = "all 0.2s";
        return k;
    };

    const row1 = document.createElement("div");
    this.keyW = createKey("W");
    row1.appendChild(this.keyW);

    const row2 = document.createElement("div");
    row2.style.display = "flex";
    row2.style.gap = "10px";
    this.keyA = createKey("A");
    this.keyS = createKey("S");
    this.keyD = createKey("D");
    row2.appendChild(this.keyA);
    row2.appendChild(this.keyS);
    row2.appendChild(this.keyD);

    this.tutorialContainer.appendChild(row1);
    this.tutorialContainer.appendChild(row2);

    // Space Key
    this.spaceKeyContainer = document.createElement("div");
    this.spaceKeyContainer.style.position = "fixed";
    this.spaceKeyContainer.style.top = "65%";
    this.spaceKeyContainer.style.left = "50%";
    this.spaceKeyContainer.style.transform = "translate(-50%, -50%) scale(0.8)";
    this.spaceKeyContainer.style.zIndex = "1600";
    this.spaceKeyContainer.style.opacity = "0";
    this.spaceKeyContainer.style.transition = "all 0.3s";
    this.spaceKeyContainer.style.pointerEvents = "none";
    
    this.keySpace = document.createElement("div");
    this.keySpace.innerText = "[ SPACE ] - KHAI HOẢ";
    this.keySpace.style.padding = "15px 40px";
    this.keySpace.style.background = "rgba(0, 204, 255, 0.2)";
    this.keySpace.style.border = "2px solid #00ccff";
    this.keySpace.style.borderRadius = "8px";
    this.keySpace.style.color = "#00ccff";
    this.keySpace.style.fontFamily = "Orbitron, sans-serif";
    this.keySpace.style.fontSize = "20px";
    this.keySpace.style.fontWeight = "bold";
    this.keySpace.style.textShadow = "0 0 10px #00ccff";
    this.keySpace.style.boxShadow = "0 0 15px #00ccff";
    
    this.spaceKeyContainer.appendChild(this.keySpace);
    document.body.appendChild(this.spaceKeyContainer);
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
    if (duration > 0) {
        this.messageTimeout = setTimeout(() => {
            this.hideMessage();
        }, duration);
    }
  }

  hideMessage() {
    this.messageContainer.style.opacity = "0";
    this.messageContainer.style.transform = "translate(-50%, -50%) scale(1)";
  }

  showCinematicBars() {
    this.topBar.style.transform = "translateY(0)";
    this.bottomBar.style.transform = "translateY(0)";
    this.container.style.opacity = "0";
    this.container.style.pointerEvents = "none";
  }

  hideCinematicBars() {
    this.topBar.style.transform = "translateY(-100%)";
    this.bottomBar.style.transform = "translateY(100%)";
    this.container.style.opacity = "1";
    this.container.style.pointerEvents = "auto";
    this.container.style.transition = "opacity 0.5s";
  }

  showTutorialWASD() {
    // Reset key styles
    [this.keyW, this.keyA, this.keyS, this.keyD].forEach(k => {
        k.style.background = "rgba(0, 0, 0, 0.7)";
        k.style.borderColor = "#00ffff";
        k.style.color = "#00ffff";
        k.style.boxShadow = "0 0 10px rgba(0, 255, 255, 0.5)";
        k.style.transform = "scale(1)";
    });
    this.tutorialContainer.style.opacity = "1";
    this.tutorialContainer.style.transform = "translate(-50%, -50%) scale(1)";
  }

  updateTutorialKey(keyStr) {
    const activeStyle = (el) => {
        if (el.style.borderColor === "rgb(0, 255, 0)" || el.style.borderColor === "#00ff00") return;
        el.style.background = "rgba(0, 255, 0, 0.3)";
        el.style.borderColor = "#00ff00";
        el.style.color = "#00ff00";
        el.style.boxShadow = "0 0 20px #00ff00";
        el.style.transform = "scale(0.9)";
        setTimeout(() => el.style.transform = "scale(1)", 150);
    };
    if (keyStr === 'w') activeStyle(this.keyW);
    if (keyStr === 'a') activeStyle(this.keyA);
    if (keyStr === 's') activeStyle(this.keyS);
    if (keyStr === 'd') activeStyle(this.keyD);
  }

  hideTutorialWASD() {
    this.tutorialContainer.style.opacity = "0";
    this.tutorialContainer.style.transform = "translate(-50%, -50%) scale(1.2)";
  }

  showTutorialSpace() {
    this.spaceKeyContainer.style.opacity = "1";
    this.spaceKeyContainer.style.transform = "translate(-50%, -50%) scale(1)";
    
    if (!this._pulseInterval) {
        this._pulseInterval = setInterval(() => {
            const s = this.keySpace.style;
            if (s.transform === "scale(1.1)") {
                s.transform = "scale(1)";
                s.boxShadow = "0 0 15px #00ccff";
                s.background = "rgba(0, 204, 255, 0.2)";
            } else {
                s.transform = "scale(1.1)";
                s.boxShadow = "0 0 30px #00ccff";
                s.background = "rgba(0, 204, 255, 0.4)";
            }
            s.transition = "all 0.2s";
        }, 300);
    }
  }

  hideTutorialSpace() {
    if (this._pulseInterval) {
        clearInterval(this._pulseInterval);
        this._pulseInterval = null;
    }
    this.spaceKeyContainer.style.opacity = "0";
    this.spaceKeyContainer.style.transform = "translate(-50%, -50%) scale(1.5)";
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
