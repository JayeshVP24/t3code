import { scopedThreadKey } from "@t3tools/client-runtime/environment";
import type { AssistantCitation, RunId, ScopedThreadRef, ThreadId } from "@t3tools/contracts";
import { type RefObject, useCallback, useEffect, useRef } from "react";

import type { ChatComposerHandle } from "../components/chat/ChatComposer";
import { chatViewOf } from "../components/chat/composerEventScope";
import type { RightPanelSurface } from "../rightPanelStore";
import { resolveFocusedSideChat, useSideChatFocusStore } from "../sideChatStore";
import { useSideChatActions } from "./useSideChatActions";

/**
 * A thread's side of its side chats: the actions, and which side chat its
 * redirected input talks to. Each side chat renders its own composer in its
 * panel; focus only decides where typing and paste with no editable target go.
 */
export function useSideChatHost(input: {
  /** Null for drafts and inside a side chat, which has none of its own. */
  readonly threadRef: ScopedThreadRef | null;
  readonly composerRef: RefObject<ChatComposerHandle | null>;
  readonly panelOpen: boolean;
  readonly activeSurface: RightPanelSurface | null;
}) {
  const { threadRef, composerRef } = input;
  const actions = useSideChatActions(threadRef);
  const threadKey = threadRef === null ? null : scopedThreadKey(threadRef);
  const picked = useSideChatFocusStore((state) =>
    threadKey === null ? null : (state.byParent[threadKey] ?? null),
  );
  const focusedSideChatId = resolveFocusedSideChat({
    picked,
    panelOpen: input.panelOpen,
    activeSurface: input.activeSurface,
  });
  // The side chat's composer, so keys typed or pasted anywhere in this thread
  // go where the user is talking.
  const sideComposerRef = useRef<ChatComposerHandle | null>(null);

  // Back from a side chat, this thread's composer takes the keyboard again —
  // unless a click into it is what brought the user back, caret included.
  const hadFocusedSideChat = useRef(false);
  useEffect(() => {
    if (focusedSideChatId === null && hadFocusedSideChat.current) {
      const active = document.activeElement;
      const inOwnComposer =
        active?.getAttribute("data-testid") === "composer-editor" && chatViewOf(active) === null;
      if (!inOwnComposer) composerRef.current?.focusAtEnd();
    }
    hadFocusedSideChat.current = focusedSideChatId !== null;
  }, [composerRef, focusedSideChatId]);

  /** Focusing this thread's own composer hands redirected input back to it. */
  const releaseSideChat = useCallback(() => {
    if (threadKey !== null) useSideChatFocusStore.getState().release(threadKey);
  }, [threadKey]);

  const start = actions.start;
  const threadId = threadRef?.threadId ?? null;
  const onAskAboutResponse = useCallback(
    async (target: { readonly sourceThreadId: ThreadId; readonly runId: RunId }) => {
      if (target.sourceThreadId !== threadId) return;
      await start({ history: "with", runId: target.runId });
    },
    [start, threadId],
  );
  const defaultHistory = actions.defaultHistory;
  const onAskAssistantText = useCallback(
    (citation: AssistantCitation) => {
      void start({ history: defaultHistory, quote: citation.text });
      return true;
    },
    [defaultHistory, start],
  );

  return {
    actions,
    available: actions.supported && threadRef !== null,
    focusedSideChatId,
    sideComposerRef,
    releaseSideChat,
    onAskAboutResponse,
    onAskAssistantText,
  };
}
