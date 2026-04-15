import { SceneController } from './SceneController.js'; // Nhập lớp quản lý cảnh 3D (Camera, Ánh sáng, Renderer)
import { GameLoop } from './GameLoop.js'; // Nhập lớp vòng lặp điều khiển tiến trình trò chơi (60fps)
import gsap from 'gsap';
import { StateManager } from './StateManager.js'; // Nhập lớp quản lý các trạng thái game (Intro, Playing, v.v.)
import { Intro } from '../ui/Intro.js'; // Nhập hệ thống UI giới thiệu và hoạt cảnh đầu game
import { Player } from '../player/Player.js'; // Nhập lớp Người chơi để khởi tạo phi thuyền UETE-3637
import { Background } from '../environment/Background.js'; // Nhập hệ thống môi trường, nền vũ trụ, tinh vân
import { CinematicEffects } from '../effects/CinematicEffects.js';
import { ProjectileSystem } from '../core/ProjectileSystem.js';
import { EnemyManager } from '../enemy/Enemy.js';
import { Boss } from '../enemy/Boss.js';
import { AsteroidSystem } from '../environment/AsteroidSystem.js';

import { CONFIG } from '../../utils/CONFIG.JS'; // Nhập đối tượng cấu hình trung tâm cho toàn bộ dự án

export class GameManager { // Khai báo lớp GameManager - "Bộ não" tổng chỉ huy của trò chơi
    constructor() { // Hàm khởi tạo thực thể GameManager
        this.sceneController = new SceneController(); // Khởi tạo bộ điều khiển đồ họa (scene, máy ảnh, renderer)
        this.stateManager = new StateManager(); // Khởi tạo bộ phận quản lý trạng thái trò chơi (bật/tắt các giai đoạn)
        this.gameLoop = new GameLoop(this.sceneController, this); // Tạo vòng lặp game chính, kết nối với scene và logic GameManager

        this.intro = new Intro(this.sceneController); // Khởi tạo hoạt cảnh giới thiệu, dùng chung camera từ core
        this.player = new Player(this.sceneController.scene); // Khởi tạo tàu người chơi và đặt nó vào không gian 3D của scene
        this.background = new Background(); // Khởi tạo đối tượng quản lý nền trời vũ trụ và các vì sao

        this.cinematicEffects = new CinematicEffects(this.sceneController.scene, this.sceneController.camera);
        // AsteroidSystem hiện đang được cấu hình mật độ thấp hoặc gỡ bỏ tùy theo cài đặt trong CONFIG // Ghi chú hệ thống vật cản
        this.projectileSystem = new ProjectileSystem(this.sceneController.scene);
        this.enemyManager = new EnemyManager(this.sceneController.scene, this.projectileSystem);
        this.asteroidSystem = new AsteroidSystem(this.sceneController.scene);
        this.boss = null;

        this.gamePlayState = 'WAVES'; // 'WAVES', 'ASTEROIDS', 'BOSS'
    } // Kết thúc quá trình lắp ráp các module

    init() { // Hàm khởi tạo chính để nạp tài nguyên và bắt đầu khởi chạy luồng game
        const bgUrl = CONFIG.ASSETS.TEXTURES.SPACE_BG; // Lấy đường dẫn ảnh nền vũ trụ từ file cấu hình chung
        this.background.init(this.sceneController.scene, bgUrl); // Truyền cảnh và đường dẫn ảnh để Background nạp textures

        // Bắt đầu chuỗi hoạt động của phần giới thiệu (Intro)
        this.intro.init((logoPoints) => { // Khi Intro nạp chữ xong, nhận lại mảng điểm logoPoints
            const checkModel = setInterval(() => { // Thiết lập bộ đếm thời gian hỏi định kỳ 100ms
                if (this.player.mesh) { // Kiểm tra nếu mô hình 3D chiếc máy bay đã được tải xong từ server
                    clearInterval(checkModel); // Nếu tàu đã xuất hiện thì ngừng việc kiểm tra lặp lại
                    // Thực hiện hiệu ứng chuyển cảnh mượt mà từ màn hình Intro vào góc nhìn sau tàu (HỘI TỤ HẠT -> TÀU XUẤT HIỆN)
                    this.intro.startTransition(logoPoints, this.player.mesh, this.sceneController.camera, () => {

                        // Đảm bảo tàu được hiển thị trực quan ngay bây giờ
                        this.player.mesh.visible = true;

                        // Kích hoạt hiệu ứng sao bay sượt qua camera tạo tốc độ Warp
                        this.cinematicEffects.startSpeedLines();

                        // Đợi 1 giây sau khi tàu hiện lên để người chơi chiêm ngưỡng, sau đó mới chạy film và lời thoại
                        setTimeout(() => {
                            // SAU KHI TÀU XUẤT HIỆN -> CHẠY SHORT FILM (CÁC CẢNH QUAY CAMERA & LỜI THOẠI)
                            this.cinematicEffects.runShortFilm(CONFIG.CINEMATIC.SHOTS, () => {

                                // SAU KHI KẾT THÚC SHORT FILM -> KÍCH HOẠT HỐ ĐEN (CLIMAX)
                                this.cinematicEffects.warningEffect();
                                this.cinematicEffects.showText("CẢNH BÁO: Phát hiện lỗ hổng không gian khổng lồ!", 2.5);

                                setTimeout(() => {
                                    // Tắt sao bay để dồn sự chú ý vào hố đen
                                    this.cinematicEffects.stopSpeedLines();

                                    this.cinematicEffects.triggerBlackHole(this.player.mesh, () => {
                                        // SAU KHI XUYÊN QUA HỐ ĐEN -> CHẠY HIỆU ỨNG ĐƯỜNG HẦM
                                        this.cinematicEffects.startTunnelEffect(this.player.mesh, () => {
                                            // KẾT THÚC ĐƯỜNG HẦM -> BẮT ĐẦU GAMEPLAY THỰC SỰ
                                            this.stateManager.setGameStarted(true);
                                            this.enemyManager.startWaveSystem();
                                        });
                                    });
                                }, 1500);

                            });
                        }, 1000);
                    }); // Kết thúc callback hàm chuyển cảnh
                } // Kết thúc kiểm tra model
            }, 100); // Tần suất kiểm tra là 0.1 giây một lần
        }); // Kết thúc callback khởi tạo intro

        this.gameLoop.start(); // Chính thức kích hoạt vòng lặp game liên tục (requestAnimationFrame)
    } // Kết thúc hàm nạp tài nguyên

    update(elapsedTime, delta) { // Hàm cập nhật logic game, được GameLoop gọi liên tục (60 lần/giây)
        if (!this.stateManager.isGameStarted) { // Nếu trò chơi đang ở giai đoạn Intro (chưa bắt đầu bay thật)
            this.intro.update(elapsedTime); // Chỉ cập nhật các hiệu ứng chuyển động trong màn hình Intro
        } else { // Nếu trạng thái đã chuyển sang "PLAYING" (đang chơi)
            if (this.player.mesh) { // Đảm bảo mô hình tàu đã sẵn sàng
                this.player.mesh.visible = true; // Hiện tàu bay lên để người chơi điều khiển
                this.player.update(); // Gọi logic điều khiển tàu (nút bấm, di chuyển, xoay nghiêng)

                // --- LOGIC HORIZON BANKING (Xoay nghiêng toàn bộ thế giới) ---
                const envX = CONFIG.ENGINE.FLIGHT_ENVELOPE.X;
                let xRatio = this.player.mesh.position.x / envX; // Tính xem tàu đang ở đâu so với biên (từ -1 đến 1)
                xRatio = Math.max(-1.8, Math.min(1.8, xRatio)); // Giới hạn tỉ lệ để tránh nền bị xoay quá gắt

                // Tính toán góc nghiêng của nền trời dựa trên vị trí ngang của tàu (nghiêng ngược lại để tạo cảm giác thực)
                const targetBgRoll = -xRatio * CONFIG.ENGINE.DYNAMIC_BANKING.WORLD_ROLL_LIMIT;
                // Áp dụng góc xoay này vào hệ thống Background với độ mượt lerp đã cài đặt
                this.background.setRoll(targetBgRoll, CONFIG.ENGINE.DYNAMIC_BANKING.SMOOTHNESS);

                // --- LOGIC GAMEPLAY SEQUENCE ---
                this.projectileSystem.update(delta);

                // Kiểm tra va chạm đạn với người chơi
                const dmg = this.projectileSystem.checkCollision(this.player.mesh, 1.2);
                if (dmg) {
                    this.player.takeDamage(dmg);
                    this.sceneController.triggerShake(0.5, 0.3);
                }

                if (this.gamePlayState === 'WAVES') {
                    this.enemyManager.update(delta, this.player.mesh.position);
                    if (this.enemyManager.isAllWavesCleared) {
                        this.gamePlayState = 'BOSS';
                        this.boss = new Boss(this.sceneController.scene, this.projectileSystem);
                        console.log("Boss 1 xuất hiện!");
                    }
                } else if (this.gamePlayState === 'BOSS') {
                    if (this.boss) {
                        this.boss.update(delta, this.player.mesh.position);
                    }
                }
            } // Kết thúc block player update
        } // Kết thúc khối phân nhánh trạng thái

        // --- CẬP NHẬT CAMERA (Camera Update) ---
        if (this.stateManager.isGameStarted) { // Nếu đã vào màn chơi chính
            // Yêu cầu camera đuổi theo và lấy nét vào mô hình máy bay
            this.sceneController.update(delta, this.player.mesh);
        } // Kết thúc cập nhật camera

        // Cập nhật các hiệu ứng nền vũ trụ (sao quay nhè nhẹ, tinh vân trôi lững lờ)
        this.background.update();
    } // Khép lại hàm update tổng
} // Khép lại lớp GameManager
