import { SceneController } from './SceneController.js'; // Nhập lớp quản lý cảnh 3D
import { GameLoop } from './GameLoop.js'; // Nhập lớp vòng lặp điều khiển tiến trình trò chơi
import { StateManager } from './StateManager.js'; // Nhập lớp quản lý các trạng thái game (Intro, Playing, v.v.)
import { Intro } from '../ui/Intro.js'; // Nhập hệ thống UI giới thiệu đầu game
import { Player } from '../player/Player.js'; // Nhập lớp Người chơi để điều khiển phi thuyền
import { Background } from '../environment/Background.js'; // Nhập hệ thống môi trường và nền vũ trụ

import { CONFIG } from '../../utils/CONFIG.JS'; // Nhập đối tượng cấu hình chung cho toàn bộ dự án

export class GameManager { // Khai báo lớp GameManager, coi như bộ não tổng chỉ huy các hệ thống khác
    constructor() { // Khởi tạo thực thể GameManager
        this.sceneController = new SceneController(); // Khởi tạo controller cho camera, ánh sáng và scene 3D
        this.stateManager = new StateManager(); // Khởi tạo bộ phận quản lý cờ trạng thái game
        this.gameLoop = new GameLoop(this.sceneController, this); // Tạo vòng lặp game chính, truyền vào sceneController và chính bản thân này
        
        this.intro = new Intro(this.sceneController); // Tạo hệ thống chạy Intro/Màn hình chờ, nhận scene controller để dùng camera
        this.player = new Player(this.sceneController.scene); // Khởi tạo phi thuyền người chơi và nhét nó vào scene đồ họa
        this.background = new Background(); // Khởi tạo đối tượng quản lý bầu trời sao/hành tinh
        // AsteroidSystem đã bị gỡ bỏ theo yêu cầu // Dòng này là bình luận có sẵn, báo rằng hệ thống chướng ngại vật đang tạm thời bị loại bỏ
    } // Kết thúc hàm khởi tạo

    init() { // Hàm khởi tạo khởi chạy để load các texture/model
        const bgUrl = CONFIG.ASSETS.TEXTURES.SPACE_BG; // Lấy ra đường dẫn hình ảnh nền vũ trụ từ file cài đặt
        this.background.init(this.sceneController.scene, bgUrl); // Truyền cảnh và đường dẫn vào hàm init của lớp Background để nạp và render hệ thống ống lưới/sao
        
        this.intro.init((logoPoints) => { // Bắt đầu chu trình load intro, khi kết thúc gọi lại với mảng điểm (chữ bay bay)
            const checkModel = setInterval(() => { // Thiết lập một vòng lặp hỏi định kỳ sau mỗi 100ms
                if (this.player.mesh) { // Kiểm tra nếu mô hình 3D của phi thuyền đã load xong và có mặt trong cảnh
                    clearInterval(checkModel); // Nếu mô hình có rồi thì dừng việc lặp đi lặp lại
                    this.intro.startTransition(logoPoints, this.player.mesh, this.sceneController.camera, () => { // Bắt đầu hiệu ứng chuyển cảnh từ intro vào game
                        this.stateManager.setGameStarted(true); // Khi intro hoàn thành mượt mà, thì lệnh cho StateManager chuyển game qua trạng thái sẵn sàng "PLAYING"
                    }); // Kết thúc callback hàm startTransition
                } // Kết thúc if
            }, 100); // 100ms cho vòng lặp setInterval
        }); // Kết thúc callback hàm init của intro

        this.gameLoop.start(); // Sau khi mọi thứ đã gọi lên, chính thức khởi động vòng lặp game chạy vô tận (render/update loop)
    } // Bước init này chỉ chạy 1 lần khi load trang

    update(elapsedTime, delta) { // Hàm update tổng của game, chạy liên tục khoảng 60 lần/giây nhờ GameLoop. Truyền vào thời gian trôi qua và delta
        if (!this.stateManager.isGameStarted) { // Kiểm tra nếu cờ trạng thái báo trò chơi chưa vào phần hành động
            this.intro.update(elapsedTime); // Cập nhật hình ảnh/động tác của vật thể trong đoạn intro
            if (this.player.mesh) this.player.mesh.visible = false; // Ngăn không cho người dùng thấy được mô hình tàu khi vẫn còn load intro
        } else { // Nếu trạng thái đã là PLAYING
            if (this.player.mesh) { // Kiểm tra lại một lần cho chắc rằng mesh không rỗng
                this.player.mesh.visible = true; // Hiện tàu bay lên
                this.player.update(); // Gọi phương thức update của tàu, xử lý di chuyển và nút bấm

                // --- HORIZON BANKING (WORLD ROLL) --- (logic xoay nghiêng nền trời)
                const envX = CONFIG.ENGINE.FLIGHT_ENVELOPE.X; // Lấy giới hạn bay của tàu dọc theo trục X
                let xRatio = this.player.mesh.position.x / envX; // Tính tỷ lệ khoảng cách của tàu tới biên trái phải (-1 đến 1)
                xRatio = Math.max(-1.8, Math.min(1.8, xRatio)); // Giới hạn tỷ lệ ở mức tối đa -1.8 và 1.8 bằng min/max
                
                const targetBgRoll = -xRatio * CONFIG.ENGINE.DYNAMIC_BANKING.WORLD_ROLL_LIMIT; // Tính toán góc xoay nghiêng nền cần đạt được, tỷ lệ nghịch với vị trí người chơi
                this.background.setRoll(targetBgRoll, CONFIG.ENGINE.DYNAMIC_BANKING.SMOOTHNESS); // Cập nhật góc xoay nền một cách mượt mà cho background
            } // Kết thúc block player update
        } // Kết thúc khối check trạng thái

        // --- CAMERA UPDATE --- (Cập nhật góc nhìn)
        if (this.stateManager.isGameStarted) { // Kiểm tra trò chơi đã chơi thật chưa
            this.sceneController.update(delta, this.player.mesh); // Bảo sceneController cập nhật góc follow và focus của camera dính vào phi thuyền
        } // Kết thúc cập nhật camera
        
        this.background.update(); // Gọi nền trời cập nhật chuyển động tiến vào trong của vòng hầm/ống không gian
    } // Khép lại hàm update tổng
} // Khép lại lớp GameManager
