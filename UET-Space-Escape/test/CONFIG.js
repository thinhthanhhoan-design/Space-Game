export const CONFIG = {
  // ===============================
  // 🎬 CINEMATIC INTRO
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
        text: "Tàu UETE-3637 tiến vào Vùng Tối...",
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
          pos: [-2, 4, 5],
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
          pos: [0, 7, 16],
          lookAt: [0, 0, -12],
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

    FORWARD_SPEED: 0.175, // Tăng tốc độ bay cho phù hợp không gian rộng

    FLIGHT_ENVELOPE: {
      X: 40, // Mở rộng không gian bay ngang
      Y: 20, // Mở rộng không gian bay dọc
    },

    // Thông số cho hiệu ứng nghiêng thế giới
    DYNAMIC_BANKING: {
      WORLD_ROLL_LIMIT: Math.PI / 10, // Thế giới nghiêng tối đa ~18 độ
      SMOOTHNESS: 0.05,               // Độ mượt khi xoay (Lerp factor)
      HORIZON_SHIFT: 0.2,             // Camera lệch nhẹ sang ngang khi rẽ
    },

    ROTATION_LIMITS: {
      ROLL: Math.PI / 4,  // Tàu nghiêng 45 độ
      PITCH: Math.PI / 8, // Ngóc/chúi 22.5 độ
      LERP: 0.1,
    },
  },

  // ===============================
  // 🎥 CAMERA SYSTEM
  // ===============================
  CAMERA: {
    FOV: 75,
    FOLLOW_LERP: 0.05,

    // ⚠️ Nếu tàu bay theo hướng -Z thì z nên để âm để camera ở phía sau
    OFFSET: { x: 0, y: 1.2, z: 8 },

    SHAKE_INTENSITY: 0.3,
  },
};