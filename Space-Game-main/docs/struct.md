# Cấu trúc dự án – Space Game

Tài liệu này mô tả cấu trúc thư mục và vai trò của từng file trong dự án **Space‑Game**.

```
Space-Game/
├─ public/                     # Tài nguyên tĩnh (được máy chủ phục vụ)
│   ├─ textures/               # Hình ảnh dùng cho sprite, UI và item
│   │   ├─ HP.png               # Icon vật phẩm sức khỏe
│   │   ├─ dan.png              # Icon vật phẩm đạn
│   │   ├─ bao_ve.png           # Icon vật phẩm lá chắn
│   │   ├─ sung_2.png           # Icon vật phẩm vũ khí 2
│   │   ├─ sung_3.png           # Icon vật phẩm vũ khí 3
│   │   └─ thien_thach.png      # Icon vật phẩm thiên thạch
│   ├─ textures/Logo.webp       # Logo game (UI)
│   ├─ textures/nebula_dark.jpg # Ảnh nền không gian
│   └─ textures/star_glow.png   # Hình ảnh glow (được thay thế bằng procedural)
│
├─ src/                        # Mã nguồn (ES6 modules)
│   ├─ utils/                  # Các tiện ích và cấu hình chung
│   │   ├─ CONFIG.JS            # Cấu hình trung tâm (item, enemy, world,...)
│   │   ├─ AssetLoader.js      # Tải và cache mô hình 3D, texture
│   │   ├─ ModelCache.js        # Cache mô hình để clone nhanh
│   │   ├─ Math.js              # Các hàm hình học (va chạm, khoảng cách)
│   │   └─ … (các tiện ích khác)
│   │
│   ├─ systems/                # Các hệ thống chính, phân theo miền
│   │   ├─ core/                # Luồng game cấp cao
│   │   │   ├─ GameManager.js    # Điều khiển vòng đời game, trạng thái, wave & boss
│   │   │   ├─ GameLoop.js       # Vòng lặp requestAnimationFrame
│   │   │   ├─ ProjectileSystem.js # Quản lý đạn, laser
│   │   │   ├─ SceneController.js  # Camera, background, ánh sáng
│   │   │   └─ StateManager.js     # Trạng thái toàn cục (menu, intro, playing…)
│   │   │
│   │   ├─ player/             # Các hệ thống liên quan tới người chơi
│   │   │   ├─ Player.js         # Thực thể người chơi, nhập liệu, di chuyển, lá chắn (sphere)
│   │   │   ├─ Weapon.js         # Logic bắn, đổi súng, quản lý đạn
│   │   │   ├─ ItemSystem.js     # Sinh, cập nhật, thu thập vật phẩm, hiệu ứng glow
│   │   │   └─ Crosshair.js      # UI dấu ngắm theo vị trí tàu
│   │   │
│   │   ├─ enemy/              # Hành vi và di chuyển quái
│   │   │   ├─ Enemy.js          # Định nghĩa quái, HP, bắn, chết, rơi vật phẩm
│   │   │   ├─ EnemyManager.js   # Quản lý wave, sinh quái, đăng ký SwarmMovement
│   │   │   ├─ SwarmMovement.js # Di chuyển dạng bầy, giới hạn, tethering
│   │   │   ├─ Boss.js           # AI và tấn công của boss
│   │   │   └─ Patterns.js       # Các mẫu di chuyển pre‑defined
│   │   │
│   │   └─ ui/                 # Các thành phần giao diện người dùng
│   │       ├─ HUD.js           # Hiển thị HP, ammo, trạng thái lá chắn
│   │       └─ Message.js       # Thông báo ngắn trên màn hình
│   │
│   └─ … (các module khác)
│
└─ index.html                 # Điểm vào của ứng dụng, tải bundle JavaScript
```

## Vai trò chi tiết

- **public/** – Chứa mọi tài nguyên tĩnh được tham chiếu trong `CONFIG.JS`. Các texture của item được lưu ở đây.
- **src/utils/** – Lớp tiện ích:
  - `CONFIG.JS` là nguồn duy nhất xác định các thông số trò chơi (độ bền, tốc độ, thời gian tồn tại item, …).
  - `AssetLoader.js` và `ModelCache.js` giúp tải và tái sử dụng mô hình 3D để giảm chi phí tải.
  - `Math.js` (TRUNG TÂM): Chứa toàn bộ các thuật toán hình học, va chạm, centroid, tethering và xử lý biên. Tất cả các module khác đều tham chiếu tới đây để đảm bảo logic thống nhất.
- **src/systems/core/** – Điều khiển luồng game tổng thể:
  - `GameManager.js` quản lý tiến trình level, wave, spawn boss và kết nối các hệ thống phụ.
  - `GameLoop.js` chạy vòng lặp chính.
  - `ProjectileSystem.js` tạo và cập nhật các projectile.
  - `SceneController.js` quản lý camera, background và ánh sáng.
  - `StateManager.js` quản lý trạng thái UI (menu, intro, gameplay, game over).
- **src/systems/player/** – Tất cả logic liên quan đến người chơi:
  - `Player.js` xử lý nhập liệu, di chuyển, sức khỏe, lá chắn và cập nhật các subsystem mỗi khung. Lá chắn (shield sphere) tự động khớp kích thước tàu qua `MathUtils`.
  - `Weapon.js` mô tả các loại súng, tần suất bắn, tiêu thụ đạn và chuyển đổi vũ khí.
  - `ItemSystem.js` sinh vật phẩm, kiểm tra va chạm qua `MathUtils.scaleItemRadius`, áp dụng hiệu ứng và xóa vật phẩm hết thời gian.
  - `Crosshair.js` vẽ dấu ngắm trên HUD.
- **src/systems/enemy/** – Hành vi quái và boss:
  - `Enemy.js` định nghĩa quái cơ bản, hành vi bắn, chết và rơi item.
  - `EnemyManager.js` quản lý các wave. Tại Level 2, quái được chia thành 2 đợt: Đợt 2 chỉ xuất hiện sau khi đợt 1 bị tiêu diệt hoàn toàn.
  - `SwarmMovement.js` cung cấp chuyển động bầy, giới hạn không cho quái vượt ra khỏi vùng cho phép, sử dụng hoàn toàn các helper từ `Math.js`.
  - `Boss.js` chứa AI cho các boss và các Phase đặc biệt.
  - `Patterns.js` lưu các mẫu di chuyển dùng chung.
- **src/systems/ui/** – Thành phần giao diện:
  - `HUD.js` hiển thị thông tin sức khỏe, đạn, lá chắn.
  - `Message.js` hiện các thông báo tạm thời (ví dụ: “+100 HP”, “Weapon upgraded”).

> **Lưu ý:** Khi có thay đổi mới (thêm module, chỉnh sửa logic), hãy cập nhật tài liệu này để luôn phản ánh đúng cấu trúc dự án.
