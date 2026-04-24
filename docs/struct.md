# BẢNG GHI CHÚ CẤU TRÚC VÀ NỘI DUNG CÁC FILE SPACE ESCAPE

Dưới đây là ghi chú tổng hợp về tất cả các file mã nguồn hiện có nội dung trong dự án **UET-Space-Escape**. Bạn có thể dùng tệp này làm tài liệu báo cáo hoặc giúp các thành viên trong nhóm dễ hiểu luồng đi của mã nguồn:

## 1. Thư mục Gốc & Cấu hình ⚙️
* **`src/main.js`**: File khởi chạy đầu tiên. Khi trang web tải xong, khởi tạo `GameManager` để bắt đầu tiến trình chạy game.
* **`src/utils/CONFIG.JS`**: Trái tim cấu hình của toàn bộ game. Lưu trữ mọi thông số (HP, Ammo, Tốc độ, Đường dẫn Assets, Tọa độ Spawn...) giúp việc cân bằng game dễ dàng.
* **`src/utils/Math.js`**: Thư viện chứa các hàm toán học hỗ trợ. Nổi bật là thuật toán `checkSphereCollisionSq` (va chạm hình cầu tối ưu) giúp game chạy mượt 60+ FPS.
* **`src/styles/main.css`**: Chứa mã thiết kế (CSS) cho UI tĩnh phía trên nền đồ họa 3D.

## 2. Hệ thống Lõi (Core Systems) 🧠
* **`src/systems/core/GameManager.js`**: **Bộ Não Tổng.** Điều phối tất cả các module. Quản lý chuyển cảnh, Logic Wave/Boss, và ra lệnh `update` cho toàn bộ hệ thống.
* **`src/systems/core/SceneController.js`**: Thiết lập móng nhà cho Three.js: `Scene`, `Camera`, `Renderer` và hệ thống ánh sáng.
* **`src/systems/core/GameLoop.js`**: Vòng lặp thời gian (`requestAnimationFrame`). Tính toán độ trễ `delta` để đảm bảo game chạy ổn định trên mọi loại màn hình.

## 3. Hệ thống Người Chơi (Player System) 🚀
* **`src/systems/player/Player.js`**: Quản lý phi thuyền `UET-3637`. Xử lý di chuyển, giới hạn bay, và hiệu ứng vật lý nghiêng thân (Roll/Pitch).
* **`src/systems/player/Weapon.js`**: Quản lý hỏa lực, tốc độ bắn, số lượng đạn và trạng thái `isLocked` (khi bị dính Debuff).
* **`src/systems/player/ItemSystem.js`**: Hệ thống quản lý vật phẩm 3D. Xử lý logic nhặt đồ, hồi phục (HP/Ammo), hiệu ứng hào quang (Glow) và to dần theo khoảng cách.
* **`src/systems/player/Combat.js`**: **Trung tâm xử lý va chạm.** Kiểm tra Player vs Enemy, Player vs Asteroid, Bullet vs Enemy, và Player vs Item. Đây là nơi kích hoạt các chuỗi visual sequence khi nhặt đồ.

## 4. Hệ thống Kẻ Địch (Enemy) 👾
* **`src/systems/enemy/Enemy.js`**: Quản lý quái nhỏ theo Wave. Có khả năng bắn Laser và rơi ra vật phẩm (Buff/Debuff) khi chết.
* **`src/systems/enemy/Boss.js`**: Quản lý Boss cuối màn với thanh máu riêng và các kỹ thuật tấn công đặc biệt.
* **`src/systems/enemy/Patterns.js`**: Các thuật toán đường bay và đội hình (Formation) cho kẻ địch.

## 5. Hệ thống Môi trường (Environment) 🌌
* **`src/systems/environment/Background.js`**: Tạo không gian thiên hà, xử lý hiệu ứng `Horizon Banking` (nền xoay theo tàu).
* **`src/systems/environment/Asteroids.js`**: Hệ thống chướng ngại vật ngẫu nhiên. Có thể rơi ra vật phẩm tiếp tế khi bị bắn vỡ.

## 6. Hiệu ứng (Effects) & Giao Diện (UI) ✨
* **`src/systems/ui/Intro.js`**: Xử lý màn hình chào, hiệu ứng nổ Logo UET và chuyển cảnh GSA vào gameplay.
* **`src/systems/ui/UIManager.js`**: Hiển thị HUD (Máu, Đạn, Điểm, Boss HP) bằng HTML/CSS linh hoạt.
* **`src/systems/ui/Crosshair.js`**: Tâm ngắm 3D bám sát theo vị trí tàu để hỗ trợ ngắm bắn.
* **`src/systems/effects/Explosion.js`**: Xử lý hiệu ứng cháy nổ (Sparks, FireDust) cho tàu và thiên thạch.
* **`src/systems/effects/ParticleSystem.js`**: Hệ thống hạt Point Cloud đặc biệt dùng cho hiệu ứng "tan rã" của vật phẩm khi nhặt.
* **`src/systems/effects/GSA.js`**: (Geometry Sample & Animate) Thuật toán quét điểm 3D để chuyển đổi hạt từ Logo sang phi thuyền.
