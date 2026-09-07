import json
import logging
from typing import Any, AsyncGenerator, Dict, List, Optional, Tuple
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.ai.providers import BaseLLMProvider, MockLLMProvider
from app.ai.tools import ToolDispatcher

logger = logging.getLogger("guideme.ai.gemini")

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"


class GeminiProvider(BaseLLMProvider):
    """
    Production-grade Google Gemini AI Companion Provider.
    Supports system instructions, multi-turn history, native function/tool calling,
    and Server-Sent Events (SSE) streaming.
    """

    def __init__(self, model_name: Optional[str] = None):
        self.model = model_name or settings.GEMINI_MODEL or "gemini-1.5-flash"
        self.api_key = settings.GEMINI_API_KEY

    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    def _build_contents(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
    ) -> List[Dict[str, Any]]:
        """
        Builds Gemini-compliant contents array from conversation history.
        Preserves sliding window (last 14 messages).
        """
        contents: List[Dict[str, Any]] = []
        recent_history = conversation_history[-14:] if len(conversation_history) > 14 else conversation_history

        for item in recent_history:
            role = item.get("role")
            content = item.get("content", "")
            if not content:
                continue

            # Gemini expects 'user' or 'model'
            gemini_role = "user" if role == "user" else "model"
            contents.append({
                "role": gemini_role,
                "parts": [{"text": content}],
            })

        # Append current user turn
        contents.append({
            "role": "user",
            "parts": [{"text": user_message}],
        })

        return contents

    async def generate_response(
        self,
        user_message: str,
        system_prompt: str,
        conversation_history: List[Dict[str, str]],
        user_id: Optional[str] = None,
        db: Optional[AsyncSession] = None,
    ) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Single-turn non-streaming response with tool calling execution loop.
        """
        if not self.is_configured():
            logger.info("GEMINI_API_KEY not configured. Seamlessly delegating to MockLLMProvider.")
            return await MockLLMProvider().generate_response(user_message, system_prompt, conversation_history)

        url = f"{GEMINI_API_BASE}/models/{self.model}:generateContent?key={self.api_key}"
        contents = self._build_contents(user_message, conversation_history)
        tools_spec = ToolDispatcher.get_gemini_tools_spec()

        payload: Dict[str, Any] = {
            "system_instruction": {
                "parts": [{"text": system_prompt}]
            },
            "contents": contents,
            "tools": tools_spec,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 800,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=35.0) as client:
                res = await client.post(url, json=payload)

                if res.status_code != 200:
                    logger.warning(
                        f"Gemini API returned {res.status_code}: {res.text}. Falling back to mock companion."
                    )
                    return await MockLLMProvider().generate_response(user_message, system_prompt, conversation_history)

                data = res.json()
                candidates = data.get("candidates", [])
                if not candidates:
                    return "I am reflecting on your thoughts. Could you tell me more?", []

                candidate = candidates[0]
                content_obj = candidate.get("content", {})
                parts = content_obj.get("parts", [])

                # Check for functionCall
                function_call = None
                text_accum = []
                for p in parts:
                    if "functionCall" in p:
                        function_call = p["functionCall"]
                    elif "text" in p:
                        text_accum.append(p["text"])

                # If no function call, return direct response
                if not function_call or not user_id or not db:
                    resp_text = "".join(text_accum).strip() or "I am listening closely. How does that resonate with you?"
                    extracted = self._extract_memories(user_message)
                    return resp_text, extracted

                # Execute Tool Call
                fn_name = function_call.get("name")
                fn_args = function_call.get("args", {})
                tool_result = await ToolDispatcher.execute(fn_name, fn_args, user_id, db)

                # If destructive action requiring confirmation
                if tool_result.get("confirmation_required"):
                    confirm_text = (
                        f"I can help with that. However, deleting this requires your explicit confirmation.\n\n"
                        f"**Action Required**: {tool_result.get('description')}\n"
                        f"Please click 'Confirm' in the confirmation prompt to proceed."
                    )
                    return confirm_text, []

                # Feed function response back to Gemini for final natural language synthesis
                contents.append({
                    "role": "model",
                    "parts": [{"functionCall": function_call}],
                })
                contents.append({
                    "role": "function",
                    "parts": [{
                        "functionResponse": {
                            "name": fn_name,
                            "response": {"result": tool_result},
                        }
                    }],
                })

                payload["contents"] = contents
                res2 = await client.post(url, json=payload)
                if res2.status_code == 200:
                    data2 = res2.json()
                    cands2 = data2.get("candidates", [])
                    if cands2:
                        final_text = "".join([p.get("text", "") for p in cands2[0].get("content", {}).get("parts", [])])
                        extracted = self._extract_memories(user_message)
                        return final_text.strip(), extracted

                # Fallback to tool result message if second call fails
                return tool_result.get("message", "Action completed successfully."), []

        except Exception as exc:
            logger.error(f"Gemini API invocation error: {exc}. Falling back to mock companion.", exc_info=True)
            return await MockLLMProvider().generate_response(user_message, system_prompt, conversation_history)

    async def stream_conversation(
        self,
        user_message: str,
        system_prompt: str,
        conversation_history: List[Dict[str, str]],
        user_id: str,
        db: AsyncSession,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        SSE Streaming generator yielding real-time chunks and tool execution events.
        """
        if not self.is_configured():
            logger.info("GEMINI_API_KEY not configured. Streaming simulated response via MockLLMProvider.")
            resp, extracted = await MockLLMProvider().generate_response(user_message, system_prompt, conversation_history)
            # Stream words with small delays for smooth UI experience
            words = resp.split(" ")
            for i, word in enumerate(words):
                chunk = word + (" " if i < len(words) - 1 else "")
                yield {"type": "delta", "content": chunk}
            yield {"type": "done", "full_text": resp, "extracted_memories": extracted}
            return

        url = f"{GEMINI_API_BASE}/models/{self.model}:streamGenerateContent?alt=sse&key={self.api_key}"
        contents = self._build_contents(user_message, conversation_history)
        tools_spec = ToolDispatcher.get_gemini_tools_spec()

        payload: Dict[str, Any] = {
            "system_instruction": {
                "parts": [{"text": system_prompt}]
            },
            "contents": contents,
            "tools": tools_spec,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 800,
            },
        }

        full_text_accum = []
        function_call = None

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                async with client.stream("POST", url, json=payload) as response:
                    if response.status_code != 200:
                        err_content = await response.aread()
                        logger.warning(f"Gemini stream status {response.status_code}: {err_content.decode(errors='ignore')}")
                        # Fall back to mock
                        resp, extracted = await MockLLMProvider().generate_response(user_message, system_prompt, conversation_history)
                        yield {"type": "delta", "content": resp}
                        yield {"type": "done", "full_text": resp, "extracted_memories": extracted}
                        return

                    async for line in response.aiter_lines():
                        if not line or not line.startswith("data:"):
                            continue

                        raw_json = line[len("data:"):].strip()
                        if not raw_json:
                            continue

                        try:
                            chunk_data = json.loads(raw_json)
                            candidates = chunk_data.get("candidates", [])
                            if not candidates:
                                continue

                            parts = candidates[0].get("content", {}).get("parts", [])
                            for part in parts:
                                if "text" in part and part["text"]:
                                    text_val = part["text"]
                                    full_text_accum.append(text_val)
                                    yield {"type": "delta", "content": text_val}
                                if "functionCall" in part:
                                    function_call = part["functionCall"]
                        except json.JSONDecodeError:
                            continue

                # Handle Function Call if requested by model
                if function_call:
                    fn_name = function_call.get("name")
                    fn_args = function_call.get("args", {})
                    yield {"type": "tool_start", "tool": fn_name, "args": fn_args}

                    tool_result = await ToolDispatcher.execute(fn_name, fn_args, user_id, db)

                    if tool_result.get("confirmation_required"):
                        yield {
                            "type": "confirmation_required",
                            "action_id": tool_result["action_id"],
                            "tool": tool_result["tool"],
                            "description": tool_result["description"],
                            "parameters": tool_result["parameters"],
                        }
                        yield {
                            "type": "done",
                            "full_text": "".join(full_text_accum) + f"\n\n*(Confirmation required: {tool_result['description']})*",
                            "extracted_memories": [],
                        }
                        return

                    yield {"type": "tool_done", "tool": fn_name, "result": tool_result}

                    # Feed back to Gemini for synthesis
                    contents.append({
                        "role": "model",
                        "parts": [{"functionCall": function_call}],
                    })
                    contents.append({
                        "role": "function",
                        "parts": [{
                            "functionResponse": {
                                "name": fn_name,
                                "response": {"result": tool_result},
                            }
                        }],
                    })
                    payload["contents"] = contents

                    # Second stream for response synthesis
                    async with client.stream("POST", url, json=payload) as response2:
                        if response2.status_code == 200:
                            async for line in response2.aiter_lines():
                                if not line or not line.startswith("data:"):
                                    continue
                                raw_json = line[len("data:"):].strip()
                                if not raw_json:
                                    continue
                                try:
                                    chunk_data = json.loads(raw_json)
                                    candidates = chunk_data.get("candidates", [])
                                    if not candidates:
                                        continue
                                    for part in candidates[0].get("content", {}).get("parts", []):
                                        if "text" in part and part["text"]:
                                            t = part["text"]
                                            full_text_accum.append(t)
                                            yield {"type": "delta", "content": t}
                                except json.JSONDecodeError:
                                    continue
                        else:
                            fallback_msg = f"\n\n{tool_result.get('message', 'Action completed.')}"
                            full_text_accum.append(fallback_msg)
                            yield {"type": "delta", "content": fallback_msg}

            # Final completed event
            final_text = "".join(full_text_accum).strip()
            extracted = self._extract_memories(user_message)
            yield {
                "type": "done",
                "full_text": final_text,
                "extracted_memories": extracted,
            }

        except Exception as exc:
            logger.error(f"Error in Gemini streaming: {exc}", exc_info=True)
            fallback = "I'm listening and right here with you. What feels like the best small step right now?"
            yield {"type": "delta", "content": fallback}
            yield {"type": "done", "full_text": fallback, "extracted_memories": []}

    def _extract_memories(self, msg: str) -> List[Dict[str, Any]]:
        """
        Extracts key preferences or goals stated by the user to build long-term memory.
        """
        msg_lower = msg.lower().strip()
        memories = []

        for p in ["i like ", "i prefer ", "i enjoy ", "i love "]:
            if p in msg_lower:
                val = msg_lower.split(p)[-1].strip(" .!?,")
                if len(val) > 2:
                    memories.append({
                        "type": "preference",
                        "key": f"pref_{val[:15].replace(' ', '_')}",
                        "content": f"Enjoys {val}",
                        "confidence": 0.9,
                    })
                break

        for p in ["my goal is ", "i am trying to ", "i want to ", "working on "]:
            if p in msg_lower:
                val = msg_lower.split(p)[-1].strip(" .!?,")
                if len(val) > 3:
                    memories.append({
                        "type": "wellness_goal",
                        "key": f"goal_{val[:15].replace(' ', '_')}",
                        "content": f"Working towards {val}",
                        "confidence": 0.92,
                    })
                break

        for p in ["i struggle with ", "i am worried about ", "stressed about "]:
            if p in msg_lower:
                val = msg_lower.split(p)[-1].strip(" .!?,")
                if len(val) > 3:
                    memories.append({
                        "type": "stressor",
                        "key": f"stress_{val[:15].replace(' ', '_')}",
                        "content": f"Struggles with {val}",
                        "confidence": 0.88,
                    })
                break

        return memories
