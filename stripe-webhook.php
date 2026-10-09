<?php
/**
 * Stripe webhook: records payments in the lead tracker and emails you.
 *
 * Setup (Stripe Dashboard → Developers → Webhooks → Add endpoint):
 *   URL:     https://businessrunsbetter.com/stripe-webhook.php
 *   Events:  checkout.session.completed, invoice.paid
 * Then copy the endpoint's signing secret (whsec_...) into
 * ../brb-private/config.php as 'stripe_webhook_secret'.
 *
 * This script only needs the signing secret. (checkout.php uses the API key.)
 */

require __DIR__ . '/brb-lib.php';

const SIGNATURE_TOLERANCE = 300; // seconds

function done(int $status, string $msg): void {
    http_response_code($status);
    header('Content-Type: text/plain');
    echo $msg;
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    done(405, 'Method not allowed');
}

$config = brb_config();
$secret = (string)$config['stripe_webhook_secret'];
if ($secret === '') {
    error_log('stripe-webhook: stripe_webhook_secret is not configured');
    done(500, 'Not configured');
}

$payload = file_get_contents('php://input') ?: '';
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

// Verify Stripe's signature: header is "t=TIMESTAMP,v1=SIG[,v1=SIG...]",
// SIG = HMAC-SHA256(secret, "TIMESTAMP.PAYLOAD").
$timestamp = null;
$signatures = [];
foreach (explode(',', $sigHeader) as $part) {
    [$k, $v] = array_pad(explode('=', trim($part), 2), 2, '');
    if ($k === 't') {
        $timestamp = (int)$v;
    } elseif ($k === 'v1') {
        $signatures[] = $v;
    }
}
if (!$timestamp || !$signatures || abs(time() - $timestamp) > SIGNATURE_TOLERANCE) {
    done(400, 'Bad signature header');
}
$expected = hash_hmac('sha256', $timestamp . '.' . $payload, $secret);
$valid = false;
foreach ($signatures as $sig) {
    if (hash_equals($expected, $sig)) {
        $valid = true;
        break;
    }
}
if (!$valid) {
    done(400, 'Signature mismatch');
}

$event = json_decode($payload, true);
if (!is_array($event) || empty($event['id']) || empty($event['type'])) {
    done(400, 'Bad payload');
}

$type = $event['type'];
$obj = $event['data']['object'] ?? [];

if ($type === 'checkout.session.completed') {
    if (($obj['payment_status'] ?? '') !== 'paid') {
        done(200, 'Ignored: not paid yet');
    }
    // A subscription checkout is also reported as invoice.paid; record it once, there.
    if (($obj['mode'] ?? '') === 'subscription') {
        done(200, 'Ignored: recorded via invoice.paid');
    }
    $email    = (string)($obj['customer_details']['email'] ?? $obj['customer_email'] ?? '');
    $name     = (string)($obj['customer_details']['name'] ?? '');
    $phone    = (string)($obj['customer_details']['phone'] ?? '');
    $amount   = (int)($obj['amount_total'] ?? 0);
    $currency = (string)($obj['currency'] ?? 'usd');
    $product  = (string)($obj['metadata']['product'] ?? '');
} elseif ($type === 'invoice.paid') {
    $email    = (string)($obj['customer_email'] ?? '');
    $name     = (string)($obj['customer_name'] ?? '');
    $phone    = (string)($obj['customer_phone'] ?? '');
    $amount   = (int)($obj['amount_paid'] ?? 0);
    $currency = (string)($obj['currency'] ?? 'usd');
    $product  = (string)($obj['lines']['data'][0]['description'] ?? '');
    if ($amount === 0) {
        done(200, 'Ignored: zero-amount invoice');
    }
} else {
    done(200, 'Ignored event type');
}

// Identify the Time Audit by metadata (product=time_audit on the Payment Link),
// by its Payment Link id from config, or by its fixed one-time price.
$isAudit = $product === 'time_audit'
    || stripos($product, 'audit') !== false
    || ($config['stripe_audit_link_id'] !== '' && ($obj['payment_link'] ?? '') === $config['stripe_audit_link_id'])
    || ($type === 'checkout.session.completed' && $amount === (int)$config['audit_price_cents']);
$label = $isAudit ? 'Time Audit' : ($product !== '' ? $product : 'Payment');
$description = $label . ($type === 'invoice.paid' ? ' (invoice)' : '');

$db = brb_db();
$db->beginTransaction();
try {
    $stmt = $db->prepare('SELECT 1 FROM payments WHERE stripe_event_id = ?');
    $stmt->execute([$event['id']]);
    if ($stmt->fetchColumn()) {
        $db->rollBack();
        done(200, 'Already recorded');
    }

    $noteBody = sprintf('Paid %s %s via Stripe: %s', brb_money($amount), strtoupper($currency), $description);
    [$leadId] = brb_upsert_lead(
        ['name' => $name ?: $email, 'email' => $email, 'phone' => $phone, 'interest' => $label],
        'stripe',
        $noteBody,
        'payment'
    );

    $db->prepare('INSERT INTO payments (lead_id, stripe_event_id, created_at, amount_cents, currency, description) VALUES (?, ?, ?, ?, ?, ?)')
       ->execute([$leadId, $event['id'], brb_now(), $amount, $currency, $description]);
    $db->prepare('UPDATE leads SET paid_cents = paid_cents + ? WHERE id = ?')->execute([$amount, $leadId]);

    // Move the lead forward, never backward.
    $lead = $db->query('SELECT status FROM leads WHERE id = ' . (int)$leadId)->fetch();
    $order = array_keys(BRB_STATUSES);
    $target = $isAudit ? 'audit_paid' : 'won';
    if (array_search($lead['status'], $order, true) < array_search($target, $order, true) || $lead['status'] === 'lost') {
        $db->prepare('UPDATE leads SET status = ? WHERE id = ?')->execute([$target, $leadId]);
        brb_add_note($leadId, 'Status: ' . (BRB_STATUSES[$lead['status']] ?? $lead['status']) . ' → ' . BRB_STATUSES[$target], 'status');
    }
    if ($isAudit) {
        // Schedule the audit call right away.
        $db->prepare('UPDATE leads SET next_follow_up = ? WHERE id = ?')->execute([date('Y-m-d'), $leadId]);
    }
    $db->commit();
} catch (Throwable $e) {
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    error_log('stripe-webhook: ' . $e->getMessage());
    done(500, 'Could not record payment'); // Stripe retries on 5xx
}

$host = $_SERVER['HTTP_HOST'] ?? 'businessrunsbetter.com';
brb_mail(
    sprintf('Payment received: %s from %s', brb_money($amount), $name ?: $email),
    implode("\n", [
        $noteBody,
        '',
        'Name:  ' . ($name ?: '-'),
        'Email: ' . ($email ?: '-'),
        'Phone: ' . ($phone ?: '-'),
        '',
        $isAudit ? 'Next step: email them to schedule the 90-minute audit.' : '',
        "Lead: https://$host/leads.php?id=$leadId",
    ]),
    $name,
    $email
);

brb_notify_phone(
    'Paid ' . brb_money($amount) . ': ' . ($name ?: $email),
    $description,
    "https://$host/leads.php?id=$leadId",
    'high'
);

done(200, 'Recorded');
