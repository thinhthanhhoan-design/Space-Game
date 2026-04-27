import { CONFIG } from '../../utils/CONFIG.JS';

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
    this.hpContainer = document.createElement("div");
    baseStyle(this.hpContainer);
    
    this.hpText = document.createElement("div");
    this.hpText.style.color = "#00ffcc"; // xanh
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


    // ===== AMMO =====  // Đạn
    this.ammoText = document.createElement("div");
    baseStyle(this.ammoText);
    this.ammoText.style.color = "#ffd633"; // vàng
    this.ammoText.style.textShadow = "0 0 8px #ffaa00";


    // ===== LEVEL & SHIP INFO ====
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
    
    // Thêm các thành phần vào container chính
    this.container.appendChild(this.hpContainer);
    this.container.appendChild(this.ammoText);
    this.container.appendChild(this.infoContainer);

    // ===== BOSS HP BAR (GÓC PHẢI) =====
    this.bossHpContainer = document.createElement("div");
    this.bossHpContainer.style.position = "fixed";
    this.bossHpContainer.style.top = "70px"; // Đặt dưới FPS
    this.bossHpContainer.style.right = "20px";
    this.bossHpContainer.style.width = "300px";
    this.bossHpContainer.style.background = "rgba(0,0,0,0.6)";
    this.bossHpContainer.style.padding = "10px";
    this.bossHpContainer.style.borderRadius = "10px";
    this.bossHpContainer.style.border = "1px solid #ff3333";
    this.bossHpContainer.style.backdropFilter = "blur(10px)";
    this.bossHpContainer.style.display = "none"; // Ẩn mặc định
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

    // Thanh bóng mờ (tụt chậm)
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
    
    // ===== FPS COUNTER (GÓC PHẢI) =====
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

    // ===== MESSAGE NOTIFICATION =====
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

  // Hiển thị thông báo trên màn hình
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


  update(player, levelKey = 'LEVEL_1') {
    if (!this.isVisible || !player) return;

    // HP
    if (this.maxHP === 0 && player.hp > 0) {
        this.maxHP = player.hp;
        this.currentHP = player.hp;
    }
    const displayHP = Math.max(0, player.hp);
    this.hpText.innerText = `❤️ HP: ${displayHP} / ${this.maxHP}`;
    const hpPercent = Math.max(0, player.hp / this.maxHP);
    
    // Cập nhật thanh máu đồ họa
    this.hpBar.style.width = (hpPercent * 100) + '%';
    setTimeout(() => {
        if (this.hpDamageBar) this.hpDamageBar.style.width = (hpPercent * 100) + '%';
    }, 200);

    // Đổi màu khi máu thấp
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
    
    // AMMO
    const ammo = (player.weapon && player.weapon.ammo !== undefined) ? player.weapon.ammo : player.ammo;
    this.ammoText.innerText = `🔫 Số đạn: ${ammo}`;

    // INFO (Level & Ship)
    this.levelText.innerText = `📍 Màn: ${levelKey}`;
    
    // Lấy tên mô hình từ CONFIG dựa trên key của player (ví dụ: PLAYER_V1 -> V1 -> UETE-3637)
    const modelKey = player.modelKey || 'PLAYER_V1';
    const vKey = modelKey.replace('PLAYER_', ''); // Lấy 'V1'
    const shipName = CONFIG.PLAYER.MODELS[vKey]?.name || modelKey;
    
    this.modelText.innerText = `🚀 Tàu: ${shipName}`;
  }


  // ===== BOSS UI CONTROL =====
  showBossHP(name = "TRÙM CUỐI") {
    this.bossHpContainer.style.display = "block";
    this.bossNameText.innerText = `⚠️ BOSS: ${name}`;
    this.bossHpBar.style.width = "100%";
  }

  updateBossHP(current, max) {
    const percent = Math.max(0, (current / max) * 100);
    this.bossHpBar.style.width = percent + "%";
    
    // Hiệu ứng thanh ảo (damage trail) tụt chậm hơn thanh thật
    setTimeout(() => {
        if (this.bossHpDamageBar) {
            this.bossHpDamageBar.style.width = percent + "%";
        }
    }, 300); // Trễ 0.3 giây
  }

  hideBossHP() {
    this.bossHpContainer.style.display = "none";
  }

  // ===== FPS UPDATE =====
  updateFPS(delta) {
    if (!this.fpsText || delta <= 0) return;
    
    // Khởi tạo mảng lưu mẫu nếu chưa có
    if (!this.fpsSamples) this.fpsSamples = [];
    this.fpsSamples.push(delta);

    // Giới hạn bộ nhớ: Lưu tối đa 600 mẫu (tương đương ~10 giây ở 60 FPS)
    if (this.fpsSamples.length > 600) {
      this.fpsSamples.shift();
    }

    // Chỉ cập nhật hiển thị lên UI sau mỗi 30 khung hình (~0.5 giây) để tránh loạn mắt
    this.fpsUpdateTimer = (this.fpsUpdateTimer || 0) + 1;
    if (this.fpsUpdateTimer >= 30) {
      this.fpsUpdateTimer = 0;
      
      // Tính trung bình cộng (Mean) của các mẫu delta
      const sumDelta = this.fpsSamples.reduce((a, b) => a + b, 0);
      const avgDelta = sumDelta / this.fpsSamples.length;
      const fps = Math.round(1 / avgDelta);
      
      this.fpsText.innerText = `FPS: ${fps}`;
      
      // Đổi màu dựa trên hiệu năng trung bình
      if (fps < 30) this.fpsText.style.color = "#ff3333";
      else if (fps < 50) this.fpsText.style.color = "#ffff33";
      else this.fpsText.style.color = "#00ff00";
    }
  }
}
