import { act, createElement, useLayoutEffect } from "react";
import { create } from "react-test-renderer";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { ComposerHandleContext, type ComposerHandleRef } from "../../composerHandleContext";
import {
  isInsideCollapsedComposerControls,
  isInsideComposerFloatingLayer,
  isInsideRestingComposerControlScope,
  resolvePasteComposerTarget,
  useComposerMenuProps,
} from "./composerEventScope";

class FakeElement {
  constructor(private readonly matchingSelector: string | null) {}

  closest(selector: string): FakeElement | null {
    return this.matchingSelector !== null &&
      selector.split(",").some((candidate) => candidate === this.matchingSelector)
      ? this
      : null;
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("composer menu focus", () => {
  it.each([
    ["an open menu", '[data-chat-composer-floating-layer="true"]', true],
    ["an unmounted menu", null, true],
    ["another control", "input", false],
  ])("closes while focus is on %s", async (_label, selector, shouldFocusComposer) => {
    const body = new FakeElement(null);
    const editor = new FakeElement(null);
    const activeElement = selector === null ? body : new FakeElement(selector);
    const document = { body, activeElement };
    const composerRef = {
      current: { focusAtEnd: () => (document.activeElement = editor) },
    } as unknown as ComposerHandleRef;
    vi.stubGlobal("Element", FakeElement);
    vi.stubGlobal("document", document);
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    let menuProps: ReturnType<typeof useComposerMenuProps> | undefined;
    function Probe() {
      const props = useComposerMenuProps();
      useLayoutEffect(() => {
        menuProps = props;
      }, [props]);
      return null;
    }
    const renderer = await act(() =>
      create(createElement(ComposerHandleContext, { value: composerRef }, createElement(Probe))),
    );
    try {
      expect(menuProps?.finalFocus?.()).toBe(false);
      expect(document.activeElement).toBe(shouldFocusComposer ? editor : activeElement);
    } finally {
      await act(() => renderer.unmount());
    }
  });
});

describe("paste composer target", () => {
  it("routes a paste inside a side chat to its own composer, focused or not", () => {
    expect(resolvePasteComposerTarget({ targetChatId: "side-1", focusedSideChatId: null })).toBe(
      "side",
    );
    expect(
      resolvePasteComposerTarget({ targetChatId: "side-1", focusedSideChatId: "side-1" }),
    ).toBe("side");
  });

  it("routes a paste in the host area to the side chat only while it has focus", () => {
    expect(resolvePasteComposerTarget({ targetChatId: null, focusedSideChatId: "side-1" })).toBe(
      "side",
    );
    expect(resolvePasteComposerTarget({ targetChatId: null, focusedSideChatId: null })).toBe(
      "host",
    );
  });
});

describe("composer event scopes", () => {
  it("recognizes events from the portaled resting controls", () => {
    vi.stubGlobal("Element", FakeElement);

    const target = new FakeElement('[data-chat-composer-resting-controls="true"]');
    expect(isInsideRestingComposerControlScope(target as unknown as EventTarget)).toBe(true);
  });

  it("recognizes events from the composer context strip controls", () => {
    vi.stubGlobal("Element", FakeElement);

    const target = new FakeElement("[data-composer-context-control]");
    expect(isInsideRestingComposerControlScope(target as unknown as EventTarget)).toBe(true);
  });

  it("keeps resting image previews focused without expanding their subtree", () => {
    vi.stubGlobal("Element", FakeElement);

    const target = new FakeElement('[data-chat-composer-resting-images="true"]');
    expect(isInsideRestingComposerControlScope(target as unknown as EventTarget)).toBe(true);
  });

  it("includes composer-owned floating layers in the resting control scope", () => {
    vi.stubGlobal("Element", FakeElement);

    const target = new FakeElement('[data-chat-composer-floating-layer="true"]');
    expect(isInsideComposerFloatingLayer(target as unknown as EventTarget)).toBe(true);
    expect(isInsideRestingComposerControlScope(target as unknown as EventTarget)).toBe(true);
  });

  it("leaves unrelated floating layers outside the composer scope", () => {
    vi.stubGlobal("Element", FakeElement);

    const target = new FakeElement('[data-slot="popover-popup"]');
    expect(isInsideComposerFloatingLayer(target as unknown as EventTarget)).toBe(false);
    expect(isInsideRestingComposerControlScope(target as unknown as EventTarget)).toBe(false);
  });

  it("leaves ordinary composer targets outside the portaled control scope", () => {
    vi.stubGlobal("Element", FakeElement);

    const target = new FakeElement(null);
    expect(isInsideRestingComposerControlScope(target as unknown as EventTarget)).toBe(false);
    expect(isInsideRestingComposerControlScope(null)).toBe(false);
  });

  it("recognizes banner and drawer controls docked above the surface", () => {
    vi.stubGlobal("Element", FakeElement);

    const target = new FakeElement('[data-chat-composer-collapsed-controls="true"]');
    expect(isInsideCollapsedComposerControls(target as unknown as EventTarget)).toBe(true);
    expect(isInsideCollapsedComposerControls(new FakeElement(null) as unknown as EventTarget)).toBe(
      false,
    );
    expect(isInsideCollapsedComposerControls(null)).toBe(false);
  });
});
