<?php
/**
 * Starts a Stripe Checkout Session for the Time Audit and sends the visitor to
 * Stripe's hosted payment page. The pricing page's "Pay $500" button links here.
 *
 * Needs 'stripe_secret_key' in ../brb-private/config.php. Until it is set, visitors go
 * to the contact form instead. The amount comes from 'audit_price_cents' (default $500).
 * The session itself is built in brb-lib.php (brb_audit_checkout); /leads.php?check=1
 * tests it. Payments are recorded by stripe-webhook.php (checkout.session.completed).
 */

require __DIR__ . '/brb-lib.php';

const SITE_URL = 'https://businessrunsbetter.com';

$result = brb_audit_checkout();
if ($result['url'] === '') {
    if ($result['error'] !== '') {
        error_log('checkout: ' . $result['error']);
    }
    header('Location: ' . SITE_URL . '/pricing.html#contact', true, 303);
    exit;
}
header('Location: ' . $result['url'], true, 303);
