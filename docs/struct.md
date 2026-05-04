# Cấu trúc Hệ thống Dự án – UET Space Escape

Tài liệu này mô tả chi tiết cây thư mục vật lý và vai trò kỹ thuật cốt lõi của từng module trong dự án **UET Space Escape**. Hệ thống được xây dựng theo **Kiến trúc Hướng Module (Modular Architecture)** kết hợp với mô hình **Định tuyến Vòng lặp (Game Loop Pattern)**.

```text
Space-Game/
├─ public/                     # Tài nguyên tĩnh (Static Assets)
│   ├─ audio/                  # Âm thanh định dạng nén (SFX, BGM)
│   ├─ models/                 # Mô hình 3D (.glb) tối ưu cho WebGL
│   ├─ textures/               # Vật liệu bề mặt (Diffuse, Emission Maps) và Icon
│   └─ favicon.ico             # Biểu tượng trang web
│
├─ src/                        # Không gian mã nguồn chính (Source Code)
│   ├─ styles/                 # Tệp định dạng CSS
│   │   └─ main.css            # Định dạng UI Overlay phẳng (2D) đè lên WebGL
│   │
│   ├─ utils/                  # Tiện ích bổ trợ và Cấu hình toàn cục
│   │   ├─ CONFIG.JS           # Nơi thiết lập mọi chỉ số cân bằng (Speed, HP, Paths)
│   │   └─ AssetLoader.js      # Hệ thống tải tài nguyên bất đồng bộ (Promises) kết hợp SkeletonUtils
│   │
│   ├─ systems/                # Khối điều khiển hệ thống (Hệ thống phân lớp)
│   │   ├─ core/               # LỚP 1: HỆ THỐNG LÕI (Core Infrastructure)
│   │   │   ├─ GameLoop.js       # Vòng lặp tính toán DeltaTime (requestAnimationFrame)
│   │   │   ├─ GameManager.js    # Bộ não điều phối toàn bộ trò chơi
│   │   │   ├─ ProjectileSystem.js # Quản lý đạn bắn bằng kiến trúc Object Pooling
│   │   │   ├─ SceneController.js  # Khởi tạo Three.js Scene, Camera và Nguồn sáng
│   │   │   └─ StateManager.js     # Chuyển đổi trạng thái máy ảo (Intro -> Play -> End)
│   │   │
│   │   ├─ player/             # LỚP 2: TƯƠNG TÁC NGƯỜI CHƠI (Player Layer)
│   │   │   ├─ Player.js         # Nội suy tọa độ và xử lý Input di chuyển tàu
│   │   │   ├─ Weapon.js         # Logic khai hỏa và bẻ cong quỹ đạo đạn (Homing Vector)
│   │   │   ├─ Combat.js         # Hệ thống xét va chạm và chịu sát thương
│   │   │   ├─ ItemSystem.js     # Thuật toán sinh tồn động (Bơm máu/đạn khẩn cấp)
│   │   │   └─ Score.js          # Giao tiếp với LocalStorage lưu kỷ lục
│   │   │
│   │   ├─ enemy/              # LỚP 3: TRÍ TUỆ NHÂN TẠO (AI & Enemy Layer)
│   │   │   ├─ Boss.js           # Cỗ máy trạng thái (State-Machine) điều khiển Boss V1, V2, V3
│   │   │   ├─ Enemy.js          # Hệ thống quái vật tịnh tiến cơ bản
│   │   │   ├─ SwarmMovement.js  # Thuật toán bầy đàn bám đuổi (Boids/Swarm)
│   │   │   └─ Patterns.js       # Các quỹ đạo tấn công định sẵn (Paths)
│   │   │
│   │   ├─ environment/        # LỚP 4: MÔI TRƯỜNG VÀ VẬT LÝ
│   │   │   ├─ AsteroidSystem.js # Hệ thống sinh thiên thạch ngẫu nhiên
│   │   │   └─ Background.js     # Xử lý cuộn phông nền đa tầng (Parallax Scrolling)
│   │   │
│   │   ├─ effects/            # LỚP 5: KỸ XẢO ĐỒ HỌA (VFX Layer)
│   │   │   ├─ CinematicEffects.js # Lập trình phân cảnh điện ảnh bằng thuật toán (Hố đen/Warp Tunnel)
│   │   │   ├─ GSA.js            # Khai thác GLSL Custom Shaders điều khiển điểm hạt cấp GPU
│   │   │   ├─ Explosion.js      # Hệ thống kích nổ và mảnh vỡ
│   │   │   ├─ CameraEffects.js  # Hiệu ứng rung chấn máy quay (Camera Shake)
│   │   │   └─ ParticleSystem.js # Trình xuất hạt (Particles) sử dụng Object Pool
│   │   │
│   │   ├─ ui/                 # LỚP 6: GIAO DIỆN & CỐT TRUYỆN (UX/UI Layer)
│   │   │   ├─ Crosshair.js      # Radar tâm ngắm sử dụng thuật toán chiếu tia (Raycasting)
│   │   │   ├─ UIManager.js      # Kết nối dữ liệu Game thao tác thẳng vào cây DOM HTML
│   │   │   ├─ Intro.js          # Xử lý luồng dữ liệu mở màn
│   │   │   ├─ Splash.js         # Màn hình chờ tương tác (Tăng Immersion)
│   │   │   ├─ Story.js          # Hệ thống rẽ nhánh hội thoại / cốt truyện
│   │   │   └─ EndingUI.js       # Tổng hợp kết quả và màn hình Game Over/Win
│   │   │
│   │   └─ audio/              # LỚP 7: ÂM THANH
│   │       └─ music.js          # Quản trị luồng âm thanh không gian (Spatial Audio)
│   │
│   └─ main.js                 # CỬA NGÕ KHỞI ĐỘNG (Entry Point)
│
├─ docs/                       # Thư mục lưu trữ văn bản học thuật
│   ├─ struct.md               # Sơ đồ Cấu trúc Dự án (File đang xem)
│   ├─ thuat_toan.md           # Báo cáo thuật toán lõi
│   └─ phan_tich_gioi_thieu.md # Luận văn phân tích chuyên sâu lý do chọn đề tài
│
├─ index.html                  # Gốc hiển thị của trình duyệt Web
├─ package.json                # Liệt kê phụ thuộc (Three.js, GSAP)
└─ vite.config.js              # Cấu hình biên dịch của nền tảng Vite
```

## Giải phẫu vai trò theo mô hình phân lớp

Bằng việc phân tách rõ ràng 7 Lớp (Layer) bên trong thư mục `systems/`, kiến trúc của trò chơi đạt được tính **Đóng gói (Encapsulation)** vô cùng chuẩn mực:

1. **Nhóm Định tuyến (Core & Main):** File `main.js` và thư mục `core` đóng vai trò là xương sống. Chúng tạo ra vòng lặp vô tận (Game Loop) và phân bổ quyền lực xuống các lớp bên dưới. Cơ chế **Object Pooling** tại `ProjectileSystem` là lá chắn bảo vệ CPU khỏi việc giật lag.
2. **Nhóm Hiển thị (Effects & Environment):** Nơi phô diễn các kỹ thuật đồ họa máy tính đỉnh cao nhất. Đưa các tính toán tọa độ cực nặng xuống cấp độ Card đồ họa (GPU) thông qua **GLSL** và tạo ảo giác không gian sâu bằng **Parallax**.
3. **Nhóm Logic Tương tác (Player & Enemy & UI):** Nơi chứa đựng các thuật toán trí tuệ nhân tạo (AI). Ứng dụng **State Machine** để Boss đổi pha và **Raycaster** để giúp Player ngắm bắn mục tiêu 3D trên màn hình 2D phẳng. Giao diện (UI) được tách hoàn toàn thành một mảng riêng để chỉnh sửa DOM mà không gây cản trở tiến trình kết xuất của WebGL.
