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
      PLAYER_V1: "/models/Tau.glb",
      PLAYER_V2: "PROCEDURAL",
      PLAYER_V3: "PROCEDURAL",
      ENEMY_1: "/models/Monster 1.glb",
      BOSS_1: "/models/Boss 1.2.glb",
      BOSS_2: "/models/Boss_2.glb",
      BOSS_3: "/models/Boss_3.glb",
      ASTEROID: "PROCEDURAL",
    },
    TEXTURES: {
      SPACE_BG: "/textures/nebula_dark.jpg",
      PARTICLE: "/textures/star_glow.png",
      BUBBLE: "/textures/gas_bubble.png",
      ITEM_SECURITY: "/textures/bao_ve.png",
      ITEM_HP: "/textures/HP.png",
      ITEM_DAN: "/textures/dan.png",
      ITEM_KHOA_VK: "/textures/khoa_vk.png",
      ITEM_THIEN_THACH: "/textures/thien_thach.png",
      ITEM_Sung2: "/textures/sung_2.png",
      ITEM_Sung3: "/textures/sung_3.png",
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

    SHOTS: [
      {
        id: "shot1",
        start: 0,
        end: 3,
        text: "Năm 2147: Nhân loại chinh phục không gian...",
        camera: {
          pos: [0, 3, 10],
          lookAt: [0, 0, 0],
          fov: 75,
        },
      },
      {
        id: "shot2",
        start: 3,
        end: 6,
        text: "Tàu UETệ-3637 tiến vào Vùng Tối...",
        camera: {
          pos: [3, 2, 10],
          lookAt: [0, 0, -3],
          fov: 70,
        },
      },
      {
        id: "shot3",
        start: 6,
        end: 9,
        text: "Cảnh báo: tín hiệu lạ phát hiện!",
        camera: {
          pos: [-3, 2, 8],
          lookAt: [0, 0, -5],
          fov: 80,
        },
        shake: true,
      },
      {
        id: "shot4",
        start: 9,
        end: 13,
        text: "Hệ thống AI bị vô hiệu hoá. Đang rơi tự do...",
        camera: {
          pos: [0, 3, 10],
          lookAt: [0, 0, 0],
          fov: 75,
        },
      },
    ],
  },

  // ===============================
  // 🚀 MOVEMENT & PHYSICS (METHOD B)
  // ===============================
  ENGINE: {
    TYPE: "FORWARD_PROGRESSION",
    FORWARD_SPEED: 0.75, // Tăng lên 0.75 để tàu linh hoạt hơn với hệ thống velocity mới
    FLIGHT_ENVELOPE: {
      X: 70, // Mở rộng không gian bay ngang ra xa hơn để thoải mái né đạn
      Y: 20, // Khôn gian bay lên xuống tha hồ lạng lách
    },
    // Thông số cho hiệu ứng nghiêng thế giới
    DYNAMIC_BANKING: {
      WORLD_ROLL_LIMIT: Math.PI / 10, // Thế giới nghiêng tối đa ~18 độ
      SMOOTHNESS: 0.05,               // Độ mượt khi xoay (Lerp factor)
      HORIZON_SHIFT: 0.2              // Camera lệch nhẹ sang ngang khi rẽ
    },
    ROTATION_LIMITS: {
      ROLL: Math.PI / 4,   // Tàu nghiêng hẳn 45 độ cho máu!
      PITCH: Math.PI / 8,  // Tăng góc ngóc/chúi lên 22.5 độ (cũ: 15 độ) để nhìn rõ rệt hơn
      LERP: 0.1
    }
  },

  // ===============================
  // 🎥 CAMERA SYSTEM
  // ===============================
  CAMERA: {
    FOV: 75,
    FOLLOW_LERP: 0.05,
    OFFSET: { x: 0, y: 3.0, z: 6.0 },
    SHAKE_INTENSITY: 0.3
  },

  // ===============================
  // 👤 PLAYER STATS (Đã xử lý cơ chế thoái hóa & tiêu tốn đạn)
  // ===============================
  PLAYER: {
    INITIAL_HP: 300,
    MODELS: {
      V1: { hp_limit: 300, name: "UETE-3637", next_model: null },
      V2: { hp_limit: 300, name: "Asterum-Enemy-Mod", next_model: "V1", REVERT_AT: 0.7 },
      V3: { hp_limit: 350, name: "UETE-Final-Form", next_model: "V2", REVERT_AT: 0.7 },
    },
    WEAPONS: {
      GUN_1: { damage: 25, ammo: 100, fireRate: 0.4, ammo_per_shot: 1 },
      GUN_2: { damage: 50, ammo: 200, fireRate: 0.3, ammo_per_shot: 2 },
      GUN_3: { damage: 45, ammo: 500, fireRate: 0.2, ammo_per_shot: 3 },
    }
  },

  // ===============================
  // 👾 ENEMIES & BOSSES
  // ===============================
  ENEMIES: {
    QUAI_1: { HP: 50, DAMAGE: 10, BULLET_SPEED: 0.8 },
    BOSS_1: {
      HP: 300,
      ATTACK_INTERVAL: 5,
      DAMAGE: 30,
      BULLET_SPEED: 1.5,      // Tốc độ bắn đạn thường/cầu
      HOMING_SPEED: 5,      // Tốc độ bắn đạn tự nhắm
      LIMIT: 1,
      RETREAT_Z: -50
    },
    BOSS_2: {
      // HP: 500,
      HP: 600,
      LASER_DAMAGE: 15,
      //REINFORCE_HP: 250,
      //REINFORCE_DAMAGE: 25,
      BULLET_SPEED: 0.6,
      SPREAD_DAMAGE: 20,
      SPAWN_QUAI_COUNT: 3,
      SPAWN_INTERVAL: 10
    },
    BOSS_3: {
      // HP: 600,
      HP: 1000,
      DODGE: 0.4,
      //SHOCK_TRIGGER: 300,
      SHOCKWAVE_COOLDOWN: 6,
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
      asteroid_speed: 0.04, // Tăng tốc độ bay hơi nhanh hơn
      asteroid_density: 35, // Tăng mật độ lên gấp đôi
      asteroid_damage: 50, // Sát thương -50hp
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
  // 🎁 ITEMS & POWERUPS
  // ===============================
  ITEMS: {
    SPAWN_INTERVAL: 6.5,      // Cứ 6.5s spawn 1 item ngẫu nhiên
    SPEED_FACTOR: 0.5,        // Tốc độ bay (0.5 = chậm hơn thiên thạch 1 nửa)
    SCALE_BASE: 3.0,          // Tăng gấp đôi kích thước cơ bản (cũ: 1.5)
    GLOW_OPACITY: 1.0,        // Tăng độ rực tối đa (cũ: 0.8)
    EDGE_GLOW_OPACITY: 0.8,   // Tăng độ sáng viền trắng (cũ: 0.5)
    LIGHT_INTENSITY: 10,      // Cường độ ánh sáng (cũ: 5)
    LIGHT_RANGE: 25,          // Tầm chiếu sáng (cũ: 10)
    COLLECTION_RADIUS: 4,   // Bán kính va chạm nhặt đồ (Tăng lên 3.5 để nhặt đồ dễ hơn)

    // --- Chỉ số Buff ---
    HEALTH_VALUE: 100,        // Máu hồi phục
    AMMO_REFILL_PERCENT: 0.5, // Nạp lại 50% số lượng đạn tối đa
    SHIELD_DURATION: 5000,   // Thời gian giáp bảo vệ (5 giây)

    // --- Chỉ số Debuff ---
    WEAPON_LOCK_DURATION: 7000, // Thời gian khóa súng (7 giây)
    ENV_DISORDER_DURATION: 10000, // Thời gian rối loạn môi trường (10 giây)
    ASTEROID_STORM: {
      SPEED_MULT: 2.5,      // Thiên thạch bay nhanh gấp 2.5 lần
      DENSITY_MULT: 5.0      // Mật độ thiên thạch dày gấp 5 lần
    },

    SPAWN_RANGE_FACTOR: 1.8,  // Hệ số thu hẹp vùng spawn (X, Y)
    ANIM_DURATION: 0.2,       // Thời gian chuyển màu GSAP
    SHAKE_INTENSITY: 1.5,     // Độ mạnh rung camera

    COLORS: {
      BUFF: 0x00ff00,
      DEBUFF: 0xff2200,
      NEUTRAL: 0xaaaaaa       // Dùng khi đạn bắn trúng item
    },

    DROP_CHANCE: {
      ENEMY_BUFF: 0.3,        // 30% quái rơi đồ xịn
      ENEMY_DEBUFF: 0.1,      // 10% quái rơi đồ dỏm
      ASTEROID: 0.2           // 20% thiên thạch rơi đồ
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
