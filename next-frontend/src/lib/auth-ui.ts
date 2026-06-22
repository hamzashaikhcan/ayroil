/**
 * Storefront is guest-checkout-only for now — the login/register/account
 * routes still work if visited directly, but every nav entry point into
 * them is hidden behind this flag. Flip to `true` to bring auth back.
 */
export const AUTH_UI_ENABLED = false;
