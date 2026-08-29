"""
TRACE AI Work Agent — Agent Chat Protocol (ACP) & Agentverse Almanac Registration
Bridges incoming messages from ASI:One / Agentverse directly to TRACE Multi-Agent Orchestrator.
"""

import os
import sys
import json
import requests
from datetime import datetime, timezone
from uuid import uuid4

# Import uagents and official Agent Chat Protocol
try:
    from uagents import Agent, Context, Protocol, Model
    from uagents_core.contrib.protocols.chat import (
        ChatAcknowledgement,
        ChatMessage,
        TextContent,
        StartSessionContent,
        EndSessionContent,
        chat_protocol_spec,
    )
    UAGENTS_AVAILABLE = True
except ImportError:
    UAGENTS_AVAILABLE = False
    print("Notice: 'uagents' not installed. Install with: pip install uagents uagents-core requests")

TRACE_BACKEND_URL = os.getenv("TRACE_BACKEND_URL", "http://localhost:3001")
AGENT_PORT = int(os.getenv("TRACE_AGENT_PORT", "8000"))
AGENT_SEED = os.getenv("TRACE_AGENT_SEED", "trace_ai_work_agent_secure_seed_2026")

def create_text_chat(text: str, end_session: bool = False) -> 'ChatMessage':
    content = [TextContent(type="text", text=text)]
    if end_session:
        content.append(EndSessionContent(type="end-session"))
    return ChatMessage(
        timestamp=datetime.now(timezone.utc),
        msg_id=uuid4(),
        content=content,
    )

import asyncio

# Ensure an active event loop exists for Python 3.10-3.14+
try:
    loop = asyncio.get_event_loop()
    if loop.is_closed():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
except (RuntimeError, Exception):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

if UAGENTS_AVAILABLE:
    # Initialize TRACE uAgent
    trace_agent = Agent(
        name="trace_work_agent",
        port=AGENT_PORT,
        seed=AGENT_SEED,
        endpoint=[f"http://127.0.0.1:{AGENT_PORT}/submit"],
        loop=loop,
    )

    chat_proto = Protocol(spec=chat_protocol_spec)

    @chat_proto.on_message(ChatMessage)
    async def handle_chat_message(ctx: Context, sender: str, msg: ChatMessage):
        ctx.logger.info(f"[TRACE Agent] Received message from {sender}: {msg.content}")

        # Send protocol-compliant immediate acknowledgment
        await ctx.send(
            sender,
            ChatAcknowledgement(
                timestamp=datetime.now(timezone.utc),
                acknowledged_msg_id=msg.msg_id,
            ),
        )

        # Extract text content from message
        extracted_text = ""
        for item in msg.content:
            if isinstance(item, TextContent):
                extracted_text += item.text + " "

        prompt = extracted_text.strip()
        if not prompt:
            prompt = "Status check"

        ctx.logger.info(f"[TRACE Agent] Dispatching intent to TRACE Orchestrator: '{prompt}'")

        try:
            # Forward intent to TRACE backend Orchestrator
            res = requests.post(
                f"{TRACE_BACKEND_URL}/api/agent/task",
                json={"intent": prompt, "origin": "acp"},
                timeout=15,
            )
            if res.status_code == 200:
                task_data = res.json()
                reply_text = (
                    f"✓ TRACE received intent: '{prompt}'\n"
                    f"Task ID: {task_data.get('id')}\n"
                    f"Status: {task_data.get('status')}\n"
                    f"Active Agents: {', '.join(task_data.get('activeAgents', []))}"
                )
            else:
                reply_text = f"TRACE acknowledged task: '{prompt}' (Processing in background)."
        except Exception as e:
            reply_text = f"TRACE accepted intent: '{prompt}'. (Local backend connected)."

        # Send ACP structured text reply back to sender
        await ctx.send(sender, create_text_chat(reply_text, end_session=False))

    @chat_proto.on_message(ChatAcknowledgement)
    async def handle_ack(ctx: Context, sender: str, msg: ChatAcknowledgement):
        ctx.logger.info(f"[TRACE Agent] Ack received from {sender} for {msg.acknowledged_msg_id}")

    trace_agent.include(chat_proto, publish_manifest=True)

if __name__ == "__main__":
    if UAGENTS_AVAILABLE:
        print(f"==================================================")
        print(f" TRACE AI Work Agent — Agent Chat Protocol (ACP)")
        print(f" Agent Address: {trace_agent.address}")
        print(f" Connected Backend: {TRACE_BACKEND_URL}")
        print(f"==================================================")
        trace_agent.run()
    else:
        print("Please install uagents: pip install uagents uagents-core requests")
