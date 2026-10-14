/**
 * Coordinates nested horizontal gestures: while a finger is down on a swipe-to-delete
 * row, the page-level tab swipe stays out of the way.
 */
const state = { rowTouch: false };

export function setRowTouch(on: boolean) {
  state.rowTouch = on;
}

export function isRowTouch() {
  return state.rowTouch;
}
