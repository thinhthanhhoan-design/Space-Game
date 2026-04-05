import * as THREE from 'three'; // Nhập thư viện Three.js dưới tên THREE để xử lý đồ họa 3D
import { CONFIG } from '../../utils/CONFIG.JS'; // Nhập đối tượng cấu hình từ file CONFIG nhằm sử dụng các hằng số

export class SceneController { // Khai báo lớp SceneController quản lý trực tiếp cảnh 3D (Scene), Camera và Renderer
    constructor() { // Hàm khởi tạo của SceneController, tạo mới các thành phần đồ họa căn bản
        this.scene = new THREE.Scene(); // Khởi tạo một đối tượng Scene (cảnh), nơi chứa mọi vật thể 3D và ánh sáng
        this.scene.fog = new THREE.FogExp2(0x020205, 0.002); // Thêm sương mù (fog) vào cảnh với màu xanh đậm và mật độ 0.002 để tạo chiều sâu

        this.camera = new THREE.PerspectiveCamera(CONFIG.CAMERA.FOV, window.innerWidth / window.innerHeight, 0.1, 1000); // Tạo Camera phối cảnh dựa trên FOV, tỉ lệ màn hình, mặt cắt gần nhất là 0.1 và xa nhất là 1000
        this.camera.position.set(0, 0, 250); // Thiết lập vị trí ban đầu của Camera (cách gốc tọa độ 250 đơn vị theo trục z)

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // Tạo Renderer có bật tính năng khử răng cưa (antialias) và nền trong suốt (alpha)
        this.renderer.setSize(window.innerWidth, window.innerHeight); // Báo cho renderer biết kích thước cửa sổ hiện tại để vẽ đúng tỷ lệ
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Giới hạn tỷ lệ điểm ảnh để tối ưu hóa hiệu năng trên các màn hình có độ phân giải siêu cao (Retina)

        const container = document.getElementById('canvas-container'); // Tìm phần tử DOM có id là canvas-container trên trang HTML
        if (container) { // Kiểm tra nếu container này tồn tại
            container.appendChild(this.renderer.domElement); // Đưa thẻ canvas (nơi sẽ vẽ game) của renderer vào bên trong container này
        } else { // Trong trường hợp không tìm thấy container
            document.body.appendChild(this.renderer.domElement); // Gắn thẳng thẻ canvas vào trong body của HTML
        } // Kết thúc khối if HTML DOM binding

        this.setupLights(); // Gọi hàm thiết lập ánh sáng cơ bản cho scene
        
        // Cấu trúc cho Screen Shake
        this.shakeIntensity = 0; // Biến lưu cường độ rung hiện tại của màn hình
        this.shakeDuration = 0; // Biến lưu thời gian còn lại của hiệu ứng rung màn hình
        this.shakeOffset = new THREE.Vector3(); // Khởi tạo một Vector3 dùng để lưu giá trị độ lệch ngẫu nhiên tạo rung lắc

        window.addEventListener('resize', this.onWindowResize.bind(this)); // Đăng ký sự kiện resize trên window, gọi hàm onWindowResize mỗi khi thay đổi kích cỡ trình duyệt
    } // Kết thúc constructor

    setupLights() { // Phương thức để tạo và gán đèn cho Scene
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Tạo ánh sáng môi trường chiếu tỏa đều xung quanh với cường độ 0.6
        this.scene.add(ambientLight); // Thêm ánh sáng này vào scene để làm sáng các vật thể

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Tạo một nguồn sáng trực tiếp định hướng (đại diện như mặt trời) với cường độ mạnh 1.2
        directionalLight.position.set(10, 20, 10); // Đặt vị trí nguồn sáng phía trên, hướng xuống dưới chéo
        this.scene.add(directionalLight); // Thêm đèn định hướng này vào cảnh
    } // Kết thúc phương thức thiết lập ánh sáng

    triggerShake(intensity = 0.5, duration = 0.4) { // Hàm gọi để gây ra rung màn hình, nhận 2 tham số là độ mạnh và thời gian rung mạc định
        this.shakeIntensity = intensity; // Đặt cường độ rung theo giá trị được truyền vào
        this.shakeDuration = duration; // Đặt bộ đếm thời gian cho đợt rung
    } // Kết thúc hàm triggerShake

    update(delta, playerMesh) { // Hàm cập nhật logic của cảnh ở mỗi khung hình (ví dụ như camera di chuyển)
        // 1. Logic Rung Màn Hình (Screen Shake)
        if (this.shakeDuration > 0) { // Kiểm tra xem hiệu ứng rung có đang diễn ra hay không
            this.shakeDuration -= delta; // Giảm dần thời gian rung còn lại dựa trên delta (chênh lệch thời gian)
            const currentIntensity = this.shakeIntensity * (this.shakeDuration / 0.4); // Cường độ sẽ giảm dần xuống 0 để tạo hiệu ứng tắt dần tự nhiên
            this.shakeOffset.set( // Tính toán các giá trị lệch vị trí ngẫu nhiên theo ba trục dựa trên cường độ rung
                (Math.random() - 0.5) * currentIntensity, // Trục x
                (Math.random() - 0.5) * currentIntensity, // Trục y
                (Math.random() - 0.5) * currentIntensity  // Trục z
            ); // Kết thúc cập nhật góc tạo rung
        } else { // Nếu hết thời gian rung
            this.shakeOffset.set(0, 0, 0); // Đưa độ lệch vị trí về không, máy ảnh đứng im trở lại
        } // Kết thúc logic rung màn hình

        // 2. Camera Follow Logic (Chỉ chạy khi game đã bắt đầu và có tàu)
        if (playerMesh) { // Chỉ tính toán di chuyển camera nếu mô hình tàu bay (playerMesh) thực sự tồn tại
            const targetPos = new THREE.Vector3().copy(playerMesh.position); // Lấy vị trí hiện tại của tàu vũ trụ để làm điểm neo theo dõi
            const offset = CONFIG.CAMERA.OFFSET; // Trích xuất độ lệch khoảng cách đặt camera so với tàu từ đối tượng cấu hình
            
            // Tính toán vị trí camera đích
            const targetCameraPosition = new THREE.Vector3( // Tính ra vị trí lý tưởng mà Camera cần đặt
                targetPos.x + offset.x, // Tọa độ X mục tiêu phụ thuộc vào x của tàu + lệch chuẩn
                targetPos.y + offset.y, // Tọa độ Y mục tiêu
                targetPos.z + offset.z  // Tọa độ Z mục tiêu
            ); // Kết thúc tính vị trí đích

            // Lerp để camera đuổi theo mượt mà
            this.camera.position.lerp(targetCameraPosition, CONFIG.CAMERA.FOLLOW_LERP); // Di chuyển từ từ (nội suy tuyến tính) camera từ vị trí hiện tại đến vị trí đích tạo độ mượt
            
            // Áp dụng shake offset sau khi đã di chuyển camera
            this.camera.position.add(this.shakeOffset); // Thêm vector rung màn hình vào camera tạo hiệu ứng nảy/rung
            
            // Luôn nhìn về phía trước máy bay một chút (Dynamic LookAt)
            const lookAtPos = new THREE.Vector3(targetPos.x, targetPos.y, targetPos.z - 10); // Xác định một điểm nằm ngắm ở phía trước mũi tàu (-10 trục z)
            this.camera.lookAt(lookAtPos); // Buộc camera luôn phải hướng ống kính về điểm ngắm vừa tính
        } // Kết thúc logic điều chỉnh camera
    } // Kết thúc vòng lặp thuộc về cảnh

    onWindowResize() { // Hàm xử lý khi người dùng đổi kích cỡ cửa sổ trình duyệt (bẻ ngang/dọc đt)
        this.camera.aspect = window.innerWidth / window.innerHeight; // Tính lại tỷ lệ khung hình cho camera
        this.camera.updateProjectionMatrix(); // Cập nhật lại số liệu phản chiếu của camera theo tỷ lệ mới để không bị méo hình
        this.renderer.setSize(window.innerWidth, window.innerHeight); // Điều chỉnh lại diện tích canvas xuất hình để vừa với cửa sổ
    } // Kết thúc resize callback

    render() { // Phương thức gọi cuối cùng yêu cầu WebGL vẽ hình ảnh
        this.renderer.render(this.scene, this.camera); // Ra lệnh cho renderer thực kết xuất và vẽ hiện trạng cảnh 3D dưới góc nhìn camera lên màn hình HTML
    } // Kết thúc phương thức kết xuất
} // Khép lại toàn bộ lớp SceneController
