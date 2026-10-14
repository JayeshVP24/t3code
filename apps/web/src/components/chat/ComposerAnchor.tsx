import type { CSSProperties, ReactNode, Ref } from "react";

/**
 * Where a chat view's composer renders: in place, under its own timeline. A
 * side chat keeps its composer in its panel next to the host's, so both stay
 * visible and each sends to its own thread. Focus capture on the anchor says
 * which composer the thread's redirected input talks to.
 */
export function ComposerAnchor(props: {
  readonly anchorRef: Ref<HTMLDivElement>;
  readonly style?: CSSProperties | undefined;
  /** Focus entered this composer; the thread talks through it from here. */
  readonly onFocusCapture?: (() => void) | undefined;
  readonly children: ReactNode;
}) {
  const { anchorRef, style, onFocusCapture, children } = props;
  return (
    <div ref={anchorRef} className="relative z-10" style={style} onFocusCapture={onFocusCapture}>
      {children}
    </div>
  );
}
