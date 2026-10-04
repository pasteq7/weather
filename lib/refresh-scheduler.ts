export const REFRESH_INTERVAL = 3_600_000;

// Keep failed refresh attempts spaced apart, even when the saved data is old.
export function startRefreshScheduler({
  refresh, isBusy, lastAttempt, isHidden, now = Date.now,
  schedule, cancel, listen,
}: {
  refresh: () => void;
  isBusy: () => boolean;
  lastAttempt: () => number;
  isHidden: () => boolean;
  now?: () => number;
  schedule: (callback: () => void, delay: number) => number;
  cancel: (id: number) => void;
  listen: (callback: () => void) => () => void;
}) {
  let timer: number | undefined;
  const check = () => {
    if (timer !== undefined) cancel(timer);
    if (isHidden()) return;
    const elapsed = now() - lastAttempt();
    if (elapsed >= REFRESH_INTERVAL && !isBusy()) refresh();
    timer = schedule(check, Math.max(1_000, REFRESH_INTERVAL - (now() - lastAttempt())));
  };
  const unlisten = listen(check);
  check();
  return () => {
    if (timer !== undefined) cancel(timer);
    unlisten();
  };
}
