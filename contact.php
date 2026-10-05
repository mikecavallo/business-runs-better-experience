<?php
/**
 * Contact form handler for businessrunsbetter.com (any PHP host, e.g. Bluehost).
 *
 * - Emails each inquiry to CONTACT_TO with Reply-To set to the visitor.
 * - Appends every inquiry to a CSV one level ABOVE the web root, so a lead is
 *   never lost if mail delivery fails.
 * - Spam protection: hidden honeypot field, minimum fill time, per-IP rate limit.
 *
 * Responds with JSON for fetch() requests and redirects for plain form posts.
 */

// ---- Configuration -------------------------------------------------------
// Inbox that receives inquiries. Use one you actually check.
const CONTACT_TO   = 'hello@businessrunsbetter.com';
// Sender address. Must be on this domain or SPF/DMARC will junk the mail.
const CONTACT_FROM = 'website@businessrunsbetter.com';
const SITE_NAME    = 'Business Runs Better';
const MIN_FILL_SECONDS = 3;
const MAX_PER_HOUR     = 5;
// --------------------------------------------------------------------------

header('X-Content-Type-Options: nosniff');

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

$name     = field('name', 120);
$email    = field('email', 200);
$company  = field('company', 160);
$phone    = field('phone', 40);
$interest = field('interest', 80);
$budget   = field('budget', 40);
$message  = field('message', 5000);

if ($name === '' || $message === '' || $interest === '') {
    respond(false, 'Please fill in your name, what you need help with, and a short message.', 422);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
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
    respond(false, 'Too many messages from this connection. Please email ' . CONTACT_TO . ' directly.', 429);
}
$hits[] = $now;
@file_put_contents($rateFile, implode("\n", $hits));

// Always keep a copy, outside the public web root.
$logFile = dirname(__DIR__) . '/brb-leads.csv';
$isNew = !file_exists($logFile);
if ($fh = @fopen($logFile, 'a')) {
    if ($isNew) {
        fputcsv($fh, ['received', 'name', 'email', 'company', 'phone', 'interest', 'budget', 'message', 'ip']);
    }
    fputcsv($fh, [date('c'), $name, $email, $company, $phone, $interest, $budget, $message, $ip]);
    fclose($fh);
}

$subject = sprintf('New %s inquiry: %s (%s)', SITE_NAME, $interest, $name);
$body = implode("\n", [
    "Name:     $name",
    "Email:    $email",
    "Business: " . ($company ?: '-'),
    "Phone:    " . ($phone ?: '-'),
    "Interest: $interest",
    "Budget:   " . ($budget ?: 'Not sure yet'),
    '',
    $message,
    '',
    '--',
    'Sent from the contact form on ' . ($_SERVER['HTTP_HOST'] ?? 'the website') . ' at ' . date('Y-m-d H:i T'),
]);
$headers = implode("\r\n", [
    'From: ' . SITE_NAME . ' <' . CONTACT_FROM . '>',
    'Reply-To: "' . str_replace(['"', '\\'], '', $name) . '" <' . $email . '>',
    'Content-Type: text/plain; charset=UTF-8',
]);

$sent = @mail(CONTACT_TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers, '-f' . CONTACT_FROM);

// The lead is already saved to the CSV, so report success even if mail() failed,
// but log the failure for the host's error log.
if (!$sent) {
    error_log('contact.php: mail() failed for inquiry from ' . $email);
}
respond(true);
