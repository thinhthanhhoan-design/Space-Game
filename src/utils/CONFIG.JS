/**
 * UET Space Escape - FINAL STANDARDIZED CONFIG
 * Mode: Method B (Z-Axis Movement)
 * Lead: Linh
 */

export const CONFIG = {
  // ===============================
  // ASSETS PATHS
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
      ASTEROID: "/models/meteorite.glb",
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
        text: "Tàu UETệ tiến vào Vùng Tối...",
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
      X: 70, // không gian bay ngang
      Y: 30, // Không gian bay lên xuống 
    },
    // Thông số cho hiệu ứng nghiêng thế giới
    DYNAMIC_BANKING: {
      WORLD_ROLL_LIMIT: Math.PI / 10, // Thế giới nghiêng tối đa ~18 độ
      SMOOTHNESS: 0.05,               // Độ mượt khi xoay (Lerp factor)
      HORIZON_SHIFT: 0.2              // Camera lệch nhẹ sang ngang khi rẽ
    },
    ROTATION_LIMITS: {
      ROLL: Math.PI / 4,   // Tàu nghiêng hẳn 45 độ
      PITCH: Math.PI / 8,  // Tăng góc ngóc/chúi lên 22.5 độ
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
      V1: { hp_limit: 300, name: "UETệ", next_model: null },
    },
    WEAPONS: {
      GUN_1: { damage: 25, ammo: 200, fireRate: 0.4, ammo_per_shot: 1, bullet_speed: 1.5 },
      GUN_2: { damage: 25, ammo: 200, fireRate: 0.3, ammo_per_shot: 2, bullet_count: 2, parallel_offset: 2.0 },
      GUN_3: { damage: 25, ammo: 500, fireRate: 0.2, ammo_per_shot: 3, bullet_count: 3, parallel_offset: 2.8, bullet_speed: 2.25 },
    }
  },

  // ===============================
  // 👾 ENEMIES & BOSSES
  // ===============================
  ENEMIES: {
    QUAI_1: { HP: 50, DAMAGE: 15, BULLET_SPEED: 2.5, MOVE_SPEED: 1.5, POINTS: 100 }, // Sẽ lấy từ SCORING.ENEMY_DEFAULT
    BOSS_1: {
      HP: 2500,
      ATTACK_INTERVAL: 5,
      DAMAGE: 30,
      BULLET_SPEED: 1.5,
      LIMIT: 1,
      RETREAT_Z: -50,
      POINTS: 5000
    },
    BOSS_2: {
      HP: 3000,
      LASER_DAMAGE: 15,
      BULLET_SPEED: 0.6,
      SPREAD_DAMAGE: 20,
      SPAWN_QUAI_COUNT: 3,
      SPAWN_INTERVAL: 5,
      POINTS: 10000
    },
    BOSS_3: {
      HP: 4000,
      DODGE: 0.4,
      SHOCKWAVE_COOLDOWN: 8,
      SLOW: 0.5,
      DAMAGE_PER_HIT: 45,
      POINTS: 20000
    }
  },

  // ===============================
  // WORLD & ENVIRONMENT
  // ===============================
  WORLD: {
    SPAWN_DISTANCE_Z: -150,
    DESPAWN_DISTANCE_Z: 20,

    LEVEL_1: {
      asteroid_speed: 0.04, // Tăng tốc độ bay hơi nhanh hơn
      asteroid_density: 6, // Giảm mật độ thiên thạch
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
      asteroid_density: 20,
      bubble_dmg: 5
    },
    LEVEL_3: {
      asteroid_speed: 0.1,
      asteroid_density: 25
    }
  },

  // ===============================
  //  SCORING SYSTEM (Hệ thống tính điểm)
  // ===============================
  SCORING: {
    ASTEROID: 0,           // Điểm khi phá hủy thiên thạch (đã bỏ theo yêu cầu)
    ITEM_GOOD: 50,         // Điểm cộng khi nhặt vật phẩm có lợi
    ITEM_BAD: -60,         // Điểm trừ khi nhặt vật phẩm có hại
    ENEMY_DEFAULT: 100,    // Điểm mặc định cho quái thường
    BOSS_1: 5000,
    BOSS_2: 10000,
    BOSS_3: 20000
  },

  // ===============================
  // ITEMS & POWERUPS
  // ===============================
  ITEMS: {
    SPAWN_INTERVAL: 4.5,      // Cứ 4.5s spawn 1 item ngẫu nhiên
    SPEED_FACTOR: 0.75,        // Tốc độ bay 
    SCALE_BASE: 3.0,
    GLOW_OPACITY: 0.8,        //độ chói
    EDGE_GLOW_OPACITY: 0.4,   //độ sáng viền
    LIGHT_INTENSITY: 5,       // cường độ ánh sáng
    LIGHT_RANGE: 25,          // Tầm chiếu sáng
    COLLECTION_RADIUS: 4,   // Bán kính va chạm nhặt đồ
    // --- Định nghĩa các loại Item ---
    TYPES: {
      HEALTH: { value: 100, texture: "ITEM_HP", chance: 0.3, POINTS: 50 },
      AMMO: { refill_percent: 0.5, texture: "ITEM_DAN", chance: 0.3, POINTS: 50 },
      SHIELD: { duration: 10000, texture: "ITEM_SECURITY", chance: 0.1, POINTS: 50 },
      // --- Vật phẩm nâng cấp Vũ khí ---
      WEAPON_2: { gun_key: "GUN_2", texture: "ITEM_Sung2", min_level: "LEVEL_2", duration: 10, POINTS: 50 },
      WEAPON_3: { gun_key: "GUN_3", texture: "ITEM_Sung3", min_level: "LEVEL_3", duration: 15, POINTS: 50 },
      WEAPON_LOCK: { duration: 7000, texture: "ITEM_KHOA_VK", chance: 0.05, POINTS: -60 },
      ASTEROID_ITEM: { duration: 10000, texture: "ITEM_THIEN_THACH", SPEED_MULT: 2.5, DENSITY_MULT: 5.0, chance: 0.1, POINTS: -60 }
    },

    SPAWN_RANGE_FACTOR: 1.8,  // Hệ số thu hẹp vùng spawn (X, Y) – kiểm soát độ rộng khu vực sinh vật phẩm
    ANIM_DURATION: 0.2,       // Thời gian chuyển màu GSAP – ảnh hưởng đến hiệu ứng item
    SHAKE_INTENSITY: 1.5,     // Độ mạnh rung camera – dùng trong các cảnh bối cảnh mạnh

    COLORS: {
      BUFF: 0x00ff00, // Màu xanh cho buff items
      DEBUFF: 0xff2200, // Màu đỏ cho debuff items
      NEUTRAL: 0xaaaaaa // Màu trung tính khi đạn chạm item
    }
  },

  // ===============================
  // AUDIO SETTINGS
  // ===============================
  AUDIO: {
    // --- BGM (Music) ---
    NEN_INTRO: 0.7,        // Nhạc nền intro lúc tụ hạt
    NEN_GAME: 0.7,         // Nhạc nền game chính
    NHAC_NEN_INTRO_MAT_TIN_HIEU_1: 0.7,
    NHAC_NEN_INTRO_MAT_TIN_HIEU_2: 0.7,

    // --- SFX (Effects) ---
    PLAYER_BAN: 0.5,
    HIEU_UNG_TAU_BAN: 0.5,
    HIEU_UNG_LAZE_BAN: 0.5,
    HIEU_UNG_TAU_TRUNG_DON: 0.7,
    HIEU_UNG_QUAI_THIEN_THACH_NO: 0.7,
    HIEU_UNG_BOSS_NO_TUNG: 1.0,
    HIEU_UNG_NHAT_VAT_PHAM: 0.7,
    HIEU_UNG_START: 1.0,
    SFX_CLICK: 0.8,        // Âm thanh bấm nút
    BLACKHOLE_APPEAR: 0.8,
    BLACKHOLE_DURING: 0.8,
    BLACKHOLE_SUCK: 1.5,
    WARP_SPEED: 0.8,

    LEVEL_2: 0.7,
    LEVEL_3: 0.7,
    CHUYEN_MAN: 1.0,
    VICTORY: 1.0,
    GAMEOVER: 1.0,

    PATHS: {
      GAMEOVER: '/audio/sound/gameover.mp3',
      HIEU_UNG_START: '/audio/sound/Button.mp3',
      HIEU_UNG_BOSS_NO_TUNG: '/audio/sound/hieu_ung_boss_no_tung.mp3',
      HIEU_UNG_LAZE_BAN: '/audio/sound/hieu_ung_laze_ban.mp3',
      HIEU_UNG_NHAT_VAT_PHAM: '/audio/sound/hieu_ung_nhat_vat_pham.mp3',
      CHUYEN_MAN: '/audio/sound/chuyen_man.mp3',
      HIEU_UNG_QUAI_THIEN_THACH_NO: '/audio/sound/hieu_ung_quai_thien_thach_no.mp3',
      HIEU_UNG_TAU_TRUNG_DON: '/audio/sound/hieu_ung_tau_trung_don.mp3',
      LEVEL_2: '/audio/sound/level2.mp3',
      NEN_GAME: '/audio/sound/nen_game.mp3',
      NEN_INTRO: '/audio/sound/nen_intro.mp3',
      LEVEL_3: '/audio/sound/level3.mp3',
      PLAYER_BAN: '/audio/sound/player_ban.mp3',
      HIEU_UNG_TAU_BAN: '/audio/sound/player_ban.mp3',
      NHAC_NEN_INTRO_MAT_TIN_HIEU_1: '/audio/sound/nhac_nen_intro_mat_tin_hieu_1.mp3',
      NHAC_NEN_INTRO_MAT_TIN_HIEU_2: '/audio/sound/nhac_nen_intro_mat_tin_hieu_2.mp3',
      VICTORY: '/audio/sound/victory.mp3',
      SFX_CLICK: '/audio/sound/Button.mp3',
      BLACKHOLE_APPEAR: '/audio/sound/Blackhole_appear.mp3',
      BLACKHOLE_DURING: '/audio/sound/Blackhole_during.mp3',
      BLACKHOLE_SUCK: '/audio/sound/hieu_ung_hut_vao.mp3',
      WARP_SPEED: '/audio/sound/wrap_speed.mp3'
    }
  },

  // ===============================
  // GAME STRINGS (Lưu trữ toàn bộ văn bản trong game)
  // ===============================
  STRINGS: {
    WARNING_BLACKHOLE: "CẢNH BÁO: Phát hiện lỗ hổng không gian khổng lồ!",
    LOADING_DATA: "Đang tải dữ liệu, vui lòng đợi...",
    BOSS_APPROACHING: "PHÁT HIỆN THỰC THỂ KHỔNG LỒ ĐANG ĐẾN GẦN!",
    YOUR_SCORE: "YOUR SCORE",
    TOP_SCORES: "TOP 5 HIGHEST SCORE",
    RESTART_BTN: "RESTART"
  },

  // ===============================
  // LEVELS & WAVES CONFIG (Cấu hình màn chơi và độ khó)
  // ===============================
  LEVELS: {
    1: {
      waves: [[10]],             // 1 wave, 10 con
      speedMultiplier: 1.0,      // Tốc độ quái gốc
      shootCooldown: 2.5,        // Thời gian chờ bắn (giây)
      label: "MÀN 1: KHỞI ĐẦU"
    },
    2: {
      waves: [[7], [10]],        // 2 wave: đợt 1 (7 con), đợt 2 (10 con)
      speedMultiplier: 1.3,
      shootCooldown: 1.8,
      label: "MÀN 2: THỬ THÁCH"
    },
    3: {
      waves: [[10], [15]],       // 2 wave: đợt 1 (10 con), đợt 2 (15 con)
      speedMultiplier: 1.7,
      shootCooldown: 1.0,
      label: "MÀN 3: TRẬN CHIẾN CUỐI CÙNG"
    }
  },

  // ===============================
  // STORY & CUTSCENES
  // ===============================
  STORY: {
    TUTORIAL_END: [
      "Cảnh báo! Phát hiện quần thể sinh vật lạ đang tiến tới.",
      "Kiểm tra hệ thống hoàn tất...",
      "Vũ khí đã được kích hoạt.",
      "Phi công, hãy sẵn sàng chiến đấu!"
    ],
    LV1_INTRO: [
      "Boss: KẺ HỦY DIỆT - V1 đã bị tiêu diệt...",
      "Nhưng vẫn tồn tại tín hiệu dị thường trong không gian.",
      "Phi công, hãy chuẩn bị!",
      "Một mối đe dọa mới đang thức tỉnh...",
    ],
    LV2_TRANSITION: {
      texts: [
        "⚠ CẢNH BÁO ⚠",
        "Boss: KẺ HỦY DIỆT - V2 đã bị tiêu diệt...",
        "Nhưng phát hiện dị thường trong không gian...",
        "Tín hiệu của thực thể tối thượng đang đến gần!"
      ],
      shake: { intensity: 0.5, duration: 3.0 },
      warning: 8.0,
      ui_text: "LEVEL 3 - ĐỊA NGỤC"
    },
    VICTORY: [
      "Lõi năng lượng của chúa tể bóng tối đã vỡ vụn...",
      "Hệ thống quét cho thấy không gian đang dần ổn định.",
      "Tín hiệu lạ đã biến mất.",
      "Chúc mừng phi hành đoàn, bạn đã sống sót!",
      "Tàu UETệ đang trở về căn cứ...",
    ]
  },

  // ===============================
  // GAME STATES
  // ===============================
  STATE: {
    MENU: "START_MENU",
    INTRO: "CINEMATIC_INTRO",
    PLAYING: "GAME_PLAYING",
    ENDING: "GAME_ENDING",
    GAMEOVER: "GAME_OVER"
  }
};
