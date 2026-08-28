"use client";

import { useCallback, useId, useState, type KeyboardEvent, type RefObject } from "react";

type Props = {
  onSend: (text: string) => void;
  onEscape: () => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  placeholder: string;
};

const MAX_HEIGHT = 120;

/**
 * Enter sends, Shift+Enter adds a line, Esc hands off to the window. The
 * textarea grows with its content up to a few lines. 16px on phones so iOS
 * doesn't zoom the page when it gets focus.
 */
export default function ChatInput({ onSend, onEscape, inputRef, placeholder }: Props) {
  const [value, setValue] = useState("");
  const id = useId();

  const resize = useCallback(
    (el: HTMLTextAreaElement) => {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`;
    },
    [],
  );

  const submit = useCallback(() => {
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
    const el = inputRef.current;
    if (el) {
      el.value = "";
      resize(el);
      el.focus({ preventScroll: true });
    }
  }, [inputRef, onSend, resize, value]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onEscape();
      return;
    }
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const canSend = value.trim().length > 0;

  return (
    <form
      className="flex items-end gap-2 px-3 py-2.5"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <span aria-hidden className="mb-2.5 select-none font-mono text-[13px] leading-none text-violet-300/90">
        ›
      </span>
      <label className="sr-only" htmlFor={id}>
        message
      </label>
      <textarea
        id={id}
        ref={inputRef}
        rows={1}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          setValue(e.target.value);
          resize(e.target);
        }}
        onKeyDown={onKeyDown}
        enterKeyHint="send"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        maxLength={280}
        className="chat-scroll max-h-[120px] min-h-[36px] flex-1 resize-none bg-transparent py-2 font-mono text-[16px] leading-[1.35] text-white placeholder:text-white/30 focus:outline-none sm:text-[13px]"
      />
      <button
        type="submit"
        aria-label="send"
        disabled={!canSend}
        // Keep focus in the textarea so the keyboard stays up on phones.
        onMouseDown={(e) => e.preventDefault()}
        className="chat-send"
      >
        <svg aria-hidden width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </svg>
      </button>
    </form>
  );
}
