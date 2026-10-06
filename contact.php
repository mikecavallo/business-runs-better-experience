<?php
/**
 * Contact form handler for businessrunsbetter.com (any PHP host, e.g. Bluehost).
 *
 * - Saves each inquiry to the lead tracker (leads.php). A repeat inquiry from
 *   the same email is attached to the existing lead instead of duplicating it.
 * - Emails it to contact_to (see ../brb-private/config.php) with Reply-To set
 *   to the visitor.
 * - Appends it to ../brb-private/leads.csv as a last-resort backup.
 * - Spam protection: hidden honeypot field, minimum fill time, per-IP rate limit.
 *
 * Responds with JSON for fetch() requests and redirects for plain form posts.
 */

require __DIR__ . '/brb-lib.php';

const MIN_FILL_SECONDS = 3;
const MAX_PER_HOUR     = 5;

header('X-Content-Type-Options: nosniff');

$config = brb_config();
$wantsJson = stripos($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json') !== false;

function respond(bool $ok, string $error = '', int $status = 200): void {
    global $wantsJson;
    http_response_code($status);
    if ($wantsJson) {
        header('Content-Type: application/json');
        echo json_encode($ok ? ['ok' => true] : ['ok' => false, 'error' => $error]);
    } else {
        header('Location: /?' . ($ok ? 'sent=1' : 'error=' . rawurlencode($error)));
    }
    exit;
}

function field(string $key, int $max): string {
    $v = trim((string)($_POST[$key] ?? ''));
    // Strip control characters (blocks header injection) but keep newlines in the message.
    $v = preg_replace($key === 'message' ? '/[^\P{C}\n]/u' : '/\p{C}/u', '', $v) ?? '';
    return mb_substr($v, 0, $max);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(false, 'Method not allowed.', 405);
}

// Honeypot: real visitors never see or fill this. Pretend success to bots.
if (!empty($_POST['website'])) {
    respond(true);
}

// Bots submit instantly; people take a few seconds.
$started = (int)($_POST['started'] ?? 0);
if ($started > 0 && (microtime(true) * 1000 - $started) < MIN_FILL_SECONDS * 1000) {
    respond(true);
}

$lead = [
    'name'     => field('name', 120),
    'email'    => field('email', 200),
    'company'  => field('company', 160),
    'phone'    => field('phone', 40),
    'interest' => field('interest', 80),
    'budget'   => field('budget', 40),
];
$message = field('message', 5000);

if ($lead['name'] === '' || $message === '' || $lead['interest'] === '') {
    respond(false, 'Please fill in your name, what you need help with, and a short message.', 422);
}
if (!filter_var($lead['email'], FILTER_VALIDATE_EMAIL)) {
    respond(false, 'That email address doesn\'t look right.', 422);
}

// Simple per-IP rate limit using the system temp dir.
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = sys_get_temp_dir() . '/brb_contact_' . md5($ip);
$now = time();
$hits = array_filter(
    array_map('intval', @file($rateFile, FILE_IGNORE_NEW_LINES) ?: []),
    fn($t) => $t > $now - 3600
);
if (count($hits) >= MAX_PER_HOUR) {
    respond(false, 'Too many messages from this connection. Please email ' . $config['contact_to'] . ' directly.', 429);
}
$hits[] = $now;
@file_put_contents($rateFile, implode("\n", $hits));

// 1. CSV backup first: plain append, nothing to go wrong.
$csv = brb_private_dir() . '/leads.csv';
if (!is_dir(dirname($csv))) {
    @mkdir(dirname($csv), 0700, true);
}
$isNew = !file_exists($csv);
if ($fh = @fopen($csv, 'a')) {
    if ($isNew) {
        fputcsv($fh, ['received', 'name', 'email', 'company', 'phone', 'interest', 'budget', 'message', 'ip']);
    }
    fputcsv($fh, [date('c'), ...array_values($lead), $message, $ip]);
    fclose($fh);
}

// 2. Lead tracker.
$noteBody = "Website inquiry ({$lead['interest']}" . ($lead['budget'] ? ", budget {$lead['budget']}" : '') . "):\n\n$message";
$leadId = null;
try {
    [$leadId] = brb_upsert_lead($lead, 'website', $noteBody, 'inquiry');
} catch (Throwable $e) {
    error_log('contact.php: could not save lead: ' . $e->getMessage());
}

// 3. Email notification.
$host = $_SERVER['HTTP_HOST'] ?? 'businessrunsbetter.com';
$body = implode("\n", [
    "Name:     {$lead['name']}",
    "Email:    {$lead['email']}",
    'Business: ' . ($lead['company'] ?: '-'),
    'Phone:    ' . ($lead['phone'] ?: '-'),
    "Interest: {$lead['interest']}",
    'Budget:   ' . ($lead['budget'] ?: 'Not sure yet'),
    '',
    $message,
    '',
    '--',
    $leadId ? "Open in lead tracker: https://$host/leads.php?id=$leadId" : 'Lead tracker save failed; see leads.csv.',
]);
brb_mail(
    sprintf('New %s inquiry: %s (%s)', $config['site_name'], $lead['interest'], $lead['name']),
    $body,
    $lead['name'],
    $lead['email']
);

// The lead is saved, so report success even if mail() failed.
respond(true);
