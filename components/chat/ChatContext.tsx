"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useReducedMotion } from "framer-motion";
import {
  createChatContext,
  respond,
  WELCOME_MESSAGE,
  type ChatContextState,
  type ChatEffect,
  type ChatFileMedia,
  type ChatReply,
} from "@/lib/chat";

/**
 * The one conversation. All state lives here; the pieces of the chat panel
 * (portrait, stage, console) are just views on it.
 */

export type ChatMessage = {
  id: string;
  role: "user" | "bot";
  text: string;
  reply?: ChatReply;
};

export type ChatEffectEvent = { id: number; kind: ChatEffect };
/** A clip up in the video popup. A new id re-opens it even for the same src. */
export type ChatVideoEvent = { id: number; src: string };

type ChatStore = {
  messages: ChatMessage[];
  typing: boolean;
  discovered: number;
  effect: ChatEffectEvent | null;
  /** Clips never embed, they play in the site's video popup. */
  video: ChatVideoEvent | null;
  openVideo: (src: string) => void;
  closeVideo: () => void;
  send: (text: string) => void;
  clear: () => void;
  /** The chat panel is on screen, it only takes focus and plays effects then. */
  sectionInView: boolean;
  setSectionInView: (v: boolean) => void;
  /** Bumps whenever something wants the input focused. */
  focusRequest: number;
  requestFocus: () => void;
  /** Handle "#panel" links. Returns true when it took care of it. */
  navigate: (href: string) => boolean;
  reduceMotion: boolean;
};

const ChatStoreContext = createContext<ChatStore | null>(null);

const welcome = (): ChatMessage => ({ id: "welcome", role: "bot", text: WELCOME_MESSAGE });

/** 300–900 ms, longer for longer replies, so it reads as "typing" not "lag". */
function replyDelay(reply: ChatReply, index: number): number {
  const base = index === 0 ? 320 : 420;
  return Math.min(900, base + reply.text.length * 5);
}

function playSound(src: string) {
  try {
    const audio = new Audio(src);
    audio.volume = 0.45;
    void audio.play().catch(() => {});
  } catch {
    // no audio, no problem
  }
}

type Props = {
  children: ReactNode;
  /** Scroll the feed to a panel ("projects", "gallery", "fun", "home"). */
  onNavigate?: (panel: string) => void;
};

export function ChatProvider({ children, onNavigate }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [welcome()]);
  const [typing, setTyping] = useState(false);
  const [discovered, setDiscovered] = useState(0);
  const [effect, setEffect] = useState<ChatEffectEvent | null>(null);
  const [video, setVideo] = useState<ChatVideoEvent | null>(null);
  const [sectionInView, setSectionInView] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  const reduceMotion = useReducedMotion() ?? false;

  const engineContext = useRef<ChatContextState>(createChatContext());
  const timers = useRef<number[]>([]);
  const seq = useRef(0);

  const cancelTimers = useCallback(() => {
    for (const t of timers.current) window.clearTimeout(t);
    timers.current = [];
  }, []);
  useEffect(() => cancelTimers, [cancelTimers]);

  const schedule = useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(() => {
      timers.current = timers.current.filter((t) => t !== id);
      fn();
    }, ms);
    timers.current.push(id);
  }, []);

  const clear = useCallback(() => {
    cancelTimers();
    engineContext.current = createChatContext();
    setMessages([welcome()]);
    setTyping(false);
    setDiscovered(0);
    setVideo(null);
  }, [cancelTimers]);

  const openVideo = useCallback((src: string) => setVideo({ id: ++seq.current, src }), []);
  const closeVideo = useCallback(() => setVideo(null), []);

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;

      const result = respond(text, engineContext.current);
      engineContext.current = result.context;

      if (result.action === "clear") {
        clear();
        return;
      }

      setMessages((m) => [...m, { id: `u${++seq.current}`, role: "user", text }]);
      setVideo(null);
      setDiscovered(result.context.discovered.length);
      if (result.replies.length === 0) return;

      // Anything still queued from the previous message lands before this one.
      setTyping(true);
      let at = 0;
      result.replies.forEach((reply, i) => {
        at += replyDelay(reply, i);
        const isLast = i === result.replies.length - 1;
        if (reply.effect && !reduceMotion) {
          // Glitch/shake hit while the indicator is still up, the reply
          // arrives out of the distortion. A flash lands with the text.
          const lead = reply.effect === "flash" ? 0 : 380;
          const kind = reply.effect;
          schedule(Math.max(60, at - lead), () => setEffect({ id: ++seq.current, kind }));
        }
        schedule(at, () => {
          setMessages((m) => [
            ...m,
            { id: `b${++seq.current}`, role: "bot", text: reply.text, reply },
          ]);
          if (reply.sound) playSound(reply.sound);
          // A clip comes up in the video popup, the way every other video on
          // the site plays, nothing embedded on the stage.
          const clip = reply.media?.find((m): m is ChatFileMedia => m.type === "video");
          if (clip) setVideo({ id: ++seq.current, src: clip.src });
          if (isLast) setTyping(false);
        });
      });
    },
    [clear, reduceMotion, schedule],
  );

  const requestFocus = useCallback(() => setFocusRequest((n) => n + 1), []);

  const navigate = useCallback(
    (href: string) => {
      if (!href.startsWith("#")) return false;
      onNavigate?.(href.slice(1));
      return true;
    },
    [onNavigate],
  );

  const value = useMemo<ChatStore>(
    () => ({
      messages,
      typing,
      discovered,
      effect,
      video,
      openVideo,
      closeVideo,
      send,
      clear,
      sectionInView,
      setSectionInView,
      focusRequest,
      requestFocus,
      navigate,
      reduceMotion,
    }),
    [
      messages,
      typing,
      discovered,
      effect,
      video,
      openVideo,
      closeVideo,
      send,
      clear,
      sectionInView,
      focusRequest,
      requestFocus,
      navigate,
      reduceMotion,
    ],
  );

  return <ChatStoreContext.Provider value={value}>{children}</ChatStoreContext.Provider>;
}

export function useChat(): ChatStore {
  const store = useContext(ChatStoreContext);
  if (!store) throw new Error("useChat must be used inside <ChatProvider>");
  return store;
}
