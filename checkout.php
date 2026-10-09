<?php
/**
 * Starts a Stripe Checkout Session for the Time Audit and sends the visitor to
 * Stripe's hosted payment page. The pricing page's "Pay $500" button links here.
 *
 * Needs 'stripe_secret_key' in ../brb-private/config.php and a real Price ID in
 * TIME_AUDIT_PRICE below. Until both are set, visitors go to the contact form instead.
 * Payments are recorded by stripe-webhook.php (checkout.session.completed).
 */

require __DIR__ . '/brb-lib.php';

// Stripe Dashboard → Product catalog → Time Audit → Price ID (starts with price_).
const TIME_AUDIT_PRICE = 'price_...';
const SITE_URL = 'https://businessrunsbetter.com';
// The API version Checkout Studio generated this checkout for.
const STRIPE_VERSION = '2026-09-30.endive';

function fallback(): void {
    header('Location: ' . SITE_URL . '/pricing.html#contact', true, 303);
    exit;
}

$config = brb_config();
$secretKey = (string)($config['stripe_secret_key'] ?? '');
if ($secretKey === '' || TIME_AUDIT_PRICE === 'price_...') {
    fallback();
}

$params = [
    'ui_mode'                    => 'hosted_page',
    'mode'                       => 'payment',
    'billing_address_collection' => 'auto',
    'phone_number_collection'    => ['enabled' => 'false'],
    'automatic_tax'              => ['enabled' => 'false'],
    'allow_promotion_codes'      => 'false',
    'submit_type'                => 'auto',
    'integration_identifier'     => 'hosted_web_0001',
    'origin_context'             => 'web',
    'success_url'                => SITE_URL . '/thanks.html?session_id={CHECKOUT_SESSION_ID}',
    'cancel_url'                 => SITE_URL . '/pricing.html',
    'line_items'                 => [['price' => TIME_AUDIT_PRICE, 'quantity' => 1]],
    // stripe-webhook.php marks the lead "Audit paid" when it sees this.
    'metadata'                   => ['product' => 'time_audit'],
];

$ch = curl_init('https://api.stripe.com/v1/checkout/sessions');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => http_build_query($params),
    CURLOPT_USERPWD        => $secretKey . ':',
    CURLOPT_HTTPHEADER     => ['Stripe-Version: ' . STRIPE_VERSION],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
]);
$resp = curl_exec($ch);
$status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);

$session = json_decode((string)$resp, true);
if ($status !== 200 || empty($session['url'])) {
    error_log('checkout: Stripe returned HTTP ' . $status . ': ' . substr((string)$resp, 0, 300));
    fallback();
}

header('Location: ' . $session['url'], true, 303);
