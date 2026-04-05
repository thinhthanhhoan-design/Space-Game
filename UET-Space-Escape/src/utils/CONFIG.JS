/**
 * UET Space Escape - FINAL STANDARDIZED CONFIG
 * Mode: Method B (Z-Axis Movement)
 * Lead: Linh
 */

export const CONFIG = {
  // ===============================
  // 📂 ASSETS PATHS
  // ===============================
  ASSETS: {
    MODELS: {
      UET_LOGO: "PROCEDURAL", // Dùng hạt (particles) thay cho model logo
      PLAYER_V1: "/models/uete_3637.glb",
      PLAYER_V2: "PROCEDURAL",
      PLAYER_V3: "PROCEDURAL",
      ENEMY_1: "PROCEDURAL",
      BOSS_1: "PROCEDURAL",
      BOSS_2: "PROCEDURAL",
      BOSS_3: "PROCEDURAL",
      ASTEROID: "PROCEDURAL",
    },
    TEXTURES: {
      SPACE_BG: "/textures/nebula_dark.jpg",
      PARTICLE: "/textures/star_glow.png",
      BUBBLE: "/textures/gas_bubble.png",
    },
    SOUNDS: {
      BGM_INTRO: "/sounds/mysterious_space.mp3",
      BGM_BATTLE: "/sounds/battle_theme.mp3",
      SFX_LASER: "/sounds/laser_shoot.wav",
      SFX_EXPLOSION: "/sounds/explosion.mp3",
    },
    FONTS: "/assets/fonts/Orbitron_Regular.json",
  },

  // ===============================
  // 🎬 CINEMATIC & STORY (10-13s)
  // ===============================
  CINEMATIC: {
    INTRO_DURATION: 13,
    LOGO_PARTICLE_COUNT: 5000,
    TEXTS: [
      { time: 0, content: "Năm 2147: Nhân loại chinh phục liên sao..." },
      { time: 3, content: "Tàu UETE-3637 tiến vào 'Vùng Tối'..." },
      { time: 6, content: "CẢNH BÁO: Tín hiệu lạ phát hiện!" },
      { time: 9, content: "Hệ thống AI vô hiệu hóa. Đang rơi tự do..." },
    ],
  },

  // ===============================
  // 🚀 MOVEMENT & PHYSICS (METHOD B)
  // ===============================
  ENGINE: {
    TYPE: "FORWARD_PROGRESSION",
    FORWARD_SPEED: 0.175, // Tăng tốc độ bay cho phù hợp không gian rộng
    FLIGHT_ENVELOPE: {
      X: 12, // Mở rộng không gian bay ngang
      Y: 7,  // Mở rộng không gian bay dọc
    },
    // Thông số cho hiệu ứng nghiêng thế giới
    DYNAMIC_BANKING: {
      WORLD_ROLL_LIMIT: Math.PI / 10, // Thế giới nghiêng tối đa ~18 độ
      SMOOTHNESS: 0.05,               // Độ mượt khi xoay (Lerp factor)
      HORIZON_SHIFT: 0.2              // Camera lệch nhẹ sang ngang khi rẽ
    },
    ROTATION_LIMITS: {
      ROLL: Math.PI / 4,   // Tàu nghiêng hẳn 45 độ cho máu!
      PITCH: Math.PI / 12, 
      LERP: 0.1            
    }
  },

  // ===============================
  // 🎥 CAMERA SYSTEM
  // ===============================
  CAMERA: {
    FOV: 75,
    FOLLOW_LERP: 0.05,
    OFFSET: { x: 0, y: 1.2, z: 5 },
    SHAKE_INTENSITY: 0.3
  },

  // ===============================
  // 👤 PLAYER STATS (Đã xử lý cơ chế thoái hóa & tiêu tốn đạn)
  // ===============================
  PLAYER: {
    INITIAL_HP: 250, 
    MODELS: {
      V1: { hp_limit: 250, name: "UETE-3637", next_model: null },
      V2: { hp_limit: 300, name: "Asterum-Enemy-Mod", next_model: "V1", REVERT_AT: 0.7 },
      V3: { hp_limit: 350, name: "UETE-Final-Form", next_model: "V2", REVERT_AT: 0.7 },
    },
    WEAPONS: {
      GUN_1: { damage: 25, ammo: 100, fireRate: 0.4, ammo_per_shot: 1 },
      GUN_2: { damage: 50, ammo: 50,  fireRate: 0.3, ammo_per_shot: 2 }, 
      GUN_3: { damage: 45, ammo: 120, fireRate: 0.2, ammo_per_shot: 3 }, 
    }
  },

  // ===============================
  // 👾 ENEMIES & BOSSES
  // ===============================
  ENEMIES: {
    QUAI_1: { HP: 50, DAMAGE: 10 },
    BOSS_1: { 
      HP: 500, 
      ATTACK_INTERVAL: 5, 
      DAMAGE: 30, 
      LIMIT: 3, 
      RETREAT_Z: -50 
    },
    BOSS_2: { 
      HP: 500, 
      LASER_DAMAGE: 15, 
      REINFORCE_HP: 250, 
      REINFORCE_DAMAGE: 25, 
      SPAWN_QUAI_COUNT: 3 
    },
    BOSS_3: { 
      HP: 600, 
      DODGE: 0.4, 
      SHOCK_TRIGGER: 300, 
      SLOW: 0.5, 
      DAMAGE_PER_HIT: 45 
    }
  },

  // ===============================
  // ☄️ WORLD & ENVIRONMENT
  // ===============================
  WORLD: {
    SPAWN_DISTANCE_Z: -150, 
    DESPAWN_DISTANCE_Z: 20,  
    
    LEVEL_1: { 
      asteroid_speed: 0.015, 
      asteroid_density: 5, // Xóa hết thiên thạch (Mật độ = 0)
      FINAL_DASH: {
        trigger: "boss_1_retreat", 
        duration: 8,              
        density: 25,              
        text: "Hệ thống AI: Đang tiến vào đai thiên thạch vành khổng lồ!"
      }
    },
    LEVEL_2: { 
      asteroid_speed: 0.03, 
      asteroid_density: 15, 
      bubble_dmg: 5 
    },
    LEVEL_3: { 
      asteroid_speed: 0.05, 
      asteroid_density: 25 
    }
  },

  // ===============================
  // 🎮 GAME STATES
  // ===============================
  STATE: {
    MENU: "START_MENU",
    INTRO: "CINEMATIC_INTRO",
    PLAYING: "GAME_PLAYING",
    ENDING: "GAME_ENDING",
    GAMEOVER: "GAME_OVER"
  }
};