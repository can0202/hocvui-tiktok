# BẢN PHÂN TÍCH KIẾN TRÚC & GIAO DIỆN "LỚP HỌC CHỮ"

> Tài liệu phân tích chuyên sâu phục vụ cho việc tùy biến giao diện, tách biệt hoàn toàn giữa **Logic Game** (bất biến) và **Tầng Hiển Thị** (UI/UX).
> 
> *Dựa trên việc rà soát các tệp nguồn cốt lõi: `src/game/GameStage.tsx`, `src/game/Hair.tsx`, `src/game/GameControls.tsx`, `src/game/config.ts`, `src/game/quiz.ts` và `server.ts`.*

---

## 1. SƠ ĐỒ LUỒNG DỮ LIỆU TOÀN HỆ THỐNG

### 1.1. Luồng tổng thể: Server ⇄ quiz.ts ⇄ GameStage ⇄ /api/game/state ⇄ GameControls

```
  ┌─────────────────────────────────────────────────────────┐
  │                 TIKTOK LIVE / CLIENT HOST               │
  │     (Bình luận người xem, Quà tặng, Tim, Share...)       │
  └────────────────────────────┬────────────────────────────┘
                               │ WebSocket / Protobuf
                               ▼
  ┌─────────────────────────────────────────────────────────┐
  │                 server.ts (Node Express)                │
  │  - tiktok-live-connector kết nối phòng LIVE             │
  │  - Giả lập test (/api/test/emit)                        │
  │  - Lưu trữ sổ lớp, điểm tuần, học bạ (data/so-lop.json)  │
  └──────────────┬───────────────────────────▲──────────────┘
                 │ SSE (/api/tiktok/events)  │ POST /api/game/state
                 │ (chat, gift, like...)     │ (StageView snapshot)
                 ▼                           │
  ┌──────────────────────────────────────────┴──────────────┐
  │         Trang Stage: http://localhost:3006/?view=stage   │
  │  ┌───────────────────────────────────────────────────┐  │
  │  │ useGame.ts (Quản lý vòng đời & nhịp game)         │  │
  │  │   - useLiveEvents lắng nghe SSE từ Server         │  │
  │  │   - Loop tick 200ms (5 lần/giây)                  │  │
  │  │   - Quản lý đồng bộ TTS & Âm thanh SFX             │  │
  │  └─────────────────────┬─────────────────────────────┘  │
  │                        │                                │
  │                        ▼                                │
  │  ┌───────────────────────────────────────────────────┐  │
  │  │ quiz.ts (Classroom - LÕI LOGIC GAME)               │  │
  │  │   - Tính điểm, phân loại top nhanh nhất theo ms   │  │
  │  │   - Quản lý 30 ghế học sinh, tổ đội, giám thị    │  │
  │  │   - Sinh snapshot qua Classroom.view(now)         │  │
  │  └─────────────────────┬─────────────────────────────┘  │
  │                        │ Trả về StageView               │
  │                        ▼                                │
  │  ┌───────────────────────────────────────────────────┐  │
  │  │ GameStage.tsx (TẦNG HIỂN THỊ TRỰC QUAN)           │  │
  │  │   - Vẽ bảng đen, bàn ghế, cô giáo, học sinh       │  │
  │  │   - Render toạ độ 1080x1920 (chuẩn TikTok Studio) │  │
  │  └───────────────────────────────────────────────────┘  │
  └──────────────────────────────┬──────────────────────────┘
                                 │
                                 │ HTTP POST /api/game/state
                                 ▼
  ┌─────────────────────────────────────────────────────────┐
  │                 server.ts (Broadcaster)                 │
  │       broadcast('gamestate', StageViewSnapshot)         │
  └──────────────────────────────┬──────────────────────────┘
                                 │ SSE event: 'gamestate'
                                 ▼
  ┌─────────────────────────────────────────────────────────┐
  │     Trang Điều Khiển Dashboard: http://localhost:3006   │
  │  ┌───────────────────────────────────────────────────┐  │
  │  │ GameControls.tsx                                  │  │
  │  │   - Hiển thị thông số ván, đáp án cho Host       │  │
  │  │   - Nút can thiệp: Bỏ câu, Ván mới, Sinh nhật... │  │
  │  │   - Cài đặt lớp (RoomSettings) ➔ /api/room-settings│  │
  │  └───────────────────────────────────────────────────┘  │
  │  ┌───────────────────────────────────────────────────┐  │
  │  │ GameStage Preview (Thu nhỏ, câm tiếng)            │  │
  │  │   - Render lại GameStage từ StageView nhận được   │  │
  │  │   - Khớp 100% hình ảnh thực tế trên Live Studio   │  │
  │  └───────────────────────────────────────────────────┘  │
  └─────────────────────────────────────────────────────────┘
```

### 1.2. Chi tiết từng chặng truyền dữ liệu

1. **Từ Server đến Stage (`server.ts` ➔ `useGame.ts`):**
   * Server đẩy sự kiện realtime từ TikTok hoặc các công cụ giả lập qua Server-Sent Events (`/api/tiktok/events`).
   * Hook `useLiveEvents` trong `useGame.ts` nhận event (`onChat`, `onGift`, `onLike`, `onControl`).
   * `useGame.ts` chuẩn hóa tên (loại bỏ từ cấm qua `bannedWords.ts`) rồi chuyển dữ liệu vào thể hiện `Classroom` trong `quiz.ts`.

2. **Xử lý bên trong Stage (`useGame.ts` ⇄ `quiz.ts`):**
   * `Classroom` chạy độc lập với React, chỉ nhận timestamp `now` để chuyển đổi các pha (`intro` ➔ `team` ➔ `question` ➔ `bonus` ➔ `reveal` ➔ `praise` ➔ `results` ➔ `recess` / `show` ➔ `vote`).
   * Khi cô giáo đọc câu hỏi chính, `useGame.ts` gọi `room.hold()` để **dừng đồng hồ**; khi đọc xong mới kích hoạt đếm ngược 20 giây và mở bảng nhận câu trả lời.
   * Cứ 200ms, `useGame.ts` gọi `room.tick(now)` và lấy ảnh chụp trạng thái đầy đủ thông qua `room.view(now)`.

3. **Từ Stage đến Màn hình (`useGame.ts` ➔ `GameStage.tsx`):**
   * `GameStage` nhận prop `game.view` (kiểu `StageView`).
   * Đây là dữ liệu thuần túy (Plain Old Data Object), chứa: câu hỏi, các ô chữ xáo, ô đáp án, trạng thái 30 ghế học sinh, vị trí đứng phạt, danh sách quà, bảng vàng, v.v.
   * `GameStage` biến đổi dữ liệu này thành các phần tử DOM, SVG, và hiệu ứng hoạt họa của Framer Motion.

4. **Đồng bộ sang Trang điều khiển (`GameStage` ➔ `/api/game/state` ➔ `GameControls`):**
   * Mỗi khi có thay đổi trạng thái hoặc tối thiểu sau 400ms – 1000ms, `useGame.ts` gửi snapshot `StageView` lên Server bằng lệnh HTTP POST `/api/game/state`.
   * Server nhận dữ liệu và phát lại qua SSE (`gamestate`) cho toàn bộ các tab trình duyệt khác đang mở.
   * Trang điều khiển nhận được snapshot này, lưu vào state `view` và chuyển xuống cho `GameControls` và component preview `GameStage` (được thu nhỏ và tắt tiếng).

---

## 2. DANH SÁCH CÁC ĐIỂM PHỤ THUỘC TỌA ĐỘ CỨNG & TÀI NGUYÊN ĐỒ HỌA

Toàn bộ giao diện hiện tại được định vị tuyệt đối (`absolute positioning`) dựa trên canvas chuẩn **1080 × 1920** (khổ dọc 9:16) và ảnh nền gốc `public/assets/bg/lop.webp` (kích thước gốc **941 × 1672**).

Hệ số phóng tỷ lệ:
$$\text{K} = \frac{1080}{941} \approx 1.147715$$

### 2.1. Tọa độ cứng phụ thuộc ảnh nền (`ROWS` và các vị trí lớp học)

Tất cả các mảng tọa độ dưới đây được đo chính xác theo phối cảnh 2D của ảnh nền gốc:

| Thành phần | Vị trí / Tọa độ cứng trong code | Giải thích & Ràng buộc phối cảnh |
| :--- | :--- | :--- |
| **Mảng 4 dãy bàn (`ROWS`)** | `Row 0: { y: 812, b: 922, x1: 100, x2: 838, n: 7, s: 0.92 }`<br>`Row 1: { y: 942, b: 1069, x1: 72, x2: 870, n: 7, s: 0.98 }`<br>`Row 2: { y: 1093, b: 1232, x1: 45, x2: 902, n: 8, s: 1.04 }`<br>`Row 3: { y: 1253, b: 1414, x1: 28, x2: 922, n: 8, s: 1.10 }`<br>`Row 4: { y: 1458, b: 1646, x1: 5, x2: 938, n: 0, s: 1.16 }` | Đo mép trên `y`, mép dưới `b`, mép trái `x1`, mép phải `x2` của từng dãy bàn trên ảnh 941x1672. Dãy 4 bỏ trống vì bị che bởi giao diện TikTok. |
| **Bàn dài đè nền (`LongDesk`)** | SVG `viewBox="0 0 941 1672"` đè lên từng dãy `ri` | Vẽ mặt bàn gỗ và chân bàn che hoàn toàn các bàn lẻ vẽ sẵn trong ảnh nền. |
| **Vị trí 30 ghế ngồi (`seatBox`)** | `cx = row.x1 + ((k + 0.5) * (row.x2 - row.x1)) / row.n`<br>`x = cx * K - w / 2`<br>`y = (row.y + 0.64 * (row.b - row.y)) * K - show` | Học sinh ngồi trên ghế băng, quay lưng lại màn hình (mặt hướng về phía cô giáo). |
| **Tấm bảng đen vẽ đè khi đổi nền** | `left-[332px] top-[244px] h-[384px] w-[592px]` | Khi người dùng tải ảnh nền riêng lên (`v.cfg.bg`), khung này tự động vẽ một tấm bảng đen giả lập đè đúng vào vị trí bảng đen của phòng học. |
| **Bảng đen chính (`Board`)** | `left-[350px] top-[262px] h-[348px] w-[555px]` | Khung chữ phấn: hiện câu hỏi, ô gạch chân đáp án, miếng gỗ xáo ký tự, đồng hồ đếm ngược. |
| **Người đứng lớp (`Teacher`)** | `left-[86px] top-[410px] h-[490px] w-[320px]` | Đứng bục giảng bên trái bảng đen. Bảng tên cài ngực áo tại `top-[128px]`. |
| **Tay cô khi thưởng quà (`TEACHER_HAND`)** | `[300, 640]` | Tọa độ xuất phát để hiệu ứng quà bay từ tay cô rơi xuống mặt bàn học sinh. |
| **Bục nhận hoa (`PODIUM`)** | `[372, 690]` | Tọa độ đích khi học sinh bước lên bục giảng tặng hoa cho cô giáo. Học sinh không có ghế xuất phát từ `[990, 760]`. |
| **Cửa lớp bên phải (`DOOR`)** | `[1000, 690]` | Tọa độ cửa lớp, nơi thầy giám thị xuất hiện và dắt học sinh ra ngoài. |
| **Học sinh đứng phạt (`Punished`)** | `STAND_SPOTS = [420, 492, 564, 636, 708, 780]`, `STAND_FEET = 880`, `H = 120` | Khoảng sàn trống giữa bục giảng của cô và hàng bàn đầu tiên. |
| **Học sinh nhảy múa (`DANCE_SPOTS`)** | 10 cặp tọa độ: `[445, 915]`, `[550, 915]`, `[655, 915]`, `[760, 915]`, `[865, 915]`, `[497, 845]`, `[602, 845]`, `[707, 845]`, `[812, 845]`, `[917, 845]` | 2 hàng so le trên sàn lớp trước bảng đen trong giờ ra chơi nhảy múa. |
| **Bình hoa giáo viên (`Vase`)** | `left-[150px] top-[585px]` | 12 vị trí cắm hoa cố định trên bàn cô (`VASE_SPOTS`). |
| **Bàn quà sau lưng cô (`GiftPile`)** | `left-[2px] top-[640px] w-[150px] h-[230px]` | Xếp các món quà đã nhận ở cửa lớp bên trái. |
| **Lớp phủ bóng tối sàn lớp** | `bottom-0 top-[600px]` | Lớp phủ gradient giảm độ chói của sàn nhà trong ảnh nền gốc. |

### 2.2. Tọa độ các bảng thông tin nổi (HUD / Overlay)

Các bảng được ghim xung quanh khu vực bảng đen và mép màn hình:

* **Bảng hiệu tên lớp (`Header`)**: `left-1/2 top-[14px] w-[470px]`
* **Bảng khẩu hiệu đỏ chữ vàng (`Motto`)**: `left-1/2 top-[168px]`
* **Bảng sự kiện game lớn (`EventBadge`)**: `left-[784px] top-[12px] w-[288px]`
* **Học sinh xuất sắc trong tiết (`DayTop`)**: `left-[10px] top-[230px] w-[326px]`
* **Thi đua tổ (`TeamBoard`)**: `right-[8px] top-[150px] w-[168px]`
* **Quỹ lớp (`ClassFund`)**: `right-[8px] top-[428px] w-[168px]`
* **Bảng gợi ý tặng quà (`GiftMenu`)**: `right-[8px] top-[484px] w-[168px]`
* **Bảng Top tương tác (`TalkTop`)**: `left-[842px] top-[616px] w-[232px]`
* **Bục vinh danh / Top nhanh nhất (`Podium`, `FastestBoard`, `Mountain`, `BellBoard`)**: `left-[378px..417px] top-[618px..634px] w-[400px..460px]`
* **Gợi ý cách chơi (`SeatHint`)**: `left-[397px] top-[718px] w-[460px]`
* **Khung bình chọn vui (`PollCard`)**: `left-[16px] top-[640px] w-[330px]`
* **Tim bay khi gõ "yêu cô" (`LoveHearts`)**: `left-[60px] top-[330px] w-[340px] h-[520px]`

---

### 2.3. Danh sách tài nguyên ảnh nhân vật & Tỷ lệ ghép nối

Các ảnh nằm trong `nhan-vat/` được công cụ `tools/tach-nen.py` hoặc `tools/tach-nen.mjs` xử lý và xuất ra thư mục web `public/assets/nv/`:

#### A. Cô giáo Ngân (`public/assets/nv/co-ngan/`)
* **Bộ áo dài trắng (gốc)**: 16 tư thế `.webp`:
  `01-dung`, `02-gioi-thieu`, `03-chi-bang`, `04-vay-chao`, `05-dang-tay`, `06-cuoi`, `07-tay-nguc`, `08-ngon-cai`, `09-mung`, `10-vo-tay`, `11-nhun-vai`, `12-gai-dau`, `13-ngac-nhien`, `14-ngon-tro`, `15-chong-hong`, `16-chi-trai`.
* **Bộ sơ mi (`so-mi/`) & Áo dài xanh ngọc (`ao-dai-xanh-ngoc/`)**: 16 tư thế được ánh xạ qua bảng từ điển `OUTFIT_POSE` trong `GameStage.tsx`.
* **Trang phục Game lớn**:
  * `everest/`: 16 tư thế (`01-dung-san-sang` .. `16-tu-tin`).
  * `chuong/`: 16 tư thế (`01-cam-chuong-san-sang` .. `16-nghi-thang-tran`).

#### B. Thầy giáo đứng lớp (`public/assets/nv/thay/`)
* 8 tư thế: `01-dung`, `02-giang-bai`, `03-chi-trai`, `04-chi-phai`, `05-vui-mung`, `06-buon`, `07-suy-nghi`, `08-vay-chao`.
* Ánh xạ từ 16 tư thế của cô giáo sang thầy giáo qua `THAY_POSE`.

#### C. Thầy giám thị (`public/assets/nv/giam-thi/`)
* File `01-dung.webp`. Nếu chưa có ảnh riêng, code tự mượn `thay/01-dung.webp` và đổi màu áo qua CSS filter `hue-rotate(185deg)`.

#### D. Học sinh & Cơ chế ghép tóc SVG (`public/assets/nv/nam/`, `nu/`, `Hair.tsx`)
* **Thân trước (dùng khi lên bục/nhảy múa)**: `01-dung.webp` đến `08-vay-chao.webp`.
* **Thân sau lưng (ngồi trên ghế học)**: `sau-01-dung.webp` đến `sau-08-vay-chao.webp`.
* **Vùng đầu bị khoét bỏ (`head.json`)**:
  * Nam: `HEAD.nam = { x: 0.136, y: 0, w: 0.682, h: 0.284 }`
  * Nữ: `HEAD.nu = { x: 0.174, y: 0, w: 0.668, h: 0.248 }`
* **Vẽ tóc bằng SVG (`Hair.tsx`)**:
  * Tóc được vẽ trong khung chuẩn `100 × 100` đặt đè khít vào bounding box `HEAD` phía trên.
  * Kiểu tóc được hash cố định theo tên tài khoản TikTok (`hashName(username)`):
    * Nam có 5 kiểu: `ngan` (ngắn), `dinh` (đầu đinh), `xoan` (xoăn), `mu` (mũ lưỡi trai ngược).
    * Nữ có 6 kiểu: `duoi` (đuôi ngựa), `bui` (búi tó), `bim` (2 bím nơ), `xoa` (xõa dài), `bob` (tóc bob ngắn), `hai-chum` (cột 2 chùm).
    * 12 màu tóc khác nhau và 4 màu mũ.

---

## 3. RANH GIỚI: LOGIC GAME vs. PHẦN HIỂN THỊ

Để đảm bảo việc thay đổi giao diện không gây lỗi vận hành hoặc phá vỡ tính năng game, ranh giới giữa hai tầng được phân định nghiêm ngặt như sau:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   TẦNG LOGIC GAME (BẤT BIẾN - CẤM ĐỤNG)                 │
├────────────────────────────────────────────────────────────────────────┤
│ 1. src/game/quiz.ts                                                    │
│    - Class Classroom và toàn bộ State machine: tính điểm, xử lý comment │
│    - Thuật toán xác định Top nhanh nhất theo ms dựa vào createTime      │
│    - Quản lý ván đấu, câu hỏi, điểm tuần, chuyên cần, học bạ           │
│    - Cấu trúc trả về của hàm view(now): StageView                      │
│ 2. src/game/config.ts                                                  │
│    - Các hằng số vận hành (GAME.questionSec, GAME.roundPlan,           │
│      GAME.rankPoints, GAME.streakMilestones, v.v.)                     │
│ 3. src/game/bank.ts, math.ts, questions.ts, cau-hoi/*.txt             │
│    - Ngân hàng dữ liệu câu hỏi và thuật toán sinh câu hỏi tự động      │
│ 4. src/live/bannedWords.ts, voice.ts, chatter.ts, scoreboard.ts        │
│    - Xử lý ngôn ngữ, lọc nội dung xấu, đồng bộ giọng đọc TTS với game  │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                         Ranh giới Snapshot (StageView)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     TẦNG HIỂN THỊ (ĐƯỢC PHÉP THAY ĐỔI)                  │
├────────────────────────────────────────────────────────────────────────┤
│ 1. src/game/GameStage.tsx                                              │
│    - Cách tạo hình DOM, màu sắc, bố cục, kích thước các thẻ hiển thị  │
│    - Chuyển động và hiệu ứng của Framer Motion                         │
│    - Tọa độ hiển thị các nhân vật và bàn ghế (khi thay nền tương ứng) │
│ 2. src/game/Hair.tsx                                                   │
│    - Thiết kế lại các path SVG vẽ tóc, thêm phụ kiện, mũ, nơ           │
│ 3. src/game/stage.css                                                  │
│    - Phông chữ, gradient, bóng đổ, hiệu ứng ánh sáng (glow, pulse)     │
│ 4. Thư mục tài nguyên (public/assets/bg/, public/assets/nv/)           │
│    - Thay ảnh nền lớp học mới                                          │
│    - Thay sprite nhân vật mới (cần tuân thủ quy ước tư thế và kích thước)│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. RỦI RO & BẪY KỸ THUẬT KHI THAY ĐỔI GIAO DIỆN

### 4.1. Lệch phối cảnh khi đổi ảnh nền lớp học
* **Hiện tượng**: Bàn ghế, học sinh, bình hoa, quà tặng hoặc cô giáo bị "lơ lửng giữa trời" hoặc chân chìm xuống sàn nhà.
* **Nguyên nhân**: Mảng tọa độ `ROWS`, `PODIUM`, `STAND_SPOTS`, `TEACHER_HAND` được hardcode theo ảnh gốc 941x1672. Nếu dùng ảnh nền mới có góc camera khác, tiêu cự khác hoặc vị trí bục giảng khác, tọa độ cũ sẽ hoàn toàn sai lệch.
* **Biện pháp**: Khi đổi ảnh nền, bắt buộc phải đo lại từng tọa độ theo ảnh mới và cập nhật đồng bộ các mảng tọa độ trong `GameStage.tsx`.

### 4.2. Lệch khớp đầu và tóc học sinh (`Hair.tsx` & `head.json`)
* **Hiện tượng**: Tóc bay lơ lửng phía trên đầu hoặc tụt xuống cổ, làm lộ da đầu bị cắt nham nhở.
* **Nguyên nhân**: Sprite thân sau lưng `sau-*.webp` đã bị cắt bỏ phần đầu theo tỷ lệ ghi trong `head.json`. Nếu vẽ lại nhân vật học sinh mới mà không chạy script tạo lại `head.json` hoặc kích thước đầu mới khác tỷ lệ cũ, component `Hair.tsx` sẽ gắn sai vị trí.
* **Biện pháp**: Sử dụng script `tools/tach-nen.mjs` để trích xuất chính xác bounding box của đầu khi import ảnh học sinh mới.

### 4.3. Bị giao diện TikTok LIVE Studio che khuất
* **Hiện tượng**: Khán giả xem live không nhìn thấy câu hỏi hoặc học sinh ngồi dãy cuối bị che mất tên.
* **Nguyên nhân**: TikTok LIVE Studio trên điện thoại dành phần lớn diện tích cho:
  * Góc dưới màn hình: Khung chat bình luận của người xem và thanh công cụ tặng quà.
  * Góc trên: Tên phòng live, nút follow, nhiệm vụ live.
  * Cạnh trái: Hàng icon tương tác.
* **Biện pháp**: Khu vực an toàn (Safe Zone) chỉ nằm từ `y = 200` đến `y = 1500`. Tuyệt đối không đưa các bảng quan trọng xuống dưới `y = 1550`.

### 4.4. Phá vỡ đồng bộ dữ liệu với Trang điều khiển (Dashboard Crash)
* **Hiện tượng**: Trang điều khiển `http://localhost:3006` bị màn hình trắng hoặc báo lỗi JavaScript không thể điều khiển.
* **Nguyên nhân**: `GameControls.tsx` và `server.ts` phụ thuộc vào các trường dữ liệu cố định trong `StageView` (như `view.answer`, `view.phase`, `view.qNo`, `view.stats`, `view.correctCount`, `view.players`, `view.seats`).
* **Biện pháp**: Không được xóa hoặc đổi tên bất kỳ thuộc tính nào trong interface `StageView` hoặc trong hàm `Classroom.view()`.

### 4.5. Lỗi nhấp nháy trắng khi đổi tư thế nhân vật (Asset Flickering)
* **Hiện tượng**: Mỗi khi cô giáo đổi động tác (chỉ bảng, cười, hoan hô) hoặc học sinh giơ tay, nhân vật bị biến mất thành khoảng trắng trong tích tắc rồi mới hiện lại.
* **Nguyên nhân**: Trình duyệt tải ảnh bất đồng bộ lần đầu tiên tư thế đó xuất hiện trên màn hình.
* **Biện pháp**: `GameStage.tsx` có mảng `ALL_IMGS` và `THAY_IMGS` để pre-load toàn bộ ảnh vào bộ nhớ đệm ngay khi vừa mở trang. Khi bổ sung hoặc đổi tên tư thế mới, **phải cập nhật danh sách đường dẫn vào mảng pre-load này**.

### 4.6. Tràn bộ nhớ & Giảm FPS do quá nhiều Animation
* **Hiện tượng**: Khi livestream chạy liên tục vài tiếng, màn hình bắt đầu giật lag, trễ hình so với âm thanh.
* **Nguyên nhân**: Stage có tới 30 học sinh đồng thời thực hiện nhiều animation (nhún nhảy, bóng chat, icon quà, gain bay lên, tim bay). Việc lạm dụng các thuộc tính CSS tốn kém (`filter: blur()`, `drop-shadow` lồng nhiều lớp) ở độ phân giải thực tế 1620x2880 sẽ vắt kiệt GPU của máy host.
* **Biện pháp**: Ưu tiên animate các thuộc tính GPU-accelerated (`transform`, `opacity`). Hạn chế render lại toàn bộ component tree bằng cách giữ `layout` key ổn định trong Framer Motion.

---

## 5. KẾT LUẬN & KHUYẾN NGHỊ CHO VIỆC PHÁT TRIỂN TIẾP THEO

1. **Tuân thủ kiến trúc phân tầng**: Khi thiết kế giao diện mới, chỉ thao tác trên `src/game/GameStage.tsx`, `src/game/Hair.tsx`, `src/game/stage.css` và thư mục ảnh `public/assets/`. Giữ nguyên vẹn toàn bộ các file trong lõi `quiz.ts`, `config.ts`, `server.ts`.
2. **Quy chuẩn kiểm thử giao diện**:
   * Kiểm tra giao diện Stage độc lập: Mở `http://localhost:3006/?view=stage&mute=1`.
   * Kiểm tra giao diện Dashboard: Mở `http://localhost:3006`.
   * Kiểm tra tính toàn vẹn của logic sau mỗi lần tinh chỉnh:
     ```powershell
     npx.cmd tsx src/game/quiz.check.ts
     npx.cmd tsx src/game/bank.check.ts
     npm.cmd run lint
     ```
3. Bản phân tích này đóng vai trò là "kim chỉ nam" kỹ thuật để bất kỳ lập trình viên hay công cụ tự động nào có thể làm mới bộ nhận diện của game mà không gây ra lỗi logic trong suốt quá trình phát sóng TikTok LIVE.

