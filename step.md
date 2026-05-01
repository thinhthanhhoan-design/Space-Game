# Quá Trình Triển Khai Dự Án Space-Game

Tài liệu này giải thích chi tiết về quá trình xây dựng, triển khai các module, các vấn đề kỹ thuật phát sinh và trình tự tạo ra các thành phần trong dự án.

## Phần 1: Giải thích chi tiết từng module đã được triển khai

Dự án áp dụng kiến trúc Modular, tách biệt rõ ràng các hệ thống logic để dễ quản lý và mở rộng.

1. **Hệ thống Lõi (Core System - `src/systems/core/`)**
   - **`GameManager.js`**: Đóng vai trò là "bộ não" của toàn bộ trò chơi, là đối tượng điều phối logic tổng thể. File này kiểm soát việc sinh quái vật theo các Wave (sóng địch), quản lý thời điểm xuất hiện của Boss khi kết thúc wave, theo dõi lượng điểm số và tự động kích hoạt tiến trình chuyển cảnh, chuyển trạng thái trò chơi (từ Intro sang Play, hoặc End game) dựa vào tiến độ sinh tồn của người chơi.
   - **`GameLoop.js`**: Trực tiếp xử lý vòng lặp chính của trò chơi dựa trên API `requestAnimationFrame` của trình duyệt. File tính toán `deltaTime` (thời gian trôi qua giữa 2 khung hình) để truyền cho các module khác, nhằm đảm bảo mọi chuyển động vật lý (bay lượn, đạn bắn) luôn mượt mà và độc lập với tốc độ khung hình (FPS) thực tế của thiết bị người dùng.
   - **`SceneController.js`**: Quản lý cấp thấp các đối tượng cơ bản của thư viện Three.js. Khởi tạo `THREE.Scene` (không gian 3D), `THREE.PerspectiveCamera` (góc nhìn), cấu hình `THREE.WebGLRenderer` (kích thước render, bóng đổ, khử răng cưa), và thêm các hệ thống ánh sáng (AmbientLight, DirectionalLight). Cung cấp hàm `render()` cốt lõi.
   - **`StateManager.js`**: Một máy trạng thái (State Machine) thu nhỏ lưu trữ và cung cấp phương thức chuyển đổi an toàn giữa các trạng thái khác nhau (ví dụ: `MENU`, `PLAYING`, `PAUSED`, `GAMEOVER`). Điều này ngăn chặn lỗi logic như việc người chơi bắn đạn khi đang ở màn hình chờ hoặc khi game đã kết thúc.
   - **`ProjectileSystem.js`**: Xử lý vật lý và hình ảnh cho toàn bộ đạn và tia laser trong không gian. File này áp dụng triệt để mẫu thiết kế "Object Pooling": thay vì khởi tạo rồi xóa liên tục các Object3D làm đầy bộ nhớ, nó tạo sẵn một mảng lớn các tia đạn bị ẩn. Khi có lệnh bắn, tia đạn được tái kích hoạt; khi trúng đích hoặc bay ra ngoài, nó ẩn đi và được trả lại mảng chờ.

2. **Hệ thống Người Chơi (Player System - `src/systems/player/`)**
   - **`Player.js`**: Xử lý việc nạp và render tàu người chơi lên Scene 3D. Nhận/xử lý sự kiện bàn phím (WASD) hoặc chuột để cập nhật vị trí tàu theo thời gian thực. File này cũng thiết lập ranh giới (bounds) động dựa trên tỷ lệ màn hình để ngăn tàu người chơi bay ra khỏi vùng nhìn thấy của Camera.
   - **`Combat.js`**: Xử lý logic chiến đấu độc lập của người chơi. Nhiệm vụ chính là kiểm tra va chạm (collision detection) giữa hitbox của tàu và đạn địch hoặc thiên thạch; thực hiện trừ HP (máu); phát tín hiệu rung màn hình, âm thanh trúng đòn; và nếu máu về 0, gửi thông báo báo tử đến GameManager.
   - **`Weapon.js`**: Quản lý kho vũ khí của tàu. Xác định tốc độ bắn (fire rate), số lượng tia laser xuất ra cùng lúc dựa theo cấp độ (level) súng, lượng đạn (ammo) bị tiêu thụ cho mỗi lần nhấn bắn. File sẽ ngăn chặn thao tác bắn nếu người chơi hết đạn hoặc dính phải hiệu ứng "khóa vũ khí".
   - **`ItemSystem.js`**: Điều phối việc sinh ra các vật phẩm rơi tự do (drop items) khi tiêu diệt quái hoặc sinh ngẫu nhiên. File quy định chi tiết tác dụng của vật phẩm viền xanh (hồi máu, tiếp đạn, tạo khiên năng lượng tạm thời, nâng cấp súng) và vật phẩm viền đỏ (khóa súng, kích hoạt bão thiên thạch). Chịu trách nhiệm render icon đồ vật và cập nhật vòng quay 3D.
   - **`Score.js`**: Đóng gói logic tính điểm. Cập nhật điểm tạm thời ở màn chơi hiện tại và lưu trữ Điểm Cao Nhất (High Score) vào `localStorage` của trình duyệt, đảm bảo duy trì kỷ lục thành tích ngay cả sau khi người chơi tải lại trang.

3. **Hệ thống Kẻ Địch (Enemy System - `src/systems/enemy/`)**
   - **`Enemy.js`**: Lớp cơ sở (Base Class) chuyên khởi tạo các loại quái vật thông thường. Đảm nhận việc tải model 3D riêng biệt, thiết lập thanh máu nhỏ nổi trên đầu quái, cập nhật vị trí bay qua mỗi frame và xử lý logic khi nhận sát thương hoặc phát nổ bị tiêu diệt.
   - **`Boss.js`**: Trình quản lý AI phức tạp cho sinh vật trùm. File này chia hoạt động của Boss làm các Phase (giai đoạn) khác nhau kích hoạt dựa trên phần trăm HP còn lại. Bao gồm logic lẩn trốn, gọi thêm tiểu đệ (summon), hoặc bắn đạn chùm (scatter shot) chuyên biệt cho 3 cấp độ Boss khác nhau.
   - **`SwarmMovement.js`**: Module điều khiển bầy đàn. Thực hiện nhóm các thực thể quái vật lại với nhau, điều chỉnh sự di chuyển của chúng theo quỹ đạo đồng bộ để tạo ra các đợt tấn công có tính chiến thuật thay vì bay rải rác lộn xộn.
   - **`Patterns.js`**: Kho chứa các bộ công thức toán học nội suy quỹ đạo. Nó sinh ra một danh sách các điểm `Vector3` để vạch sẵn lộ trình bay. Cung cấp cho kẻ địch các kiểu di chuyển như Zig-zag, hình sin lượn sóng, hoặc bay vòng tròn bọc lót.

4. **Hệ thống Môi Trường & Hiệu Ứng (Environment & Effects - `src/systems/environment/` & `src/systems/effects/`)**
   - **`Background.js`**: Quản lý bầu trời sao và lớp tinh vân vũ trụ. Bằng cách can thiệp vào UV mapping của texture (cuộn ảnh liên tục), file tạo ra hiệu ứng parallax mang lại cảm giác tàu đang lao đi rất nhanh trong một không gian sâu thẳm vô tận.
   - **`AsteroidSystem.js`**: Chuyên trách sinh ra các khối thiên thạch (chướng ngại vật) mang kích cỡ và tốc độ xoay hoàn toàn ngẫu nhiên. Xử lý va chạm độc lập với đạn (thiên thạch vỡ vụn) hoặc với người chơi (gây sát thương lớn).
   - **`ParticleSystem.js`**: Lớp xử lý lõi cho hiệu ứng "hạt" (particles). Quản lý toàn bộ vòng đời (lifecycle), độ mờ dần (fade out) và tốc độ phân tán của hàng ngàn hạt nhỏ (Points) được cấu tạo từ Three.js mà không làm đứng máy.
   - **`Explosion.js`**: Gọi API từ ParticleSystem để tạo ra hình ảnh các vụ nổ theo từng quy mô (nổ tia lửa nhỏ khi đạn trúng đích, vụ nổ rực rỡ bùng phát khi tàu địch/Boss bị hủy diệt).
   - **`CameraEffects.js`**: Đảm nhận hiệu ứng rung lắc (Screen Shake). Áp dụng các thuật toán random vị trí Camera theo một biên độ mạnh và tắt dần trong một khoảng thời gian ngắn, kích hoạt khi người chơi bị trúng đòn hoặc khi Boss phát nổ.
   - **`CinematicEffects.js` & `GSA.js`**: Xử lý các đoạn chuyển tiếp kỹ thuật số, làm chậm thời gian (Slow Motion) khi chuyển wave, màn hình chớp tắt báo động sự nguy hiểm trước khi xuất hiện Boss và hỗ trợ ánh sáng toàn cục bổ sung (Global Special Actions).

5. **Hệ thống Giao Diện & Âm Thanh (UI & Audio - `src/systems/ui/` & `src/systems/audio/`)**
   - **`UIManager.js`**: Cầu nối giữa thế giới 3D và giao diện người dùng 2D. Truy xuất DOM để cập nhật liên tục các thanh Progress Bar (thể hiện Máu người chơi, Máu Boss, thanh Đạn) và các Label (Điểm số hiện tại) theo thời gian thực (60 lần/giây).
   - **`Intro.js` & `Splash.js`**: `Splash.js` hiển thị trạng thái Loading ban đầu, phản hồi tỷ lệ tải tài nguyên (từ AssetLoader) và yêu cầu người chơi nhấp chuột lần đầu để bật âm thanh. Kế tiếp, `Intro.js` hiển thị màn hình Main Menu chính thức để bắt đầu Game.
   - **`Story.js`**: Quản lý hệ thống văn bản dẫn truyện. Chịu trách nhiệm hiển thị các đoạn hội thoại có hiệu ứng đánh chữ (typewriter effect), truyền tải bối cảnh nhiệm vụ và cảnh báo thông tin trước mỗi màn đấu.
   - **`EndingUI.js`**: Chuyên hiển thị giao diện kết thúc (Win/Game Over), công bố điểm số cuối cùng, ghi nhận kỷ lục và cung cấp nút bấm "Chơi Lại" để reset toàn bộ hệ thống GameManager.
   - **`Crosshair.js`**: Tạo hình và xử lý di chuyển của biểu tượng tâm ngắm (chuột) trên màn hình HTML Canvas, giúp định hướng đường bắn chính xác hơn thay cho con trỏ mặc định.
   - **`music.js`**: Module quản lý âm thanh tập trung độc lập. Nạp các đường dẫn âm thanh, cung cấp API phát hiệu ứng tức thời (SFX) cho súng, vụ nổ, ăn đồ, cũng như xử lý luồng nhạc nền (BGM) song song, tự động ngắt/chuyển bài êm ái khi đổi trạng thái màn chơi.

6. **Tiện ích và Dữ liệu (Utils - `src/utils/`)**
   - **`CONFIG.JS`**: "Bách khoa toàn thư" cấu hình tĩnh. Mọi biến số được gom vào file này (chỉ số sức mạnh máu, damage, hệ số tính điểm cho từng quái vật, đường dẫn file tài nguyên) để bất kỳ file nào khác cũng có thể `import` sử dụng, hoàn toàn tránh được tình trạng "hardcode" magic number.
   - **`AssetLoader.js`**: Sử dụng `Promise` để tải hàng loạt tài nguyên thông qua `THREE.TextureLoader` và `GLTFLoader`. Nó lắng nghe, đếm số lượng tài nguyên thành công/thất bại, tính toán tiến trình (progress) để báo cáo lại cho `Splash.js`.
   - **`ModelCache.js`**: Bộ đệm tối ưu hóa mô hình 3D. Đảm bảo mỗi mô hình `.glb` (Boss, Quái, Tàu) chỉ được tải và phân tích cấu trúc đúng 1 lần duy nhất vào RAM. Sau đó, mọi lời gọi sinh quái vật sẽ trả về một bản clone sâu, triệt tiêu vấn nạn giật lag và tràn bộ nhớ.
   - **`Math.js`**: Thư viện xử lý thuật toán hình học tuỳ chỉnh. Gói gọn các logic phức tạp như tìm điểm giao cắt Bounding Box, quét bán kính Bounding Sphere cho va chạm, nội suy tuyến tính `Lerp` (làm mượt chuyển động xoay và bay) và tính vector đường đạn.

---

## Phần 2: Các yêu cầu kỹ thuật phát sinh và cách giải quyết

Trong quá trình thực tế, nhiều thách thức kỹ thuật đã phát sinh và được khắc phục triệt để nhằm đảm bảo trải nghiệm chơi game 60 FPS mượt mà:

1. **Hiện tượng tụt FPS khi có quá nhiều hạt hội tụ (Fill Rate Bottleneck)**
   - **Vấn đề**: Hoạt ảnh tụ hạt từ Logo vào Tàu vũ trụ có hàng chục ngàn hạt, khi chúng đè lên nhau khiến GPU bị quá tải.
   - **Giải quyết**: Trong module `GSA.js`, đã triển khai một Custom Shader tự động tính toán tiến trình `uProgress`. Khi các hạt càng tiến gần về đích, kích thước của chúng tự động thu nhỏ lại để giảm diện tích render chồng lấp, giúp duy trì 60 FPS ổn định.

2. **Sai số di chuyển gây lỗi "Dính nghiêng" (Rotation Sticky)**
   - **Vấn đề**: Sau khi người chơi nhả phím di chuyển, do sai số của phép nội suy Lerp, tàu không trở về trạng thái nằm ngang tuyệt đối mà bị nghiêng nhẹ 0.01 độ.
   - **Giải quyết**: Trong `Player.update`, đã triển khai cơ chế Force Reset. Khi vận tốc tàu về 0 và góc nghiêng nhỏ hơn ngưỡng cho phép, hệ thống sẽ ép góc quay về 0 tuyệt đối.

3. **Đạn bắn xuyên qua mục tiêu (Bullet Tunneling)**
   - **Vấn đề**: Đạn di chuyển quá nhanh khiến việc kiểm tra va chạm điểm ở mỗi khung hình bị sai lệch (đạn nhảy cóc qua mục tiêu).
   - **Giải quyết**: Thay thế việc kiểm tra điểm bằng Bounding Box (Box3) cho các mục tiêu lớn (Boss) và sử dụng Hitbox bán kính lớn kết hợp với quét Crosshair để đảm bảo va chạm luôn chính xác.

4. **Quản lý bộ nhớ (Garbage Collection Lag)**
   - **Vấn đề**: Việc tạo và xóa liên tục các đối tượng đạn và vụ nổ khiến trình duyệt phải dọn rác bộ nhớ, gây ra các cú khựng (stutter) định kỳ.
   - **Giải quyết**: Triển khai Object Pooling trong `ParticleSystem` và `ProjectileSystem`. Toàn bộ đạn và hạt hiệu ứng được khởi tạo sẵn một lần và chỉ thay đổi vị trí/ẩn hiện khi cần thiết thay vì xóa bỏ.

5. **Cân bằng tài nguyên (Ammo Deadlock)**
   - **Vấn đề**: Người chơi bắn hết đạn mà không có cách nào tiêu diệt quái để rơi đạn mới.
   - **Giải quyết**: Triển khai module Emergency Ammo trong `ItemSystem`. Nếu đạn bằng 0 trong 8 giây liên tục, hệ thống sẽ tự động thả một hòm tiếp tế để giải cứu người chơi.

6. **Hiệu ứng Parallax và Chiều sâu không gian**
   - **Vấn đề**: Nếu nền đứng yên, người chơi sẽ cảm thấy tàu vũ trụ đang bay lơ lửng tại chỗ thay vì lao đi trong không gian.
   - **Giải quyết**: Triển khai hệ thống sao đa tầng trong `Background.js`. Các tầng sao khác nhau di chuyển với vận tốc khác nhau dựa trên tọa độ của tàu (Parallax Scrolling), giúp người chơi cảm nhận được độ sâu của vũ trụ.

---

## Phần 3: Trình tự quá trình tạo ra dự án (Workflow Timeline)

Dựa trên lịch sử git và sự liên kết của codebase, quá trình hoàn thiện game diễn ra theo trình tự sau:

### Giai đoạn 1: Thiết lập nền móng và lõi trò chơi
- Thiết lập dự án với Vite (`package.json`, `vite.config.js`).
- Khởi tạo thư mục và các tệp tài liệu cốt lõi (`docs/GDD.md`, `struct.md`).
- Thiết kế **Core System** đầu tiên (`GameManager.js`, `GameLoop.js`, `SceneController.js`, `StateManager.js`) và nạp thư viện Three.js.
- Cấu hình file `CONFIG.JS` và tạo hàm kết nối vào `src/main.js`.
- *Sản phẩm*: Màn hình đen với khả năng render vòng lặp game.

### Giai đoạn 2: Tích hợp Assets và Cơ chế Điều khiển
- Xây dựng **Utils Module** (`AssetLoader.js`, `ModelCache.js`) để nạp các mô hình đầu tiên như `Tau.glb`, `Monster 1.glb`, `Boss 1.1.glb`.
- Lập trình **Player System** (`Player.js`, `Weapon.js`) cho phép tàu di chuyển và bắn đạn cơ bản (`ProjectileSystem.js`).
- *Sản phẩm*: Người chơi có thể lái tàu và bắn súng trong không gian tĩnh.

### Giai đoạn 3: Môi trường, Kẻ địch và Cắt cảnh
- Đưa Background di chuyển (Parallax) và Hệ thống thiên thạch vào hoạt động (`Background.js`, `AsteroidSystem.js`).
- Phát triển **Enemy System**: từ quái vật bay theo bầy (`SwarmMovement.js`, `Patterns.js`) đến cấu trúc AI đa pha của Boss (`Boss.js`).
- Xử lý tương tác vật lý và va chạm (`Math.js`, `Combat.js`), bổ sung hệ thống rớt Vật phẩm (`ItemSystem.js`).
- Thêm hiệu ứng hạt nổ (`ParticleSystem.js`, `Explosion.js`) và hiệu ứng rung camera (`CameraEffects.js`).
- *Sản phẩm*: Gameplay vòng lặp cốt lõi hoàn thiện, quái xuất hiện và có thể bị bắn nổ vỡ.

### Giai đoạn 4: Hoàn thiện Giao Diện (UI) & Trải nghiệm
- Tạo lớp phủ UI bằng HTML/CSS tích hợp vào JS: `UIManager.js` (HUD máu, đạn), `Intro.js` (Màn hình chính), `Story.js` (Dẫn truyện).
- Phát triển hệ thống Điểm số (`Score.js`) và màn hình kết thúc (`EndingUI.js`).

### Giai đoạn 5: Bổ sung Âm thanh, Fix bug và Clean Code
- Bổ sung toàn bộ tài nguyên âm thanh (`nhac_nen_chien_dau.mp3`, `hieu_ung_laser_ban.wav`,...). Quản lý tập trung tại `music.js`.
- Rà soát và **Clean code**: Xóa các file dư thừa (`EnvironmentConfig.js`, `SpecialEffects.js`, thư mục `shaders`). Sửa đổi đường dẫn audio/model, nâng cấp model thiên thạch (`meteorite.glb`).
- Viết file `Realme.md` hướng dẫn chơi và hoàn thiện file `step.md` giải thích chi tiết toàn bộ quá trình, nghiệm thu thành công sản phẩm.

---

## Phần 4: Luồng hoạt động (Execution Flow) của các module chính

Để hiểu rõ cách game vận hành từ lúc người chơi mở trình duyệt cho đến lúc kết thúc, chúng ta có thể xem xét luồng hoạt động (Data Flow / Execution Flow) thông qua sự tương tác vòng tròn giữa các module chính:

### Bước 1: Khởi tạo và Tải tài nguyên (Initialization)
1. Điểm bắt đầu là `src/main.js`. File này khởi tạo một thực thể duy nhất (singleton) của `GameManager`.
2. `GameManager` thiết lập không gian 3D qua `SceneController`, khởi tạo hệ thống âm thanh `MusicSystem` và tàu `Player`.
3. Trình duyệt hiển thị `Splash.js`. Màn hình này kích hoạt hàm nạp từ `AssetLoader.js` để tải trước toàn bộ 3D models (`.glb`), hình ảnh và âm thanh. Các models 3D sau khi tải sẽ được nén vào `ModelCache.js` nhằm tối ưu hóa việc phân tích cú pháp (parse).
4. Khi thanh tiến trình đạt 100%, người chơi bấm "Bắt đầu", `Splash` bị ẩn đi và Game chuyển qua kịch bản Intro.

### Bước 2: Chuỗi Cắt Cảnh (Cinematic Intro)
1. `GameManager` gọi `startIntroSequence()`. 
2. Module `Intro.js` xử lý lắp ráp mô hình tàu bằng vô số hạt (Particles) bay lại với nhau, sau đó chuyển quyền đạo diễn cho `CinematicEffects.js`.
3. `CinematicEffects` điều khiển camera xoay nhiều góc kết hợp với hệ thống phụ đề từ `Story.js` để giới thiệu cốt truyện. Điểm nhấn cuối đoạn intro là hiệu ứng Lỗ đen (Blackhole) làm biến dạng khung hình và hút phi thuyền vào.
4. Xong đoạn cắt cảnh, `StateManager` gạt cờ `isGameStarted = true`. Giao diện màn hình UI xuất hiện và vòng lặp chính thức bắt đầu màn chơi vỡ lòng (WAVES).

### Bước 3: Vòng lặp Gameplay Chính (The Game Loop)
Khi người chơi trực tiếp cầm lái, `GameLoop.js` hoạt động dựa trên `requestAnimationFrame`, liên tục gọi hàm `GameManager.update(delta)` khoảng 60 lần/giây:
1. **Người chơi (Player):** Đọc input từ bàn phím (WASD) thông qua `Player.js` để di chuyển tàu. Nếu nhấn phím Space, `Weapon.js` kiểm tra đạn và kích hoạt `ProjectileSystem.js` bắn tia laser.
2. **Kẻ địch (Enemies):** `EnemyManager.js` sinh quái vật ra sân bay dựa trên cấu hình từng Wave trong `CONFIG.JS`. Cập nhật quỹ đạo bay mềm mại của bầy quái thông qua thuật toán của `Patterns.js` và `SwarmMovement.js`.
3. **Môi trường sinh động:** Tọa độ nền `Background.js` cuộn texture tạo ảo giác bay cực nhanh. `AsteroidSystem.js` bơm các thiên thạch khổng lồ từ xa lao tới màn hình.
4. **Kiểm tra va chạm (Collision):** Trái tim của Gameplay. Hàm `Combat.update()` liên tục quét khoảng cách giữa đạn, người chơi, quái và thiên thạch (thông qua các hàm trong `Math.js`). Nếu xảy ra va chạm, nó trừ HP, rồi gọi `Explosion.js` tạo cụm tia lửa nổ và kích hoạt rung lắc ống kính ở `CameraEffects.js`.
5. **Đồng bộ Giao diện (UI):** Cuối mỗi chu kỳ, `UIManager.js` lấy máu, đạn của tàu và điểm số từ `Score.js` vẽ trực tiếp lên các thanh Progress Bar HTML.

### Bước 4: Chuyển màn và Đánh Boss
1. Khi `EnemyManager` thông báo đã sạch bóng quái thường trong Wave cuối, `GameManager` chuyển state sang `BOSS`.
2. Khởi tạo một đối tượng sinh vật trùm từ `Boss.js` tương ứng với cấp độ hiện tại (V1, V2 hoặc V3).
3. Boss hoạt động dựa trên cỗ máy trạng thái (FSM) riêng biệt: Bắn laser chùm, tự gọi đàn em bảo vệ, tàng hình hoặc xả sóng xung kích (Shockwave). Cứ mỗi frame, `GameManager` đồng bộ cây máu Boss lên `UIManager`.
4. Khi Boss nổ tung -> Gọi hàm `nextLevel()`. Trò chơi tung ra hiệu ứng Slow-Motion, làm chớp nhoáng màn hình và thực hiện Chuyển cảnh (Warp Speed tunnel), đồng thời cung cấp hộp thoại cốt truyện nối tiếp (`Story.js`) trước khi bước qua `LEVEL_2`.

### Bước 5: Kết thúc Game (Game Over / Victory)
1. **Game Over**: Nếu máu người chơi rơi xuống `<=` 0 trong lúc chiến đấu, `Combat.js` báo tử. `GameManager` ngay lập tức khóa vòng lặp, hiển thị giao diện thất bại ở `EndingUI.js` màu Đỏ thẫm, kèm theo tiếng âm thanh vỡ vụn.
2. **Happy Ending**: Nếu người chơi sống sót và tiêu diệt thành công Boss 3 cuối cùng, `GameManager` chuyển state sang `VICTORY`, dừng mọi đối tượng địch, bật nhạc hùng tráng và hiển thị `EndingUI.js` màu Xanh ngọc kèm thành tích lưu vào bảng kỷ lục `localStorage`.
