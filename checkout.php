<?php
/**
 * Starts a Stripe Checkout Session for the Time Audit and sends the visitor to
 * Stripe's hosted payment page.
 *
 * Only a POST starts a session, so crawlers and link previews that fetch this URL never
 * create one. A plain visit (GET) gets a one-button page that posts back here. With
 * JavaScript on, the site's Time Audit buttons use the Stripe Payment Link from
 * assets/site-config.js when one is set, or the contact form, and never reach this file.
 *
 * Needs 'stripe_secret_key' in ../brb-private/config.php. Until it is set, visitors go
 * to the contact form instead. The amount comes from 'audit_price_cents' (default $500).
 * The session itself is built in brb-lib.php (brb_audit_checkout); /leads.php?check=1
 * tests it. Payments are recorded by stripe-webhook.php (checkout.session.completed).
 */

require __DIR__ . '/brb-lib.php';

const SITE_URL = 'https://businessrunsbetter.com';

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Content-Type: text/html; charset=utf-8');
    echo <<<'HTML'
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Time Audit checkout | Business Runs Better</title>
<link rel="stylesheet" href="/assets/page.css?v=3">
<link rel="stylesheet" href="/assets/panel.css?v=5">
</head>
<body class="pg">
<main class="pg-main">
  <div class="panel"><div class="panel-well"><div class="panel-scroll"><article class="panel-content">
    <section>
      <h1>The $500 Time Audit</h1>
      <p class="pc-lede">Payment is handled by Stripe. I'll reach out within one business day to schedule your 90-minute walkthrough.</p>
      <form class="pc-actions" method="post" action="/checkout.php">
        <button class="pc-btn" type="submit">Continue to secure checkout</button>
        <a class="pc-link" href="/pricing.html">Back to pricing</a>
      </form>
    </section>
  </article></div></div></div>
</main>
</body>
</html>
HTML;
    exit;
}

$result = brb_audit_checkout();
if ($result['url'] === '') {
    if ($result['error'] !== '') {
        error_log('checkout: ' . $result['error']);
    }
    header('Location: ' . SITE_URL . '/pricing.html#contact', true, 303);
    exit;
}
header('Location: ' . $result['url'], true, 303);
