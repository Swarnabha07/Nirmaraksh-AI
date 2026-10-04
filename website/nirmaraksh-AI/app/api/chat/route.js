import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Keeps the web chat a basic conversational assistant and draws the web-vs-desktop line.
// The model enforces this itself (no separate keyword classifier) per product decision.
const SYSTEM_PROMPT =
  "You are Nirmaraksh AI (web). You are a general-purpose conversational assistant that can " +
  "discuss programming, general knowledge, writing, math, and cybersecurity concepts " +
  "(e.g. explaining SQL injection, XSS, reconnaissance, OWASP Top 10) in an educational way. " +
  "You do NOT have access to the user's computer, local files, a terminal, a local browser, " +
  "or any live network/security tools, and you cannot actually perform a penetration test, " +
  "vulnerability scan, or reconnaissance against a website or system the user names, even if asked " +
  "directly. Never claim or imply that you ran a scan, executed a command, or tested a real target. " +
  "When the user asks you to actually perform such an action (testing/attacking/scanning a given " +
  "URL or system, running local commands, controlling their computer, local browser automation, or " +
  "any other action requiring the Nirmaraksh desktop agent), briefly explain that this capability " +
  "requires the Nirmaraksh Desktop application and include a Markdown link exactly like " +
  "[Download Nirmaraksh Desktop](/download) in your reply. Do not do this for purely educational or " +
  "explanatory questions about security topics — answer those normally. Do not mention internal " +
  "implementation details, API keys, or server configuration.";

const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 4000;
const MAX_TOTAL_CHARS = 24000;

function validationError(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function POST(req) {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return NextResponse.json(
      { error: "Service temporarily unavailable. Please try again." },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in to use the chat." },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => null);
  const messages = body?.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    return validationError(
      'Invalid request body. "messages" must be a non-empty array.',
    );
  }
  if (messages.length > MAX_MESSAGES) {
    return validationError(
      `Too many messages in this conversation (max ${MAX_MESSAGES}).`,
    );
  }

  let totalChars = 0;
  const conversationMessages = [{ role: "system", content: SYSTEM_PROMPT }];

  for (const m of messages) {
    if (!m || m.role === "system") continue;
    if (typeof m.content !== "string") {
      return validationError("Each message must have string content.");
    }
    if (m.content.length > MAX_MESSAGE_CHARS) {
      return validationError(
        `A message exceeds the maximum length of ${MAX_MESSAGE_CHARS} characters.`,
      );
    }
    totalChars += m.content.length;
    if (totalChars > MAX_TOTAL_CHARS) {
      return validationError(
        "This conversation is too long. Please start a new chat.",
      );
    }
    conversationMessages.push({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    });
  }

  if (conversationMessages.length === 1) {
    return validationError("No user message provided.");
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Chat is not configured yet. Please try again later." },
      { status: 503 },
    );
  }

  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  const encoder = new TextEncoder();

  let stream;
  try {
    const openai = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
    stream = await openai.chat.completions.create({
      model,
      messages: conversationMessages,
      stream: true,
    });
  } catch (err) {
    console.error("Groq request failed:", err?.status, err?.message);
    const status = err?.status === 429 ? 429 : 502;
    return NextResponse.json(
      { error: "Unable to generate a response right now. Please try again." },
      { status },
    );
  }

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const content = chunk.choices?.[0]?.delta?.content || "";
          if (content) {
            const payload = JSON.stringify({ content });
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (err) {
        console.error("Groq stream failed mid-response:", err?.message);
        try {
          // lib/api.js's streamTrialChat() only reads `content`, so the interruption is
          // surfaced as visible text appended to the in-progress assistant message.
          const payload = JSON.stringify({
            content: "\n\n_The response was interrupted. Please try again._",
          });
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } finally {
          controller.close();
        }
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
