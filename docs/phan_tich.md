# Phân tích Kiến trúc Hệ thống (Systems Analysis) - UET Space Escape

Tài liệu này phân tích chi tiết nhiệm vụ, mục tiêu và vai trò của từng thư mục thuộc hệ thống `src/systems`. Kiến trúc được thiết kế theo hướng mô-đun hóa (Modular Design) để dễ dàng quản lý và mở rộng.

---

## 1. Thư mục: `systems/player`
*   **Nhiệm vụ:** Quản lý toàn bộ thực thể người chơi và các hành động liên quan.
*   **Các thành phần chính:** `Player.js`, `Weapon.js`, `ItemSystem.js`, `Combat.js`.
*   **Vai trò:** 
    *   Xử lý điều khiển (Input), di chuyển và giới hạn không gian bay.
    *   Quản lý vũ khí, cơ chế bắn đạn và tối ưu hóa bộ nhớ đạn (Pooling).
    *   Xử lý việc nhặt và sử dụng vật phẩm nâng cấp (Power-ups).
    *   Xử lý logic tính toán va chạm (Collision) giữa người chơi và môi trường.
*   **Các vấn đề và thách thức kỹ thuật:**
    *   **Bài toán Hiệu suất:** Khi số lượng đạn bắn ra quá lớn, việc khởi tạo liên tục các Object mới sẽ gây lag (đã giải quyết bằng Pooling).
    *   **Độ chính xác Hitbox:** Cân bằng giữa kích thước mô hình 3D và bán kính va chạm thực tế để người chơi không cảm thấy bị "oan" khi trúng đạn.
    *   **Đồng bộ hóa Item:** Xử lý việc nhặt nhiều vật phẩm cùng lúc mà không làm hỏng logic của các Timer (`setTimeout`).


## 2. Thư mục: `systems/enemy`
*   **Nhiệm vụ:** Quản lý hành vi và vòng đời của các kẻ địch (Quái thường và Boss).
*   **Các thành phần chính:** `EnemyManager.js`, `Boss.js`, `EnemyBehavior.js`.
*   **Vai trò:**
    *   Điều khiển logic xuất hiện (Spawn) của quái vật theo các Wave đã định nghĩa.
    *   Quản lý trí tuệ nhân tạo (AI) đơn giản: bay theo quỹ đạo, tự động bắn trả.
    *   Xử lý các trạng thái của Boss (di chuyển, tấn công đặc biệt, rút lui).
*   **Các vấn đề và thách thức kỹ thuật:**
    *   **Chuyển động mượt mà:** Đảm bảo quái vật không bị "giật" khi thay đổi quỹ đạo bay hoặc khi bị trúng đạn.
    *   **Logic Spawn:** Cân bằng mật độ quái để màn chơi không quá trống trải nhưng cũng không quá nghẹt thở gây mất công bằng.
    *   **Đồng bộ đạn Boss:** Quản lý hàng trăm viên đạn từ Boss (đặc biệt là Boss 2, 3) mà không làm sụt giảm FPS.


## 3. Thư mục: `systems/core`
*   **Nhiệm vụ:** Đóng vai trò là "bộ não" điều phối toàn bộ trò chơi.
*   **Các thành phần chính:** `GameLoop.js`, `SceneController.js`, `StateSystem.js`.
*   **Vai trò:**
    *   Quản lý vòng lặp Game (Update/Render).
    *   Chuyển đổi giữa các trạng thái game (Menu -> Intro -> Playing -> GameOver).
    *   Quản lý việc nạp (Load) và giải phóng (Dispose) các tài nguyên 3D để tối ưu bộ nhớ.
*   **Các vấn đề và thách thức kỹ thuật:**
    *   **Rò rỉ bộ nhớ (Memory Leak):** Các đối tượng đã biến mất nhưng vẫn tồn tại trong RAM do không được gọi hàm `.dispose()` đúng cách.
    *   **Quản lý trạng thái (State Race):** Ngăn chặn việc chuyển trạng thái quá nhanh (ví dụ từ Intro sang Playing) gây ra lỗi nạp tài nguyên chưa xong.
    *   **Tính ổn định của Game Loop:** Giữ cho tốc độ game không đổi bất kể máy chạy 30 FPS hay 144 FPS.


## 4. Thư mục: `systems/ui`
*   **Nhiệm vụ:** Xử lý toàn bộ giao diện người dùng (User Interface).
*   **Các thành phần chính:** `HUD.js`, `Intro.js`, `Menu.js`, `Crosshair.js`.
*   **Vai trò:**
    *   Hiển thị thông số thời gian thực: HP, Đạn, Điểm số.
    *   Xử lý các màn hình thông báo chuyển cảnh, lời thoại cốt truyện.
    *   Cung cấp tâm ngắm động và các chỉ báo cảnh báo (Warning).
*   **Các vấn đề và thách thức kỹ thuật:**
    *   **Phản hồi nhanh (Responsiveness):** Đảm bảo UI cập nhật ngay lập tức khi máu hoặc đạn thay đổi mà không bị trễ.
    *   **Bố cục màn hình (Layout):** Đảm bảo HUD hiển thị đúng vị trí trên mọi tỷ lệ màn hình (16:9, 21:9) và các thiết bị di động.
    *   **Độ sâu hiển thị (Z-index):** Quản lý việc các bảng thông báo không bị che khuất lẫn nhau hoặc che khuất các nút bấm quan trọng.


## 5. Thư mục: `systems/effects`
*   **Nhiệm vụ:** Tạo ra các hiệu ứng thị giác để tăng tính trải nghiệm.
*   **Các thành phần chính:** `ExplosionSystem.js`, `ParticleSystem.js`, `CameraEffects.js`.
*   **Vai trò:**
    *   Quản lý hiệu ứng cháy nổ khi quái vật hoặc thiên thạch bị phá hủy.
    *   Tạo hiệu ứng rung camera (Shake), nháy màn hình (Flash) khi va chạm.
    *   Xử lý các hạt bụi không gian và hiệu ứng tốc độ (Warp speed).
*   **Các vấn đề và thách thức kỹ thuật:**
    *   **Giới hạn phần cứng:** Hiệu ứng nổ quá hoành tráng với hàng nghìn hạt (particles) có thể làm sập trình duyệt trên các máy yếu.
    *   **Nhiễu thị giác:** Quá nhiều hiệu ứng ánh sáng có thể làm người chơi mất tập trung, không nhìn rõ đạn của kẻ thù.
    *   **Quản lý vòng đời hiệu ứng:** Đảm bảo các hiệu ứng nổ tự xóa sau khi kết thúc để tránh rác bộ nhớ.


## 6. Thư mục: `systems/audio`
*   **Nhiệm vụ:** Quản lý toàn bộ hệ thống âm thanh của trò chơi.
*   **Các thành phần chính:** `MusicSystem.js`, `SoundEffects.js`.
*   **Vai trò:**
    *   Phát nhạc nền (BGM) thay đổi theo từng màn chơi và trạng thái game.
    *   Kích hoạt các hiệu ứng âm thanh (SFX) dựa trên sự kiện gameplay (bắn súng, va chạm, nhặt đồ).
    *   Xử lý hiệu ứng âm thanh 3D và điều chỉnh âm lượng (Fade-in/out).
*   **Các vấn đề và thách thức kỹ thuật:**
    *   **Cơ chế trình duyệt:** Xử lý việc trình duyệt chặn tự động phát âm thanh nếu người chơi chưa click vào màn hình.
    *   **Độ trễ âm thanh:** Đảm bảo tiếng bắn súng khớp chính xác với hình ảnh đạn bay ra (không bị trễ dù chỉ 0.1s).
    *   **Quản lý kênh âm thanh:** Tránh hiện tượng âm thanh bị "xé" hoặc quá to khi có nhiều vụ nổ xảy ra cùng lúc.


## 7. Thư mục: `systems/environment`
*   **Nhiệm vụ:** Tạo ra bối cảnh và chướng ngại vật trong không gian.
*   **Các thành phần chính:** `AsteroidSystem.js`, `SpaceBackground.js`.
*   **Vai trò:**
    *   Quản lý việc sinh ra và di chuyển của các thiên thạch.
    *   Tạo ra nền trời (Skybox) và các tinh vân (Nebula) động.
    *   Xử lý việc dọn dẹp các vật thể đã bay ra khỏi tầm mắt (Despawn).
*   **Các vấn đề và thách thức kỹ thuật:**
    *   **Spawn Stutter:** Hiện tượng game bị khựng nhẹ khi một lượng lớn thiên thạch mới được sinh ra cùng lúc.
    *   **Quản lý khoảng cách (Culling):** Tính toán khoảng cách Despawn hợp lý để người chơi không thấy vật thể biến mất một cách đột ngột.
    *   **Tối ưu hóa va chạm môi trường:** Xử lý va chạm với hàng chục thiên thạch chuyển động không theo quy luật.


---
*Kiến trúc này giúp dự án có khả năng bảo trì cao: khi muốn sửa lỗi vũ khí, nhóm chỉ cần tập trung vào thư mục `player`; khi muốn đổi giao diện, chỉ cần can thiệp vào thư mục `ui`.*
