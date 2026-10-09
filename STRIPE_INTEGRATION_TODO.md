# Stripe Checkout: remaining setup

The "Pay $500" Time Audit buttons now go to `checkout.php`, which creates a Stripe Checkout
Session and redirects the visitor to Stripe's hosted payment page. Until the values below are
set, those buttons fall back to the contact form, so nothing breaks in the meantime.

## Values to Replace

The following values are placeholders and must be updated before going live.

**Files containing placeholders:**
- [checkout.php](checkout.php)
- [config.sample.php](config.sample.php) (copy to `/home2/yeqdovmy/brb-private/config.php` on the server)

| Field | Current Value | What to Set |
|-------|--------------|-------------|
| line_items[].price (`TIME_AUDIT_PRICE` in checkout.php) | `price_...` | The Time Audit's Price ID: Stripe Dashboard → Product catalog → Time Audit → Price ID. Sandbox and live have different IDs. |
| `stripe_secret_key` (brb-private/config.php) | empty | Stripe Dashboard → Developers → API keys. Best: create a restricted key with **Checkout Sessions: Write** only. Use the `sk_test_`/`rk_test_` key while testing in the sandbox, then the live one. |
| mode | `payment` | Correct for the one-time $500 audit. A recurring plan (Run & Improve) would need its own session with `subscription`. |
| success_url | `https://businessrunsbetter.com/thanks.html?session_id={CHECKOUT_SESSION_ID}` | Already your real thank-you page. Keep the `{CHECKOUT_SESSION_ID}` template. |
| cancel_url | `https://businessrunsbetter.com/pricing.html` | Already your real pricing page. Change only if you want people sent elsewhere. |

## Configured Parameters

These parameters were configured in Checkout Studio and are already set correctly.

**Files containing these parameters:**
- [checkout.php](checkout.php)

| Parameter | Value |
|-----------|-------|
| ui_mode | hosted_page |
| billing_address_collection | auto |
| phone_number_collection | { enabled: false } |
| automatic_tax | { enabled: false } |
| allow_promotion_codes | false |
| submit_type | auto |
| integration_identifier | hosted_web_0001 |
| origin_context | web |

`payment_method_collection: always` is left out because it only applies to `subscription` mode.

**ui_mode note:** this site calls the Stripe API directly (no Stripe SDK), so it uses your
account's default API version. `hosted_page` is the current value. If Stripe ever rejects it,
the error shows in the server's `error_log`; change it to `hosted` in checkout.php.

Also set: `metadata.product = time_audit`, so `stripe-webhook.php` marks the lead "Audit paid".

## Setup

1. Put the secret key in `/home2/yeqdovmy/brb-private/config.php`:
   `'stripe_secret_key' => 'rk_test_...',`
   Never put it in the website folder or in GitHub.
2. Put the Price ID in `TIME_AUDIT_PRICE` in `checkout.php`, commit, and let the deploy run.
3. The webhook (`stripe-webhook.php`) is already set up and listens for
   `checkout.session.completed`. Its `whsec_` secret must match the mode you're testing in.
4. No dependencies: it uses PHP's built-in curl, the same as the Resend email code.

## New files

- `checkout.php`: creates the Checkout Session and redirects to Stripe.
- `STRIPE_INTEGRATION_TODO.md`: this file.

Changed: `assets/site-config.js` (`stripe.timeAudit` → `/checkout.php`), `brb-lib.php` and
`config.sample.php` (new `stripe_secret_key` setting).

## How it works

1. A visitor clicks "Pay $500" on the homepage or pricing page.
2. The browser goes to `/checkout.php`. That's a plain GET link, so Bluehost's bot check
   passes on its own the way it does for any page.
3. `checkout.php` asks Stripe for a Checkout Session and redirects (303) to Stripe's page.
4. After paying, Stripe sends them to `thanks.html`. If they cancel, they go back to `pricing.html`.
5. Stripe sends `checkout.session.completed` to `stripe-webhook.php`, which records the payment,
   moves the lead to "Audit paid", emails you, and pushes to your phone.

## Testing

In the sandbox (test keys, test Price ID, sandbox `whsec_`):

| Card | Result |
|------|--------|
| 4242 4242 4242 4242 | Succeeds |
| 4000 0025 0000 3155 | Requires 3D Secure |
| 4000 0000 0000 9995 | Declined (insufficient funds) |

Any future expiry, any CVC, any ZIP. After a test payment, check: Event deliveries shows 200,
the email arrives, and the payment appears in `/leads.php`. Then switch all three values back
to live.

## Next steps

- Changing the price: edit the price in Stripe, then update `TIME_AUDIT_PRICE` and `audit_price_cents`.
- Run & Improve (monthly): still uses the contact form. Add a second plan to checkout.php with
  `mode: subscription` and `payment_method_collection: always` when you want it payable online.
- Fulfillment is handled by the webhook plus your follow-up email. Set `auditCalendarUrl` in
  `assets/site-config.js` so the thank-you page offers a booking link right away.

## Resources

- https://support.stripe.com
- https://docs.stripe.com/mcp
