export const GAME_STATE = { // Khai báo và xuất một hằng số đối tượng GAME_STATE chứa các trạng thái có thể của trò chơi
    INTRO: 'INTRO', // Trạng thái màn hình giới thiệu
    MENU: 'MENU', // Trạng thái màn hình menu chính
    PLAYING: 'PLAYING', // Trạng thái đang chơi game
    GAME_OVER: 'GAME_OVER' // Trạng thái kết thúc game
}; // Kết thúc định nghĩa hằng số GAME_STATE

export class StateManager { // Khai báo và xuất lớp StateManager dùng để quản lý trạng thái hiện tại của trò chơi
    constructor() { // Hàm khởi tạo của StateManager
        this.currentState = GAME_STATE.INTRO; // Đặt trạng thái ban đầu của hệ thống là INTRO (giới thiệu)
        this.isGameStarted = false; // Đặt cờ trạng thái báo hiệu trò chơi chưa bắt đầu
    } // Kết thúc hàm khởi tạo

    setGameStarted(status) { // Phương thức để thay đổi trạng thái bắt đầu vòng lặp chính của trò chơi
        this.isGameStarted = status; // Cập nhật cờ isGameStarted theo tham số status truyền vào
        if (status) { // Kiểm tra nếu status là true (trò chơi chính thức bắt đầu)
            this.currentState = GAME_STATE.PLAYING; // Chuyển trạng thái hiện hành sang PLAYING
        } // Kết thúc khối if
    } // Kết thúc phương thức setGameStarted
} // Kết thúc khai báo lớp StateManager
