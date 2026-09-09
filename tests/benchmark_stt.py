#!/usr/bin/env python3
# SPDX-FileCopyrightText: 2026 Open-mind Contributors
# SPDX-License-Identifier: MIT
#
# Purpose: Open-mind - Offline AI-Powered Academic Lecture Copilot.
# Distributed under the terms of the OSI-approved MIT License.

"""
Open-mind Pro — STT Benchmark Suite
────────────────────────────────────────────────────────────────────────
Công cụ đo lường và đánh giá hiệu năng các mô hình Speech-to-Text (faster-whisper)
trên các bài giảng học thuật tiếng Việt.

Chỉ số đo lường:
  1. Thời gian xử lý (Execution Time - giây)
  2. Real-Time Factor (RTF = Thời gian xử lý / Thời lượng audio, RTF < 1.0 là nhanh hơn thời gian thực)
  3. Bộ nhớ RAM đỉnh (Peak RAM - MB)
  4. Word Error Rate (WER % - Tỉ lệ lỗi từ so với Ground Truth)

Cách sử dụng:
  python tools/benchmark_stt.py --audio samples/lecture_sample.mp3 --reference samples/lecture_sample_truth.txt
  python tools/benchmark_stt.py --audio samples/audio.wav --models tiny,small
"""

import sys
import os
import time
import argparse
import csv
import re
import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

try:
    import jiwer
    HAS_JIWER = True
except ImportError:
    HAS_JIWER = False


def normalize_text_for_wer(text: str) -> str:
    """Chuẩn hóa văn bản tiếng Việt: viết thường, loại bỏ dấu câu thừa, chuẩn hóa khoảng trắng."""
    if not text:
        return ""
    # Chuyển về chữ thường
    text = text.lower()
    # Loại bỏ dấu câu đặc biệt nhưng giữ nguyên ký tự chữ và số tiếng Việt
    text = re.sub(r"[^\w\s\dàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]", " ", text)
    # Gom khoảng trắng
    text = re.sub(r"\s+", " ", text).strip()
    return text


def calculate_wer_levenshtein(reference: str, hypothesis: str) -> float:
    """
    Tính Word Error Rate (WER) bằng thuật toán Dynamic Programming Levenshtein
    (không bắt buộc cài thư viện ngoài).
    """
    ref_words = normalize_text_for_wer(reference).split()
    hyp_words = normalize_text_for_wer(hypothesis).split()

    if not ref_words:
        return 0.0 if not hyp_words else 1.0

    r_len = len(ref_words)
    h_len = len(hyp_words)

    # Khởi tạo ma trận khoảng cách DP
    d = [[0] * (h_len + 1) for _ in range(r_len + 1)]

    for i in range(r_len + 1):
        d[i][0] = i
    for j in range(h_len + 1):
        d[0][j] = j

    for i in range(1, r_len + 1):
        for j in range(1, h_len + 1):
            if ref_words[i - 1] == hyp_words[j - 1]:
                d[i][j] = d[i - 1][j - 1]
            else:
                substitution = d[i - 1][j - 1] + 1
                insertion = d[i][j - 1] + 1
                deletion = d[i - 1][j] + 1
                d[i][j] = min(substitution, insertion, deletion)

    wer = d[r_len][h_len] / float(r_len)
    return round(wer * 100, 2)


def compute_wer(reference: str, hypothesis: str) -> float:
    """Tính WER ưu tiên jiwer nếu có, fallback sang Levenshtein tự cài đặt."""
    if HAS_JIWER:
        norm_ref = normalize_text_for_wer(reference)
        norm_hyp = normalize_text_for_wer(hypothesis)
        if not norm_ref:
            return 0.0 if not norm_hyp else 100.0
        return round(jiwer.wer(norm_ref, norm_hyp) * 100, 2)
    return calculate_wer_levenshtein(reference, hypothesis)


def get_current_ram_mb() -> float:
    if HAS_PSUTIL:
        process = psutil.Process(os.getpid())
        return process.memory_info().rss / (1024 * 1024)
    return 0.0


def benchmark_single_model(
    model_size: str,
    audio_path: Path,
    device: str = "cpu",
    compute_type: str = "int8",
    reference_text: Optional[str] = None,
    beam_size: int = 2
) -> Dict[str, Any]:
    """Chạy benchmark trên 1 cỡ model và thu thập thông số chi tiết."""
    from faster_whisper import WhisperModel
    from core.config import get_whisper_model_path, DEFAULT_TECH_INITIAL_PROMPT
    from core.stt_engine import normalize_technical_terms

    model_path = get_whisper_model_path(model_size)
    print(f"\n[INFO] Đang nạp model '{model_size}' từ: {model_path}")
    
    ram_before_load = get_current_ram_mb()
    t_load_start = time.perf_counter()
    
    model = WhisperModel(
        model_path,
        device=device,
        compute_type=compute_type,
    )
    
    t_load_end = time.perf_counter()
    load_time = round(t_load_end - t_load_start, 2)
    ram_after_load = get_current_ram_mb()
    model_ram_mb = round(max(0.0, ram_after_load - ram_before_load), 1)

    print(f"[INFO] Nạp xong ({load_time}s, ~{model_ram_mb} MB RAM). Bắt đầu nhận dạng...")

    t_infer_start = time.perf_counter()
    peak_ram = ram_after_load

    segments_gen, info = model.transcribe(
        str(audio_path),
        language="vi",
        beam_size=beam_size,
        vad_filter=True,
        initial_prompt=DEFAULT_TECH_INITIAL_PROMPT,
        condition_on_previous_text=True
    )

    full_text_list = []
    for seg in segments_gen:
        cleaned = normalize_technical_terms(seg.text.strip())
        if cleaned:
            full_text_list.append(cleaned)
        current_ram = get_current_ram_mb()
        if current_ram > peak_ram:
            peak_ram = current_ram

    t_infer_end = time.perf_counter()
    duration_sec = info.duration or 1.0
    inference_time = round(t_infer_end - t_infer_start, 2)
    rtf = round(inference_time / duration_sec, 3)
    generated_text = " ".join(full_text_list)

    wer_val = None
    if reference_text:
        wer_val = compute_wer(reference_text, generated_text)

    # Dọn dẹp bộ nhớ sau khi chạy xong
    del model
    import gc
    gc.collect()

    return {
        "model_size": model_size,
        "audio_duration_s": round(duration_sec, 2),
        "load_time_s": load_time,
        "inference_time_s": inference_time,
        "rtf": rtf,
        "peak_ram_mb": round(peak_ram, 1),
        "wer_percent": wer_val,
        "sample_output": generated_text[:120] + ("..." if len(generated_text) > 120 else ""),
        "full_output": generated_text
    }


def save_reports(results: List[Dict[str, Any]], audio_name: str, output_dir: Path):
    output_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    
    csv_file = output_dir / f"benchmark_{audio_name}_{timestamp}.csv"
    md_file = output_dir / f"benchmark_{audio_name}_{timestamp}.md"

    # 1. Xuất CSV
    fieldnames = [
        "model_size", "audio_duration_s", "load_time_s", 
        "inference_time_s", "rtf", "peak_ram_mb", "wer_percent"
    ]
    with open(csv_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        for r in results:
            writer.writerow(r)

    # 2. Xuất Markdown Table
    with open(md_file, "w", encoding="utf-8") as f:
        f.write(f"# Kết quả Benchmark STT — Open-mind Pro\n\n")
        f.write(f"- **File Audio:** `{audio_name}`\n")
        f.write(f"- **Thời gian chạy:** `{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}`\n")
        f.write(f"- **Thời lượng Audio:** `{results[0]['audio_duration_s']} giây`\n\n")
        
        has_wer = any(r.get("wer_percent") is not None for r in results)
        
        if has_wer:
            f.write("| Cỡ Model | Thời gian STT (s) | RTF (Real-time Factor) | RAM Đỉnh (MB) | WER (%) | Đánh giá |\n")
            f.write("|:---|:---:|:---:|:---:|:---:|:---|\n")
            for r in results:
                wer_str = f"{r['wer_percent']}%" if r['wer_percent'] is not None else "N/A"
                rtf_eval = "Siêu nhanh ⚡" if r['rtf'] < 0.2 else ("Nhanh 🚀" if r['rtf'] < 0.5 else "Cân bằng ⭐")
                f.write(f"| **{r['model_size'].upper()}** | {r['inference_time_s']}s | {r['rtf']}x | {r['peak_ram_mb']} MB | **{wer_str}** | {rtf_eval} |\n")
        else:
            f.write("| Cỡ Model | Thời gian STT (s) | RTF (Real-time Factor) | RAM Đỉnh (MB) | Đánh giá |\n")
            f.write("|:---|:---:|:---:|:---:|:---|\n")
            for r in results:
                rtf_eval = "Siêu nhanh ⚡" if r['rtf'] < 0.2 else ("Nhanh 🚀" if r['rtf'] < 0.5 else "Cân bằng ⭐")
                f.write(f"| **{r['model_size'].upper()}** | {r['inference_time_s']}s | {r['rtf']}x | {r['peak_ram_mb']} MB | {rtf_eval} |\n")

        f.write("\n\n### Trích đoạn kết quả nhận dạng đầu ra:\n")
        for r in results:
            f.write(f"- **{r['model_size'].upper()}:** *\"{r['sample_output']}\"*\n")

    print(f"\n[DONE] Đã lưu báo cáo benchmark:")
    print(f"  📂 Markdown : {md_file}")
    print(f"  📊 CSV      : {csv_file}")


def print_console_table(results: List[Dict[str, Any]]):
    print("\n" + "=" * 85)
    print(f"{'BẢNG TỔNG HỢP HIỆU NĂNG SPEECH-TO-TEXT (OPEN-MIND PRO)':^85}")
    print("=" * 85)
    
    has_wer = any(r.get("wer_percent") is not None for r in results)
    
    if has_wer:
        header = f"{'Model':<10} | {'Thời gian (s)':<15} | {'RTF':<10} | {'RAM (MB)':<12} | {'WER (%)':<10} | {'Tốc độ':<12}"
        print(header)
        print("-" * 85)
        for r in results:
            wer_str = f"{r['wer_percent']}%" if r['wer_percent'] is not None else "N/A"
            speed_str = "Rất nhanh" if r['rtf'] < 0.2 else ("Nhanh" if r['rtf'] < 0.5 else "Bình thường")
            print(f"{r['model_size'].upper():<10} | {r['inference_time_s']:<15} | {r['rtf']:<10} | {r['peak_ram_mb']:<12} | {wer_str:<10} | {speed_str:<12}")
    else:
        header = f"{'Model':<10} | {'Thời gian (s)':<15} | {'RTF':<10} | {'RAM (MB)':<12} | {'Tốc độ':<15}"
        print(header)
        print("-" * 75)
        for r in results:
            speed_str = "Rất nhanh" if r['rtf'] < 0.2 else ("Nhanh" if r['rtf'] < 0.5 else "Bình thường")
            print(f"{r['model_size'].upper():<10} | {r['inference_time_s']:<15} | {r['rtf']:<10} | {r['peak_ram_mb']:<12} | {speed_str:<15}")
    print("=" * 85 + "\n")


def main():
    parser = argparse.ArgumentParser(description="STT Benchmark Tool for Open-mind Pro")
    parser.add_argument("--audio", "-a", type=str, required=True, help="Đường dẫn tới file âm thanh mẫu (.wav, .mp3, .m4a)")
    parser.add_argument("--reference", "-r", type=str, default=None, help="Đường dẫn file transcript chuẩn (.txt) để tính WER")
    parser.add_argument("--models", "-m", type=str, default="tiny,base,small", help="Danh sách các model cần đo, cách nhau bằng dấu phẩy (mặc định: tiny,base,small)")
    parser.add_argument("--device", "-d", type=str, default="cpu", choices=["cpu", "cuda"], help="Thiết bị chạy (cpu / cuda)")
    parser.add_argument("--output-dir", "-o", type=str, default="benchmark_results", help="Thư mục xuất báo cáo (mặc định: benchmark_results)")
    parser.add_argument("--beam-size", "-b", type=int, default=2, help="Beam size cho STT (mặc định: 2)")

    args = parser.parse_args()

    audio_path = Path(args.audio)
    if not audio_path.exists():
        print(f"[ERROR] Không tìm thấy file audio: {audio_path}")
        sys.exit(1)

    reference_text = None
    if args.reference:
        ref_path = Path(args.reference)
        if ref_path.exists():
            with open(ref_path, "r", encoding="utf-8") as f:
                reference_text = f.read().strip()
            print(f"[INFO] Đã nạp Ground Truth ({len(reference_text.split())} từ).")
        else:
            print(f"[WARN] Không tìm thấy file Ground Truth: {ref_path}. Bỏ qua tính WER.")

    models = [m.strip().lower() for m in args.models.split(",") if m.strip()]
    output_dir = Path(args.output_dir)

    print(f"🚀 Bắt đầu Benchmark STT trên file: {audio_path.name}")
    print(f"📌 Danh sách model: {', '.join(models)}")
    print(f"💻 Thiết bị: {args.device.upper()}")

    results = []
    for model_size in models:
        try:
            res = benchmark_single_model(
                model_size=model_size,
                audio_path=audio_path,
                device=args.device,
                reference_text=reference_text,
                beam_size=args.beam_size
            )
            results.append(res)
        except Exception as e:
            print(f"[ERROR] Lỗi khi chạy model {model_size}: {e}")

    if results:
        print_console_table(results)
        save_reports(results, audio_path.stem, output_dir)
    else:
        print("[ERROR] Không có kết quả benchmark nào được hoàn thành.")


if __name__ == "__main__":
    main()
