# SPDX-FileCopyrightText: 2026 Open-mind Contributors
# SPDX-License-Identifier: MIT
#
# Purpose: Open-mind - Offline AI-Powered Academic Lecture Copilot.
# Distributed under the terms of the OSI-approved MIT License.

"""
Cloud AI Client — Hybrid Engine Extension for Open-mind
────────────────────────────────────────────────────────
Provides lightweight REST integration for cloud LLM providers:
1. Google Gemini API (gemini-1.5-flash, gemini-2.0-flash, etc.)
2. OpenAI-Compatible API (OpenAI, Groq, DeepSeek, OpenRouter)

Uses standard `requests` library without heavyweight vendor SDKs.
"""

import os
import json
import requests
from typing import Dict, Any, Optional

DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite"
DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1"
DEFAULT_OPENAI_MODEL = "gpt-4o-mini"

GEMINI_CASCADE_MODELS = [
    "gemini-3.8-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
]



class CloudClient:
    """Manages cloud LLM requests with support for Gemini and OpenAI-compatible endpoints."""

    @staticmethod
    def _is_quota_error(status_code: int, error_text: str) -> bool:
        """Checks if the error is due to rate limits or exhausted quota."""
        if status_code == 429:
            return True
        low = error_text.lower()
        return any(k in low for k in ["quota", "resource_exhausted", "rate_limit", "rate limit", "too many requests", "exceeded"])

    @classmethod
    def call_gemini(
        cls,
        prompt: str,
        api_key: str,
        model: str = DEFAULT_GEMINI_MODEL,
        system_prompt: Optional[str] = None,
        history: Optional[list] = None,
        max_tokens: int = 1500,
        temperature: float = 0.2,
        timeout: int = 45,
    ) -> str:
        """
        Calls Google Gemini API with intelligent Auto-Quota Cascade:
        If the primary model exhausts quota/rate-limits (429), automatically
        fails over to subsequent models (e.g. 3.5 Flash Lite with 500 RPD).
        """
        if not api_key or not api_key.strip():
            raise ValueError("Chưa cấu hình Google Gemini API Key.")

        key = api_key.strip()
        requested_model = (model or DEFAULT_GEMINI_MODEL).strip().replace("models/", "")

        # Xây dựng danh sách ưu tiên: model yêu cầu trước, sau đó là các model dự phòng còn lại
        candidate_models = [requested_model]
        for m in GEMINI_CASCADE_MODELS:
            if m not in candidate_models:
                candidate_models.append(m)

        last_error = None

        for idx, current_model in enumerate(candidate_models):
            is_fallback = (idx > 0)

            # ─── Endpoint 1: Google OpenAI-Compatible Gateway ───
            try:
                openai_gemini_url = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {key}",
                }
                messages = []
                if system_prompt and system_prompt.strip():
                    messages.append({"role": "system", "content": system_prompt.strip()})
                if history:
                    for h in history:
                        r = h.get("role", "user")
                        c = h.get("content", "")
                        if c:
                            role_mapped = "assistant" if r in ["ai", "assistant", "model"] else "user"
                            messages.append({"role": role_mapped, "content": c})
                messages.append({"role": "user", "content": prompt})

                payload = {
                    "model": current_model,
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                }
                res = requests.post(openai_gemini_url, headers=headers, json=payload, timeout=timeout)
                if res.status_code == 200:
                    data = res.json()
                    choices = data.get("choices", [])
                    if choices and "message" in choices[0]:
                        return choices[0]["message"].get("content", "").strip()

                err_text = res.text
                if cls._is_quota_error(res.status_code, err_text):
                    if idx + 1 < len(candidate_models):
                        next_m = candidate_models[idx + 1]
                        print(f"[Gemini Quota Fallback] Mô hình '{current_model}' đạt giới hạn Quota/RPM ({res.status_code}). Tự động chuyển sang '{next_m}'...")
                        continue
                last_error = f"OpenAI-compat status {res.status_code}: {err_text}"
            except Exception as e:
                last_error = f"OpenAI-compat gateway: {e}"

            # ─── Endpoint 2 & 3: Native REST generateContent (v1beta & v1) ───
            for api_version in ["v1beta", "v1"]:
                try:
                    native_url = f"https://generativelanguage.googleapis.com/{api_version}/models/{current_model}:generateContent?key={key}"
                    headers = {"Content-Type": "application/json"}
                    contents = []
                    if history:
                        for h in history:
                            r = h.get("role", "user")
                            c = h.get("content", "")
                            if c:
                                role_mapped = "model" if r in ["ai", "assistant", "model"] else "user"
                                contents.append({"role": role_mapped, "parts": [{"text": c}]})
                    contents.append({"role": "user", "parts": [{"text": prompt}]})

                    native_payload: Dict[str, Any] = {
                        "contents": contents,
                        "generationConfig": {
                            "temperature": temperature,
                            "maxOutputTokens": max_tokens,
                        }
                    }
                    if system_prompt and system_prompt.strip():
                        native_payload["system_instruction"] = {
                            "parts": [{"text": system_prompt.strip()}]
                        }

                    res = requests.post(native_url, headers=headers, json=native_payload, timeout=timeout)
                    if res.status_code == 200:
                        data = res.json()
                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            if parts and "text" in parts[0]:
                                return parts[0]["text"].strip()

                    err_msg = res.text
                    try:
                        err_msg = res.json().get("error", {}).get("message", err_msg)
                    except Exception:
                        pass

                    if cls._is_quota_error(res.status_code, err_msg):
                        if idx + 1 < len(candidate_models):
                            next_m = candidate_models[idx + 1]
                            print(f"[Gemini Quota Fallback] Mô hình '{current_model}' đạt giới hạn Quota ({res.status_code}). Tự động chuyển sang '{next_m}'...")
                            break  # chuyển sang model tiếp theo trong candidate_models

                    last_error = f"Gemini {api_version} ({res.status_code}): {err_msg}"
                except Exception as e:
                    last_error = f"Gemini {api_version} error: {e}"

        raise RuntimeError(f"Tất cả các mô hình Gemini ({', '.join(candidate_models)}) đều đã đạt hạn ngạch hoặc lỗi. Chi tiết: {last_error}")

    @staticmethod
    def call_openai_compatible(
        prompt: str,
        api_key: str,
        base_url: str = DEFAULT_OPENAI_BASE_URL,
        model: str = DEFAULT_OPENAI_MODEL,
        system_prompt: Optional[str] = None,
        history: Optional[list] = None,
        max_tokens: int = 1500,
        temperature: float = 0.2,
        timeout: int = 45,
    ) -> str:
        """Calls OpenAI-compatible REST API (OpenAI, Groq, DeepSeek, OpenRouter)."""
        if not api_key or not api_key.strip():
            raise ValueError("Chưa cấu hình API Key bên thứ ba.")

        clean_base = (base_url or DEFAULT_OPENAI_BASE_URL).rstrip("/")
        if not clean_base.endswith("/v1") and not clean_base.endswith("/chat/completions"):
            endpoint = f"{clean_base}/v1/chat/completions"
        elif clean_base.endswith("/chat/completions"):
            endpoint = clean_base
        else:
            endpoint = f"{clean_base}/chat/completions"

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key.strip()}",
        }

        messages = []
        if system_prompt and system_prompt.strip():
            messages.append({"role": "system", "content": system_prompt.strip()})
        if history:
            for h in history:
                r = h.get("role", "user")
                c = h.get("content", "")
                if c:
                    role_mapped = "assistant" if r in ["ai", "assistant", "model"] else "user"
                    messages.append({"role": role_mapped, "content": c})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": (model or DEFAULT_OPENAI_MODEL).strip(),
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        response = requests.post(endpoint, headers=headers, json=payload, timeout=timeout)
        if response.status_code != 200:
            err_detail = response.text
            try:
                err_json = response.json()
                err_detail = err_json.get("error", {}).get("message", err_detail)
            except Exception:
                pass
            raise RuntimeError(f"Lỗi API ({response.status_code}): {err_detail}")

        res_data = response.json()
        choices = res_data.get("choices", [])
        if not choices:
            raise RuntimeError("API không trả về kết quả lựa chọn nào.")

        content = choices[0].get("message", {}).get("content", "")
        return content.strip()

    @classmethod
    def test_connection(
        cls,
        provider: str,
        api_key: str,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Tests the connection to the specified cloud provider with intelligent diagnostics."""
        test_prompt = "Hãy phản hồi đúng duy nhất từ 'OK' để xác nhận kết nối."
        test_sys = "Bạn là trợ lý kiểm tra kết nối hệ thống."
        try:
            if provider == "gemini":
                m = model or DEFAULT_GEMINI_MODEL
                res = cls.call_gemini(test_prompt, api_key, model=m, system_prompt=test_sys, max_tokens=10, timeout=15)
            else:
                m = model or DEFAULT_OPENAI_MODEL
                b = base_url or DEFAULT_OPENAI_BASE_URL
                res = cls.call_openai_compatible(test_prompt, api_key, base_url=b, model=m, system_prompt=test_sys, max_tokens=10, timeout=15)

            return {
                "ok": True,
                "message": f"✓ Kết nối thành công tới {provider.upper()} ({m})!",
                "reply": res[:50]
            }
        except Exception as e:
            err_msg = str(e)
            # Chẩn đoán riêng cho Google Gemini nếu gặp lỗi
            if provider == "gemini" and api_key and api_key.strip():
                try:
                    list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key.strip()}"
                    chk = requests.get(list_url, timeout=8)
                    if chk.status_code == 200:
                        m_list = chk.json().get("models", [])
                        supported = [
                            item.get("name", "").replace("models/", "")
                            for item in m_list
                            if "generateContent" in item.get("supportedGenerationMethods", [])
                        ]
                        if supported:
                            sample_models = ", ".join(supported[:4])
                            err_msg += f"\n💡 Gợi ý: Các model được hỗ trợ cho API Key của bạn là: {sample_models}"
                    elif chk.status_code in [400, 403]:
                        err_msg = "API Key Google Gemini không hợp lệ hoặc đã bị thu hồi. Vui lòng tạo key mới tại aistudio.google.com."
                except Exception:
                    pass

            return {
                "ok": False,
                "message": f"✗ Lỗi kết nối: {err_msg}"
            }


cloud_client = CloudClient()
