import { Skeleton } from "../ui/skeleton";

/**
 * A short "forking" loader over a side chat the user just started. Creation is
 * already done when this mounts; it only makes the new chat read as new. Plays
 * once, then reports back so the caller can unmount it.
 */
export function SideChatEntryLoader(props: { forked: boolean; onDone: () => void }) {
  return (
    <div
      aria-hidden
      // The composer's lane, so the skeleton lines up with the composer below it.
      className="side-chat-entry-loader chat-composer-lane pointer-events-none absolute inset-0 z-30 bg-background pt-4"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) props.onDone();
      }}
    >
      <div className="chat-content-lane flex flex-col gap-3">
        <span className="text-xs text-muted-foreground">
          {props.forked ? "Forking from main" : "Starting side chat"}
        </span>
        <div className="h-0.5 overflow-hidden rounded-full bg-muted">
          <div className="side-chat-entry-progress h-full origin-left bg-primary" />
        </div>
        <Skeleton className="ms-auto h-2 w-3/5" shape="pill" />
        <Skeleton className="h-2 w-5/6" shape="pill" />
        <Skeleton className="ms-auto h-2 w-1/2" shape="pill" />
        <Skeleton className="h-2 w-3/4" shape="pill" />
      </div>
    </div>
  );
}
