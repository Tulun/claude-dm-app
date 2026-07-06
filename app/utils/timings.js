// Canonical client timing constants. The save-gate/debounce contract lives in
// the frontend-patterns skill (§1); page tests derive their timer advances
// from these values — change them together.
export const SAVE_ARM_DELAY_MS = 500;         // auto-save stays disabled this long after load settles
export const SAVE_DEBOUNCE_MS = 1000;         // debounce for state-watching auto-save POSTs
export const SHEET_SAVE_DEBOUNCE_MS = 1500;   // character sheet's slower edit debounce
export const TOAST_DURATION_MS = 2000;        // save-status toast visibility
export const TOAST_ERROR_DURATION_MS = 3000;  // error toasts linger a bit longer
