# SPDX-FileCopyrightText: 2026 Open-mind Contributors
# SPDX-License-Identifier: MIT
#
# Purpose: Open-mind - Offline AI-Powered Academic Lecture Copilot.
# Distributed under the terms of the OSI-approved MIT License.

import math
import re
from typing import List, Dict, Any, Tuple
from core.llm_engine import llm_engine

class RAGEngine:
    def __init__(self):
        pass

    def chunk_transcript(self, segments: List[Dict[str, Any]], chunk_duration_sec: float = 60.0) -> List[Dict[str, Any]]:
        """
        Groups transcript segments into coherent chunks of ~60 seconds with timestamps.
        """
        if not segments:
            return []

        chunks = []
        current_chunk_text = []
        chunk_start = segments[0]["start"]
        chunk_end = segments[0]["end"]

        for seg in segments:
            current_chunk_text.append(seg["text"])
            chunk_end = seg["end"]

            if (chunk_end - chunk_start) >= chunk_duration_sec:
                chunks.append({
                    "start": chunk_start,
                    "end": chunk_end,
                    "text": " ".join(current_chunk_text).strip(),
                    "timestamp_label": f"[{self._fmt_time(chunk_start)} - {self._fmt_time(chunk_end)}]"
                })
                current_chunk_text = []
                chunk_start = chunk_end

        if current_chunk_text:
            chunks.append({
                "start": chunk_start,
                "end": chunk_end,
                "text": " ".join(current_chunk_text).strip(),
                "timestamp_label": f"[{self._fmt_time(chunk_start)} - {self._fmt_time(chunk_end)}]"
            })

        return chunks

    def _fmt_time(self, seconds: float) -> str:
        mins = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{mins:02d}:{secs:02d}"

    def _tokenize(self, text: str) -> List[str]:
        words = re.findall(r"\w+", text.lower())
        return [w for w in words if len(w) > 1]

    def retrieve_relevant_chunks(self, query: str, chunks: List[Dict[str, Any]], top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Scores chunks using lightweight BM25-like term frequency & keyword matching.
        """
        if not chunks:
            return []

        q_tokens = self._tokenize(query)
        if not q_tokens:
            return chunks[:top_k]

        doc_frequencies = {}
        for chunk in chunks:
            chunk_tokens = set(self._tokenize(chunk["text"]))
            for t in chunk_tokens:
                doc_frequencies[t] = doc_frequencies.get(t, 0) + 1

        num_docs = len(chunks)
        scored_chunks: List[Tuple[float, Dict[str, Any]]] = []

        for chunk in chunks:
            chunk_tokens = self._tokenize(chunk["text"])
            score = 0.0
            for t in q_tokens:
                tf = chunk_tokens.count(t)
                df = doc_frequencies.get(t, 0)
                idf = math.log((num_docs - df + 0.5) / (df + 0.5) + 1.0)
                score += (tf * (2.2 / (tf + 1.2))) * idf

            scored_chunks.append((score, chunk))

        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        return [c for score, c in scored_chunks[:top_k] if score > 0] or chunks[:1]

    def ask_question(self, query: str, segments: List[Dict[str, Any]], full_text: str = "") -> Dict[str, Any]:
        """
        Performs Local RAG Q&A:
        1. Chunks the transcript.
        2. Retrieves top relevant context chunks.
        3. Formulates grounded prompt and queries LLM.
        """
        chunks = self.chunk_transcript(segments)
        if not chunks and full_text:
            chunks = [{
                "start": 0.0,
                "end": 0.0,
                "text": full_text[:4000],
                "timestamp_label": "[Toàn bộ bài giảng]"
            }]

        relevant_chunks = self.retrieve_relevant_chunks(query, chunks, top_k=3)
        context_parts = []
        citations = []

        for c in relevant_chunks:
            context_parts.append(f"{c['timestamp_label']}: {c['text']}")
            citations.append({
                "timestamp": c["timestamp_label"],
                "start": c["start"],
                "snippet": c["text"][:120] + "..."
            })

        context_str = "\n\n".join(context_parts)

        prompt = (
            "Bạn là trợ lý giải đáp thắc mắc về bài giảng. "
            "Hãy trả lời câu hỏi của người học DỰA TRÊN các đoạn trích từ bài giảng dưới đây. "
            "Nếu thông tin không có trong bài giảng, hãy nói rõ là bài giảng không đề cập đến. "
            "Hãy trích dẫn mốc thời gian [MM:SS] nếu có thể.\n\n"
            f"--- BÀI GIẢNG TRÍCH ĐOẠN ---\n{context_str}\n\n"
            f"--- CÂU HỎI CỦA NGƯỜI HỌC ---\n{query}\n\n"
            "--- TRẢ LỜI CỦA BẠN (ngắn gọn, chính xác bằng tiếng Việt) ---"
        )

        answer = llm_engine.call_chat(prompt, max_tokens=600)
        return {
            "answer": answer,
            "citations": citations
        }

rag_engine = RAGEngine()
