# Đặc Tả RESTful API OpenMind (API Specification)

OpenMind cung cấp hệ thống giao diện lập trình ứng dụng RESTful API hiệu năng cao xây dựng trên nền tảng **FastAPI**. Toàn bộ các API đều chạy cục bộ tại địa chỉ mặc định `http://127.0.0.1:8000`.

Tài liệu Swagger UI tương tác trực tiếp có sẵn tại: `http://127.0.0.1:8000/docs`

---

## 1. Quản Lý Bài Giảng (Lectures)

### `GET /api/lectures`
Lấy danh sách tất cả các bài giảng đã lưu trong cơ sở dữ liệu.
- **Response**: `200 OK`
```json
[
  {
    "id": 1,
    "title": "Nhập môn Trí tuệ Nhân tạo và Machine Learning",
    "created_at": "2026-09-09T10:00:00",
    "duration": 345.2,
    "status": "ready",
    "summary": "Tổng quan về các khái niệm cơ bản trong AI..."
  }
]
```

### `GET /api/lectures/{id}`
Lấy thông tin chi tiết một bài giảng bao gồm toàn văn bản ghi chép (transcript) phân đoạn timestamp.

### `DELETE /api/lectures/{id}`
Xóa bài giảng cùng toàn bộ dữ liệu vector RAG và flashcards liên kết.

---

## 2. Nhận Dạng Giọng Nói (Speech-to-Text)

### `POST /api/stt/transcribe`
Tải lên tệp âm thanh hoặc video để chuyển đổi sang văn bản bằng `faster-whisper`.
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `file`: Tệp âm thanh (`.mp3`, `.wav`, `.m4a`, `.mp4`, v.v.)
  - `language`: Mã ngôn ngữ (mặc định: `vi`)
  - `model_size`: Kích thước mô hình (`tiny`, `base`, `small`, `medium`)
- **Response**: `200 OK`
```json
{
  "lecture_id": 2,
  "title": "bai_giang_triet_hoc.mp3",
  "duration": 1820.5,
  "segments": [
    {
      "start": 0.0,
      "end": 4.5,
      "text": "Chào mừng các em đến với buổi học hôm nay."
    }
  ]
}
```

---

## 3. Hỏi Đáp Tri Thức (RAG & Chat)

### `POST /api/chat`
Đặt câu hỏi đối thoại dựa trên nội dung bài giảng cụ thể hoặc toàn bộ thư viện học tập.
- **Request Body**:
```json
{
  "lecture_id": 1,
  "question": "Thuật toán học sâu khác gì với học máy truyền thống?",
  "stream": false
}
```
- **Response**: `200 OK`
```json
{
  "answer": "Theo bài giảng, học máy truyền thống cần trích xuất đặc trưng thủ công (feature engineering), trong khi học sâu (Deep Learning) sử dụng mạng nơ-ron nhiều tầng để tự động học các biểu diễn đặc trưng từ dữ liệu thô.",
  "sources": [
    {
      "segment_id": 12,
      "timestamp": "05:24",
      "snippet": "...điểm khác biệt then chốt giữa Deep Learning và Traditional ML..."
    }
  ]
}
```

---

## 4. Thẻ Ghi Nhớ & Lặp Lại Ngắt Quãng (Flashcards & SRS)

### `POST /api/flashcards/generate`
Tự động sinh bộ thẻ ghi nhớ chất lượng cao từ bài giảng bằng LLM.
- **Request Body**:
```json
{
  "lecture_id": 1,
  "count": 10,
  "deck_name": "Thuật ngữ AI Cơ bản"
}
```

### `GET /api/flashcards/deck/{deck_id}/review`
Lấy danh sách các thẻ đến hạn ôn tập trong ngày theo thuật toán SuperMemo SM-2.

### `POST /api/flashcards/{card_id}/review`
Gửi đánh giá kết quả ôn tập thẻ để cập nhật hệ số dễ và ngày ôn tập kế tiếp.
- **Request Body**:
```json
{
  "rating": 3
}
```
*(Quy ước: 1: Again - Quên hoàn toàn, 2: Hard - Khó nhớ, 3: Good - Nhớ tốt, 4: Easy - Rất dễ nhớ)*.

---

## 5. Trắc Nghiệm Thông Minh (Quiz Studio)

### `POST /api/quizzes/generate`
Tạo bài thi trắc nghiệm khách quan 4 lựa chọn từ bài giảng.
- **Request Body**:
```json
{
  "lecture_id": 1,
  "count": 10,
  "difficulty": "medium"
}
```

### `POST /api/quizzes/{quiz_id}/submit`
Nộp bài thi trắc nghiệm, chấm điểm tự động và nhận giải thích chi tiết cho từng câu sai.

---

## 6. Thống Kê & Tiến Trình Học Tập (Analytics & Stats)

### `GET /api/stats/dashboard`
Lấy số liệu tổng hợp về quá trình học:
- Chuỗi ngày học liên tục (current streak, longest streak).
- Tổng số thẻ đã học và tỷ lệ nhớ đúng.
- Tổng số giờ học và biểu đồ hoạt động trong 7 ngày gần nhất.

---

## 7. Cấu Hình & Quản Lý Mô Hình (System & Models)

### `GET /api/models/status`
Kiểm tra trạng thái các mô hình AI ngoại tuyến (Whisper & LLM GGUF) đã tải về máy hay chưa.

### `POST /api/models/download`
Tải mô hình trọng số bổ sung với thanh tiến trình thời gian thực.
