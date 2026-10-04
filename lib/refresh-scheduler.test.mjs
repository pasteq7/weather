import assert from 'node:assert/strict';
import test from 'node:test';
import { REFRESH_INTERVAL, startRefreshScheduler } from './refresh-scheduler.ts';

function harness() {
  const state = { time: 0, attempted: 0, hidden: false, busy: false, refreshed: 0, delay: 0, canceled: 0 };
  let timer;
  let visibility;
  const stop = startRefreshScheduler({
    refresh: () => { state.refreshed++; state.attempted = state.time; },
    isBusy: () => state.busy, lastAttempt: () => state.attempted,
    isHidden: () => state.hidden, now: () => state.time,
    schedule: (callback, delay) => { timer = callback; state.delay = delay; return 1; },
    cancel: () => { timer = undefined; state.canceled++; },
    listen: (callback) => { visibility = callback; return () => { visibility = undefined; }; },
  });
  return { state, stop, tick: () => timer?.(), visibility: () => visibility?.() };
}

test('refreshes visible data hourly and spaces out failed attempts', () => {
  const h = harness();
  assert.equal(h.state.delay, REFRESH_INTERVAL);
  h.state.time = REFRESH_INTERVAL;
  h.tick();
  assert.equal(h.state.refreshed, 1);
  h.visibility();
  assert.equal(h.state.refreshed, 1);
  assert.equal(h.state.delay, REFRESH_INTERVAL);
  h.state.time += REFRESH_INTERVAL;
  h.tick();
  assert.equal(h.state.refreshed, 2);
  h.stop();
});

test('pauses in the background, catches up on resume, and cleans up', () => {
  const h = harness();
  h.state.hidden = true;
  h.visibility();
  h.state.time = REFRESH_INTERVAL * 2;
  h.tick();
  assert.equal(h.state.refreshed, 0);
  h.state.hidden = false;
  h.visibility();
  assert.equal(h.state.refreshed, 1);
  h.stop();
  h.state.time += REFRESH_INTERVAL;
  h.visibility();
  h.tick();
  assert.equal(h.state.refreshed, 1);
});

test('does not overlap an active weather request', () => {
  const h = harness();
  h.state.busy = true;
  h.state.time = REFRESH_INTERVAL;
  h.tick();
  assert.equal(h.state.refreshed, 0);
  h.state.busy = false;
  h.tick();
  assert.equal(h.state.refreshed, 1);
  h.stop();
});
