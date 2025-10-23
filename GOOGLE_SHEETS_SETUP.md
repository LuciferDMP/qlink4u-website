# QLink4u - Google Sheets Setup Guide

## Hướng dẫn cấu hình Google Sheets làm Database

### Bước 1: Tạo Google Sheets

1. **Tạo Google Sheets mới**: https://sheets.google.com
2. **Đặt tên**: "QLink4u Database"
3. **Tạo 2 sheets**:
   - Sheet 1: Đổi tên thành "Users"
   - Sheet 2: Đổi tên thành "Links"

### Bước 2: Cấu hình Sheet "Users"

**Header row (dòng 1):**
- A1: `ID`
- B1: `Email`
- C1: `Full Name`
- D1: `Created At`

### Bước 3: Cấu hình Sheet "Links"

**Header row (dòng 1):**
- A1: `ID`
- B1: `Alias`
- C1: `URL`
- D1: `Title`
- E1: `Description`
- F1: `Type`
- G1: `Password`
- H1: `Expires`
- I1: `Max Clicks`
- J1: `Click Count`
- K1: `Created At`
- L1: `User Email`

### Bước 4: Tạo Google Cloud Project

1. **Vào Google Cloud Console**: https://console.cloud.google.com
2. **Tạo project mới** hoặc chọn project có sẵn
3. **Enable Google Sheets API**:
   - Vào "APIs & Services" → "Library"
   - Tìm "Google Sheets API"
   - Click "Enable"

### Bước 5: Tạo API Key

1. **Vào "APIs & Services" → "Credentials"**
2. **Click "Create Credentials" → "API Key"**
3. **Copy API Key** (dạng: `AIzaSyC4sjQn...`)
4. **Restrict API Key** (khuyến nghị):
   - Click vào API Key vừa tạo
   - "Application restrictions" → "HTTP referrers"
   - Thêm domain website của bạn
   - "API restrictions" → "Restrict key" → Chọn "Google Sheets API"

### Bước 6: Chia sẻ Google Sheets

1. **Mở Google Sheets**
2. **Click "Share"**
3. **Change to "Anyone with the link"** → "Viewer"
4. **Copy Spreadsheet ID** từ URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```

### Bước 7: Cấu hình trong QLink4u

1. **Vào website QLink4u**
2. **Click "Cấu hình Google Sheets"**
3. **Nhập**:
   - **Spreadsheet ID**: ID từ bước 6
   - **API Key**: Key từ bước 5
4. **Click "Lưu cấu hình"**

## Ví dụ cấu hình

```
Spreadsheet ID: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
API Key: AIzaSyC4sjQnXXXXXXXXXXXXXXXXXXXXXXXX
```

## Lưu ý bảo mật

- **API Key**: Không chia sẻ API Key với người khác
- **Restrict API Key**: Luôn restrict API Key theo domain
- **Sheets Permission**: Chỉ chia sẻ "Viewer" permission
- **Backup**: Thường xuyên backup Google Sheets

## Troubleshooting

### Lỗi "API Key invalid"
- Kiểm tra API Key đã enable Google Sheets API chưa
- Kiểm tra API restrictions

### Lỗi "Permission denied"
- Kiểm tra Google Sheets đã chia sẻ "Anyone with the link" chưa
- Kiểm tra Spreadsheet ID đúng chưa

### Lỗi "Sheet not found"
- Kiểm tra tên sheets: "Users" và "Links" (đúng chính tả)
- Kiểm tra header rows đã tạo chưa

## Tính năng

✅ **Lưu trữ**: Tất cả data lưu trong Google Sheets của bạn
✅ **Real-time**: Xem data real-time trong Google Sheets
✅ **Backup**: Google tự động backup
✅ **Sharing**: Chia sẻ sheets với team
✅ **Analytics**: Sử dụng Google Sheets để phân tích data
✅ **Export**: Export sang Excel, CSV, PDF
✅ **Free**: Hoàn toàn miễn phí với Google Sheets API

## Support

Nếu gặp vấn đề, vui lòng:
1. Kiểm tra lại các bước setup
2. Xem console logs trong browser (F12)
3. Liên hệ support team