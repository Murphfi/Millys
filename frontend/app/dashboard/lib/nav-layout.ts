// Mobile floating nav geometry — shared source of truth so any future
// bottom-anchored element (toast, FAB) can reserve space against the same
// numbers instead of guessing. NAV_ICON_POP is how far the active tab's
// icon bubble rises above the pill's own top edge; CONTENT_RESERVE must
// clear the bubble, not just the pill, or the bubble paints over content.
export const NAV_BOTTOM_GAP = 14;
export const NAV_HEIGHT = 64;
export const NAV_ICON_POP = 26;
export const NAV_ICON_MARGIN = 6;
export const NAV_Z_INDEX = 30;
export const CONTENT_RESERVE = NAV_BOTTOM_GAP + NAV_HEIGHT + NAV_ICON_POP + NAV_ICON_MARGIN;
