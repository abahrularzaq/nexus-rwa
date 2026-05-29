"use client";

import { useCallback, useRef, useState } from "react";
import { MessageCircle, Send, X, Sparkles } from "lucide-react";
import { useAccount } from "wagmi";

import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { PaywallModal } from "@/components/paywall/PaywallModal";
import {
  readStoredX402Tx,
  writeStoredX402Tx,
} from "@/lib/x402-session";
import { parseX402Response, type X402Details } from "@/types/x402";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(
  /\/$/,
  "",
);

const SUGGESTED = [
  "Which RWA has the best risk-adjusted yield?",
  "Compare treasury vs real estate performance this month",
] as const;

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function parseSseChunk(block: string): { event: string; data: string } | null {
  let event = "message";
  let data = "";
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    if (line.startsWith("data:")) data += line.slice(5).trim();
  }
  if (!data) return null;
  return { event, data };
}

export function AskNexus() {
  const { address } = useAccount();
  const { isEnterprise } = useSession();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [x402, setX402] = useState<X402Details | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const askEndpoint = `${API_BASE}/v1/ask`;

  const scrollToBottom = useCallback(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  const sendQuestion = useCallback(
    async (question: string) => {
      if (!question.trim() || streaming) return;

      if (!address) {
        setError("Connect your wallet to use Ask Nexus.");
        return;
      }

      if (!isEnterprise) {
        setError("Enterprise tier required for Ask Nexus AI.");
        return;
      }

      setError(null);
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: question.trim(),
      };
      const assistantId = `a-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        userMsg,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setInput("");
      setStreaming(true);

      const headers = new Headers({
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "X-Wallet-Address": address,
      });
      const storedTx = readStoredX402Tx(askEndpoint);
      if (storedTx) headers.set("X-Payment-Tx", storedTx);

      try {
        const res = await fetch(askEndpoint, {
          method: "POST",
          headers,
          body: JSON.stringify({ question: question.trim() }),
        });

        if (res.status === 402) {
          const body: unknown = await res.json().catch(() => null);
          const parsed = parseX402Response(body, askEndpoint);
          if (parsed) {
            setX402(parsed.x402);
            setPaywallOpen(true);
          } else {
            setError("Payment required for Ask Nexus.");
          }
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          return;
        }

        if (res.status === 429) {
          setError("Daily limit reached (10 questions per wallet).");
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          return;
        }

        if (!res.ok || !res.body) {
          setError(`Request failed (${res.status}).`);
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            const parsed = parseSseChunk(part);
            if (!parsed) continue;

            if (parsed.event === "delta") {
              try {
                const { text } = JSON.parse(parsed.data) as { text?: string };
                if (text) {
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: m.content + text }
                        : m,
                    ),
                  );
                  scrollToBottom();
                }
              } catch {
                // ignore malformed chunk
              }
            }

            if (parsed.event === "error") {
              try {
                const errBody = JSON.parse(parsed.data) as { message?: string };
                setError(errBody.message ?? "Stream error");
              } catch {
                setError("Stream error");
              }
            }
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to reach Ask Nexus.");
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setStreaming(false);
        scrollToBottom();
      }
    },
    [address, isEnterprise, askEndpoint, streaming, scrollToBottom],
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendQuestion(input);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-[rgba(0,212,255,0.4)] bg-[rgba(15,22,41,0.95)] px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_32px_rgba(0,212,255,0.2)] transition hover:border-[#00D4FF] hover:bg-[rgba(0,212,255,0.12)]"
        aria-label="Ask Nexus AI"
      >
        <Sparkles className="size-4 text-[#00D4FF]" />
        Ask Nexus AI
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close panel backdrop"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-[rgba(30,42,58,0.9)] bg-[#0F1629] shadow-2xl"
            role="dialog"
            aria-label="Ask Nexus AI"
          >
            <header className="flex items-center justify-between border-b border-[rgba(30,42,58,0.8)] px-4 py-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="size-5 text-[#00D4FF]" />
                <h2 className="font-bold text-white">Ask Nexus</h2>
                <span className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#C084FC] ring-1 ring-[#C084FC]/40">
                  Enterprise
                </span>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-[#8892A4] hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X className="size-5" />
              </button>
            </header>

            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-[#8892A4]">
                    Ask anything about RWA assets. Answers stream from Claude using
                    live Nexus data.
                  </p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8892A4]">
                    Suggested
                  </p>
                  {SUGGESTED.map((q) => (
                    <button
                      key={q}
                      type="button"
                      disabled={streaming}
                      onClick={() => void sendQuestion(q)}
                      className="block w-full rounded-lg border border-[rgba(30,42,58,0.8)] bg-[rgba(10,14,26,0.6)] px-3 py-2 text-left text-sm text-[#C5CED9] transition hover:border-[#00D4FF]/40 hover:text-white disabled:opacity-50"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={
                      m.role === "user"
                        ? "ml-8 rounded-lg bg-[rgba(0,212,255,0.12)] px-3 py-2 text-sm text-white"
                        : "mr-4 rounded-lg border border-[rgba(30,42,58,0.8)] bg-[rgba(10,14,26,0.55)] px-3 py-2 text-sm text-[#C5CED9]"
                    }
                  >
                    {m.content || (streaming && m.role === "assistant" ? "…" : "")}
                  </div>
                ))
              )}
              {error ? (
                <p className="text-sm text-[#FF8888]" role="alert">
                  {error}
                </p>
              ) : null}
            </div>

            <form
              onSubmit={onSubmit}
              className="border-t border-[rgba(30,42,58,0.8)] p-4"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isEnterprise
                      ? "Ask about yields, risk, categories…"
                      : "Upgrade to Enterprise to chat"
                  }
                  disabled={streaming || !isEnterprise}
                  className="min-w-0 flex-1 rounded-lg border border-[rgba(30,42,58,0.8)] bg-[rgba(10,14,26,0.8)] px-3 py-2 text-sm text-white placeholder:text-[#4A5568] focus:border-[#00D4FF]/50 focus:outline-none disabled:opacity-50"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={streaming || !input.trim() || !isEnterprise}
                  className="shrink-0"
                  aria-label="Send"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </form>
          </aside>
        </>
      ) : null}

      {x402 ? (
        <PaywallModal
          isOpen={paywallOpen}
          onClose={() => setPaywallOpen(false)}
          x402Data={x402}
          requiredTier="enterprise"
          onPaymentSuccess={(txHash) => {
            writeStoredX402Tx(askEndpoint, txHash);
            setPaywallOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
