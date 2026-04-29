# Cấu trúc dự án – Space Game

Tài liệu này mô tả cấu trúc thư mục và vai trò của từng file trong dự án **Space‑Game**.

```
Space-Game/
├─ public/                     # Tài nguyên tĩnh
│   ├─ audio/                  # Âm thanh (SFX và nhạc nền)
│   │   └─ sound/              # Các file .mp3 cho hiệu ứng và nhạc
│   ├─ models/                 # Mô hình 3D (.glb)
│   │   ├─ uete_3637.glb       # Mô hình tàu người chơi chính
│   │   ├─ Monster 1.glb       # Mô hình quái thường
│   │   ├─ Boss_1/2/3.glb      # Các mô hình Boss qua từng màn
│   │   └─ meteorite.glb       # Mô hình thiên thạch
│   ├─ textures/               # Hình ảnh texture và UI
│   │   ├─ HP.png, dan.png...  # Icon các vật phẩm (Items)
│   │   ├─ Logo.webp           # Logo trò chơi
│   │   └─ nebula_dark.jpg     # Texture nền không gian
│   └─ favicon.ico             # Biểu tượng trang web
│
├─ src/                        # Mã nguồn chính
│   ├─ utils/                  # Tiện ích và cấu hình
│   │   ├─ CONFIG.JS            # Cấu hình trung tâm (thông số game, đường dẫn)
│   │   ├─ AssetLoader.js      # Tải và quản lý tài nguyên (models, textures)
│   │   ├─ ModelCache.js        # Hệ thống cache mô hình 3D
│   │   └─ Math.js              # Thư viện toán học, xử lý va chạm và quỹ đạo
│   │
│   ├─ systems/                # Các hệ thống logic
│   │   ├─ core/                # Lõi điều khiển game
│   │   │   ├─ GameManager.js    # Quản lý vòng đời game, Wave, Boss và sự kiện
│   │   │   ├─ GameLoop.js       # Vòng lặp cập nhật chính (60 FPS)
│   │   │   ├─ ProjectileSystem.js # Quản lý đạn và laser toàn cục
│   │   │   ├─ SceneController.js  # Quản lý Three.js Scene, Camera, Ánh sáng
│   │   │   └─ StateManager.js     # Chuyển đổi trạng thái (Intro, Play, End)
│   │   │
│   │   ├─ player/             # Logic người chơi
│   │   │   ├─ Player.js         # Khởi tạo và điều khiển tàu người chơi
│   │   │   ├─ Combat.js         # Xử lý va chạm và sát thương của người chơi
│   │   │   ├─ Weapon.js         # Logic bắn súng, nâng cấp vũ khí
│   │   │   ├─ ItemSystem.js     # Quản lý các vật phẩm rơi ra và nhặt được
│   │   │   └─ Score.js          # Hệ thống tính điểm và lưu kỷ lục
│   │   │
│   │   ├─ enemy/              # Logic kẻ địch
│   │   │   ├─ Enemy.js          # Lớp cơ sở cho quái thường
│   │   │   ├─ Boss.js           # Logic AI phức tạp cho các Boss
│   │   │   ├─ SwarmMovement.js # Điều khiển di chuyển theo bầy đàn
│   │   │   └─ Patterns.js       # Các quỹ đạo di chuyển định sẵn
│   │   │
│   │   ├─ ui/                 # Giao diện người dùng (HTML/CSS in JS)
│   │   │   ├─ UIManager.js      # Quản lý HUD (HP, Ammo, Score, Boss HP)
│   │   │   ├─ Intro.js          # Màn hình giới thiệu và chọn tàu
│   │   │   ├─ Story.js          # Hệ thống dẫn truyện và hội thoại
│   │   │   ├─ Splash.js         # Màn hình khởi động tương tác
│   │   │   ├─ EndingUI.js       # Giao diện kết thúc (Win/Loss)
│   │   │   └─ Crosshair.js      # Tâm ngắm tương tác
│   │   │
│   │   ├─ effects/            # Hiệu ứng hình ảnh
│   │   │   ├─ Explosion.js      # Hiệu ứng nổ hạt (Particle)
│   │   │   ├─ ParticleSystem.js # Hệ thống hạt dùng chung
│   │   │   ├─ CameraEffects.js  # Rung màn hình, hiệu ứng ống kính
│   │   │   ├─ CinematicEffects.js # Các đoạn cắt cảnh kỹ thuật số
│   │   │   └─ GSA.js            # Hiệu ứng đồ họa đặc biệt
│   │   │
│   │   ├─ environment/        # Môi trường game
│   │   │   ├─ Background.js     # Nền sao, thiên hà, nebula
│   │   │   └─ AsteroidSystem.js # Hệ thống thiên thạch trôi nổi
│   │   │
│   │   └─ audio/              # Hệ thống âm thanh
│   │       └─ music.js          # Quản lý nhạc nền và hiệu ứng âm thanh (SFX)
│   │
│   └─ main.js                 # Điểm khởi đầu, kết nối các hệ thống chính
│
├─ docs/                       # Tài liệu dự án
│   ├─ struct.md               # File này (Cấu trúc dự án)
│   └─ thuat_toan.md           # Tài liệu về các thuật toán trong game
│
├─ index.html                 # File HTML chính
├─ package.json               # Cấu hình dự án và dependencies (Vite)
└─ vite.config.js             # Cấu hình cho trình đóng gói Vite
```

## Vai trò chi tiết các thành phần chính

- **Lớp Dữ liệu & Tiện ích (utils/):**
  - `CONFIG.JS`: "Trái tim" của game. Mọi thông số từ tốc độ, sát thương đến đường dẫn file đều được cấu hình tại đây.
  - `Math.js`: Cung cấp các hàm toán học vector, kiểm tra va chạm hình cầu/hộp, và các thuật toán nội suy di chuyển.

- **Hệ thống Lõi (core/):**
  - `GameManager.js`: Đóng vai trò "đạo diễn", quyết định khi nào sinh quái, khi nào Boss xuất hiện và chuyển màn.
  - `ProjectileSystem.js`: Tối ưu hóa việc xử lý hàng ngàn viên đạn cùng lúc bằng cách tái sử dụng object (Object Pooling).

- **Giao diện người dùng (ui/):**
  - Các tệp trong này tạo ra giao diện bằng cách can thiệp trực tiếp vào DOM. `UIManager.js` cập nhật liên tục các thông số theo thời gian thực từ `Player` và `GameManager`.

- **Hiệu ứng (effects/):**
  - Sử dụng hệ thống hạt (Particles) để tạo ra các vụ nổ và hiệu ứng hình ảnh sống động mà không làm giảm hiệu suất quá nhiều.

- **Môi trường (environment/):**
  - `Background.js` tạo ra cảm giác chiều sâu không gian (parallax) bằng cách di chuyển các lớp texture nền với tốc độ khác nhau.

> **Lưu ý:** Khi thêm file mới hoặc thay đổi chức năng lớn, hãy cập nhật file này để các thành viên khác dễ dàng nắm bắt cấu trúc dự án.
