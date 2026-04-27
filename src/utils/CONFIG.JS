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
    FORWARD_SPEED: 1, // Tăng lên 1 để tàu linh hoạt hơn với hệ thống velocity mới
    FLIGHT_ENVELOPE: {
      X: 70, // Mở rộng không gian bay ngang ra xa hơn để thoải mái né đạn
      Y: 30, // Khôn gian bay lên xuống tha hồ lạng lách
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
      V1: { hp_limit: 300, name: "Minh Kiên đzai", next_model: null },
    },
    WEAPONS: {
      GUN_1: { damage: 25, ammo: 100, fireRate: 0.4, ammo_per_shot: 1, bullet_speed: 1.5 },
      GUN_2: { damage: 75, ammo: 200, fireRate: 0.3, ammo_per_shot: 3, bullet_count: 3, spread_angle: 15 },
      GUN_3: { damage: 75, ammo: 500, fireRate: 0.2, ammo_per_shot: 3, bullet_count: 3, parallel_offset: 2.8, bullet_speed: 2.25 },
    }
  },

  // ===============================
  // 👾 ENEMIES & BOSSES
  // ===============================
  ENEMIES: {
    QUAI_1: { HP: 50, DAMAGE: 15, BULLET_SPEED: 2.5, MOVE_SPEED: 3.5 },
    BOSS_1: {
      HP: 300,
      ATTACK_INTERVAL: 5,
      DAMAGE: 30,
      BULLET_SPEED: 1.5,      // Tốc độ bắn đạn thường/cầu
      MOVE_SPEED: 3.0,        // Tốc độ di chuyển của boss
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
      HP: 1000,
      DODGE: 0.4,
      SHOCKWAVE_COOLDOWN: 10,
      SHOCKWAVE_COUNT: 5,           // Số lượng vòng sóng mỗi đợt
      SHOCKWAVE_INTERVAL: 0.5,      // Khoảng cách giữa các vòng (giây)
      SHOCKWAVE_Z_SPEED: 40,        // Tốc độ bay về phía màn hình
      SHOCKWAVE_GROWTH_SPEED: 80,   // Tốc độ nở to của vòng
      SHOCKWAVE_MAX_RADIUS: 150,    // Bán kính tối đa trước khi biến mất
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
      asteroid_speed: 0.06,
      asteroid_density: 50,
      bubble_dmg: 5
    },
    LEVEL_3: {
      asteroid_speed: 0.1,
      asteroid_density: 60
    }
  },

  // ===============================
  // 🎁 ITEMS & POWERUPS
  // ===============================
  ITEMS: {
    SPAWN_INTERVAL: 4.5,      // Cứ 4.5s spawn 1 item ngẫu nhiên (Giảm thêm để súng xuất hiện nhanh hơn)
    SPEED_FACTOR: 0.5,        // Tốc độ bay (0.5 = chậm hơn thiên thạch 1 nửa)
    SCALE_BASE: 3.0,          // Tăng gấp đôi kích thước cơ bản (cũ: 1.5)
    GLOW_OPACITY: 0.6,        // Giảm độ chói (cũ: 1.0)
    EDGE_GLOW_OPACITY: 0.4,   // Giảm độ sáng viền (cũ: 0.8)
    LIGHT_INTENSITY: 5,       // Giảm cường độ ánh sáng (cũ: 10)
    LIGHT_RANGE: 25,          // Tầm chiếu sáng (cũ: 10)
    COLLECTION_RADIUS: 4,   // Bán kính va chạm nhặt đồ (Tăng lên 3.5 để nhặt đồ dễ hơn)

    // --- Định nghĩa các loại Item ---
    TYPES: {
      HEALTH: { value: 100, texture: "ITEM_HP", chance: 0.3 },
      AMMO: { refill_percent: 0.5, texture: "ITEM_DAN", chance: 0.3 },
      SHIELD: { duration: 10000, texture: "ITEM_SECURITY", chance: 0.1 },
      // --- Vật phẩm nâng cấp Vũ khí ---
      WEAPON_2: { gun_key: "GUN_2", texture: "ITEM_Sung2", min_level: "LEVEL_2", duration: 10 }, // Chỉ xuất hiện từ Màn 2, duy trì 10s
      WEAPON_3: { gun_key: "GUN_3", texture: "ITEM_Sung3", min_level: "LEVEL_3", duration: 13 }, // Chỉ xuất hiện từ Màn 3, duy trì 13s
      WEAPON_LOCK: { duration: 7000, texture: "ITEM_KHOA_VK", chance: 0.05 },
      ASTEROID_ITEM: { duration: 10000, texture: "ITEM_THIEN_THACH", SPEED_MULT: 2.5, DENSITY_MULT: 5.0, chance: 0.1 }
    },

    SPAWN_RANGE_FACTOR: 1.8,  // Hệ số thu hẹp vùng spawn (X, Y) – kiểm soát độ rộng khu vực sinh vật phẩm
    ANIM_DURATION: 0.2,       // Thời gian chuyển màu GSAP – ảnh hưởng đến hiệu ứng item
    SHAKE_INTENSITY: 1.5,     // Độ mạnh rung camera – dùng trong các cảnh bối cảnh mạnh

    COLORS: {
      BUFF: 0x00ff00, // Màu xanh cho buff items
      DEBUFF: 0xff2200, // Màu đỏ cho debuff items
      NEUTRAL: 0xaaaaaa // Màu trung tính khi đạn chạm item
    } // End of COLORS config
  }, // End of ITEMS config

  // ===============================
  // 🎮 GAME STATES
  // ===============================
  STATE: {
    MENU: "START_MENU", // Trạng thái menu chính
    INTRO: "CINEMATIC_INTRO", // Intro cinematic
    PLAYING: "GAME_PLAYING", // Trò chơi đang chạy
    ENDING: "GAME_ENDING", // Kết thúc level / cutscene
    GAMEOVER: "GAME_OVER" // Khi người chơi thua
  } // End of STATE
};
