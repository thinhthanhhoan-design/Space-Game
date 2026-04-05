/**
 * UET Space Escape - FINAL STANDARDIZED CONFIG
 * Mode: Method B (Z-Axis Movement)
 */

export const CONFIG = {
  // ===============================
  // 📂 ASSETS PATHS
  // ===============================
  ASSETS: {
    MODELS: {
      PLAYER_V1: "/models/uete_3637.glb",
      PLAYER_V2: "/models/captured_ship.glb",
      PLAYER_V3: "/models/advanced_ship.glb",
      ENEMY_1: "/models/drone_enemy.glb",
      BOSS_1: "/models/boss_level1.glb",
      BOSS_2: "/models/boss_level2.glb",
      BOSS_3: "/models/boss_level3.glb",
      ASTEROID: "/models/asteroid.glb",
    },
    TEXTURES: {
      UET_LOGO: "/textures/uet_logo.png",
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
    FORWARD_SPEED: 0.5, // Tốc độ tiến vào trục Z
    
    // Giới hạn tàu trong Window (tính theo World Units)
    // Tương đương với việc ép tàu không bay ra khỏi tầm nhìn camera
    FLIGHT_ENVELOPE: {
      X: 4.5, // Giới hạn trái/phải (Window Width quy đổi)
      Y: 2.5, // Giới hạn lên/xuống (Window Height quy đổi)
    },

    // Hiệu ứng nghiêng cho dân Design (Roll/Pitch)
    ROTATION_LIMITS: {
      ROLL: Math.PI / 6,   // Nghiêng 30 độ khi rẽ
      PITCH: Math.PI / 12, // Ngóc đầu 15 độ
      LERP: 0.1            // Độ mượt chuyển động
    }
  },

  // ===============================
  // 🎥 CAMERA SYSTEM (First Person)
  // ===============================
  CAMERA: {
    FOV: 75,
    FOLLOW_LERP: 0.05,    // Độ trễ camera tạo cảm giác tốc độ
    OFFSET: { x: 0, y: 1.2, z: 5 }, // Vị trí camera so với tâm tàu
    SHAKE_INTENSITY: 0.3
  },

  // ===============================
  // 👤 PLAYER STATS
  // ===============================
  PLAYER: {
    INITIAL_HP: 350, // Bắt đầu ở V3 luôn chẳng hạn
    MODELS: {
      V1: { hp_limit: 250, name: "UETE-3637", next_model: null },
      V2: { hp_limit: 300, name: "Asterum-Enemy-Mod", next_model: "V1", REVERT_AT: 0.7 },
      V3: { hp_limit: 350, name: "UETE-Final-Form", next_model: "V2", REVERT_AT: 0.7 },
    },
    WEAPONS: {
      GUN_1: { damage: 25, ammo: 100, fireRate: 0.4, ammo_per_shot: 1 },
      GUN_2: { damage: 50, ammo: 50,  fireRate: 0.3, ammo_per_shot: 2 }, // Trừ 2 viên/lần
      GUN_3: { damage: 45, ammo: 120, fireRate: 0.2, ammo_per_shot: 3 }, // Trừ 3 viên/lần
    }
  },

  // ===============================
  // 👾 ENEMIES & BOSSES
  // ===============================
  ENEMIES: {

    QUAI_1: { 
      HP: 50, 
      DAMAGE: 10 
    },

    BOSS_1: { 
      HP: 500, 
      ATTACK_INTERVAL: 5, 
      DAMAGE: 30, // Sát thương quả cầu
      LIMIT: 3,   // Bắn 3 quả rồi rút lui
      RETREAT_Z: -50 
    },

    BOSS_2: { 
      HP: 500, 
      LASER_DAMAGE: 15, 
      SPAWN_QUAI_COUNT: 3,
      
      // Quân tiếp viện (Máy bay địch)
      REINFORCE: {
        HP: 250,
        BEAMS: 2,
        DAMAGE_PER_BEAM: 13, // Tổng 26 mỗi lượt bắn
        FIRE_RATE: 0.5
      }

    },

    BOSS_3: { 
      HP: 600, 
      DODGE_CHANCE: 0.4, 
      SHOCK_TRIGGER_HP: 300, 
      SLOW_FACTOR: 0.5, 
      
      // Hỏa lực súng 3 tia
      ATTACK: {
        BEAMS: 3,
        DAMAGE_PER_BEAM: 15, // Tổng 45 nếu trúng trọn gói
      }
    }
  },

  // ===============================
  // ☄️ WORLD & ENVIRONMENT
  // ===============================
  WORLD: {
    SPAWN_DISTANCE_Z: -150, // Khoảng cách spawn trước mặt tàu
    DESPAWN_DISTANCE_Z: 20,  // Khoảng cách xóa sau lưng tàu
    
    LEVEL_1: { asteroid_speed: 0.015, asteroid_density: 10 }, // Speed = 0 vì tàu tự tiến
    LEVEL_2: { asteroid_speed: 0.03, asteroid_density: 15, bubble_dmg: 5 },
    LEVEL_3: { asteroid_speed: 0.055, asteroid_density: 25 },
  },

  LEVEL_1: { 
      asteroid_speed: 0, 
      asteroid_density: 10,
      FINAL_DASH: {
        trigger: "boss_1_retreat", // Kích hoạt khi boss rút
        duration: 8,              // Kéo dài 8 giây
        density: 25,              // Mật độ dày đặc
        text: "Boss 1 đã rút lui nhưng nó đã dẫn dụ chúng ta vào lõi của đai thiên thạch! Tập trung điều khiển, chúng ta phải vượt qua khu vực này ngay lập tức!"
      }
    },

  // ... (Phần ITEMS và STATE giữ nguyên như bản trước)
};

