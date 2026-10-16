# Ứng Dụng Web Bấm Thời Gian Giải Chạy (Race Timer Mobile-First)

Ứng dụng web bấm giờ chuyên dụng cho giải chạy marathon / tiếp sức, tối ưu hoá cho điện thoại thông minh (Mobile-First), hỗ trợ 2 bảng thi đấu: **Cá Nhân** và **Đồng Đội (3 người/đội)**, chốt khoá thông tin chống bấm nhầm, xuất phát đồng loạt, về đích từng người, xuất CSV tiếng Việt chuẩn UTF-8 BOM và hỗ trợ nhiều người cùng truy cập xem trực tiếp thời gian thực khi deploy lên Vercel.

---

## 🏃 Các Tính Năng Nổi Bật

### 1. 2 Bảng Thi Đấu Chuyên Biệt
- **Bảng Cá Nhân:** Quản lý VĐV theo Họ tên, Số BIB, Giới tính, thời gian hoàn thành cá nhân và thứ hạng.
- **Bảng Đồng Đội (3 người/đội):** Mỗi đội gồm chính xác 3 VĐV với số BIB riêng biệt. Trọng tài bấm giờ về đích cho từng thành viên độc lập; hệ thống tự động tổng hợp **Tổng thời gian cả đội** và xếp hạng đội theo luật marathon tiếp sức.

### 2. Điền Thông Tin & Khoá An Toàn (Anti-Accidental Edit)
- Giao diện nhập thông tin nhanh cho cá nhân và đội.
- Nút **"Nạp Dữ Liệu Mẫu"** để ban tổ chức kiểm thử ngay lập tức.
- **Tính năng Khoá Thông Tin (Lock):** Trước khi xuất phát, trọng tài bấm *Khoá thông tin*. Toàn bộ form và nút xoá sẽ bị vô hiệu hoá, bảo vệ danh sách khỏi mọi thao tác chạm nhầm trong lúc bấm giờ căng thẳng.

### 3. Đồng Hồ Số Lớn & Bấm Giờ Trọng Tài
- **Xuất phát đồng loạt (Mass Start):** Bấm 1 nút duy nhất để ghi lại mốc `startTime` chung cho toàn bộ giải, đồng hồ số nhảy chính xác đến phần trăm giây (`00:14:23.58`).
- **Ghi nhận về đích từng người bằng 2 cách tiện lợi:**
  1. **Bàn phím số Numpad cảm ứng:** Gõ số BIB (VD: `105`) -> Xem trước tên VĐV -> Bấm *VỀ ĐÍCH*.
  2. **Thẻ VĐV 1-chạm:** Danh sách VĐV đang chạy có nút *VỀ ĐÍCH* to bản, tối ưu cho ngón tay cái khi đứng ở vạch đích.
- **Nút Hoàn Tác (Undo):** Nếu trọng tài bấm nhầm người, banner hoàn tác hiện trong 6 giây cho phép huỷ lệnh bấm vừa rồi ngay lập tức.
- **Âm thanh & Rung:** Phản hồi âm thanh còi/chuông qua Web Audio và rung xúc giác trên điện thoại di động.

### 4. Bảng Xếp Hạng Thời Gian Thực & Xuất CSV
- Huy chương vàng, bạc, đồng (🥇, 🥈, 🥉) cho top 3 cá nhân và top 3 đội.
- Chi tiết thời gian từng thành viên trong đội.
- **Xuất file CSV:** Mã hoá UTF-8 có BOM (`\uFEFF`), mở trực tiếp bằng Microsoft Excel trên Windows không bao giờ bị lỗi font tiếng Việt:
  - Xuất kết quả Cá nhân
  - Xuất kết quả Đồng đội
  - Xuất toàn bộ giải chạy

### 5. Xem Trực Tiếp Nhiều Người & Deploy Vercel
- Tích hợp sẵn **Mã QR** và **Link chia sẻ** cho khán giả / người nhà VĐV (`/?room=RUN2026&role=viewer`).
- Chế độ **Khán Giả (Viewer Mode)**: Tự động đồng bộ đồng hồ và bảng xếp hạng thời gian thực mà không sợ bị bấm nhầm vào nút trọng tài.
- Đồng bộ đa thiết bị qua API Route `/api/race/sync` và lưu offline `localStorage` trên máy trọng tài, không sợ mất dữ liệu khi mất kết nối mạng.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Thử (Localhost)

```bash
# 1. Di chuyển vào thư mục dự án
cd race-timer-app

# 2. Cài đặt thư viện (nếu chưa cài)
npm install

# 3. Khởi chạy máy chủ phát triển
npm run dev
```

Mở trình duyệt trên máy tính hoặc điện thoại theo địa chỉ:  
👉 **http://localhost:3000**

---

## 🌐 Hướng Dẫn Deploy Lên Vercel

Dự án được tối ưu 100% cho Vercel (Next.js App Router).

### Cách 1: Deploy qua Vercel CLI
```bash
npm install -g vercel
vercel
```

### Cách 2: Deploy qua GitHub
1. Tạo một repository mới trên GitHub (VD: `race-timer-app`).
2. Đẩy toàn bộ mã nguồn lên GitHub:
   ```bash
   git add .
   git commit -m "Initial commit for Race Timer App"
   git push origin main
   ```
3. Truy cập [vercel.com](https://vercel.com) -> Chọn **Add New Project** -> Chọn repository vừa tạo.
4. Bấm **Deploy**. Vercel sẽ tự động build và cung cấp cho bạn một domain HTTPS miễn phí (VD: `https://race-timer-xyz.vercel.app`).

### Cách sử dụng khi chạy giải:
- **Trọng tài chính tại vạch đích:** Mở link trên điện thoại, đăng nhập vai trò **Trọng Tài**.
- **Khán giả / VĐV:** Mở link hoặc quét mã QR từ nút **Chia sẻ xem trực tiếp** trên góc màn hình để theo dõi kết quả nhảy số theo thời gian thực!

---

## 📁 Cấu Trúc Dự Án

```
race-timer-app/
├── src/
│   ├── app/
│   │   ├── api/race/sync/route.ts  # API đồng bộ thời gian thực cho khán giả
│   │   ├── globals.css             # Tailwind CSS v4 styling
│   │   ├── layout.tsx              # Cấu hình mobile viewport, meta UTF-8
│   │   └── page.tsx                # Trang chính Mobile-First với bottom navigation
│   ├── components/
│   │   ├── Header.tsx              # Thanh tiêu đề, âm thanh, QR share, đổi vai trò
│   │   ├── LiveClock.tsx           # Đồng hồ số lớn & nút xuất phát Mass Start
│   │   ├── LockBanner.tsx          # Cảnh báo và nút Khoá thông tin chống bấm nhầm
│   │   ├── SetupTab.tsx            # Form nhập VĐV, Đội 3 người, dữ liệu mẫu
│   │   ├── TimerTab.tsx            # Bàn phím Numpad, nút Về đích 1-chạm, Hoàn tác
│   │   ├── LeaderboardTab.tsx      # Bảng xếp hạng huy chương & Xuất file CSV
│   │   └── ShareModal.tsx          # Hộp thoại QR Code & Link khán giả xem trực tiếp
│   ├── context/
│   │   └── RaceContext.tsx         # Quản lý trạng thái, lưu trữ offline & realtime sync
│   ├── types/
│   │   └── race.ts                 # Type definitions cho Runner, Team, RaceState
│   └── utils/
│       ├── audio.ts                # Bộ tạo âm thanh còi/chuông Web Audio & rung haptic
│       ├── csv.ts                  # Xuất CSV UTF-8 BOM chuẩn tiếng Việt
│       └── time.ts                 # Định dạng thời gian chính xác (ms, hh:mm:ss.SS)
└── package.json
```
