<?php
/**
 * Shared helpers for contact.php, leads.php and stripe-webhook.php.
 *
 * Private files live OUTSIDE the web root, in ../brb-private/:
 *   config.php     settings and secrets (copy from config.sample.php)
 *   leads.sqlite   the lead database (created automatically)
 *   leads.csv      append-only backup of every website inquiry
 */

if (basename($_SERVER['SCRIPT_FILENAME'] ?? '') === basename(__FILE__)) {
    http_response_code(404);
    exit;
}

const BRB_STATUSES = [
    'new'           => 'New',
    'contacted'     => 'Contacted',
    'call_booked'   => 'Call booked',
    'audit_paid'    => 'Audit paid',
    'proposal_sent' => 'Proposal sent',
    'won'           => 'Won',
    'lost'          => 'Lost',
];
const BRB_OPEN_STATUSES = ['new', 'contacted', 'call_booked', 'audit_paid', 'proposal_sent'];

function brb_private_dir(): string {
    return dirname(__DIR__) . '/brb-private';
}

function brb_config(): array {
    static $config = null;
    if ($config !== null) {
        return $config;
    }
    $defaults = [
        'contact_to'            => 'hello@businessrunsbetter.com',
        'contact_from'          => 'website@businessrunsbetter.com',
        'site_name'             => 'Business Runs Better',
        'admin_password'        => '',
        'stripe_webhook_secret' => '',
        'stripe_audit_link_id'  => '',
        'audit_price_cents'     => 50000,
        'timezone'              => 'America/New_York',
        'auto_reply'            => true,
        'calendar_url'          => '',
        'ntfy_topic'            => '',
        'ntfy_server'           => 'https://ntfy.sh',
    ];
    $file = brb_private_dir() . '/config.php';
    $loaded = is_file($file) ? include $file : [];
    $config = array_merge($defaults, is_array($loaded) ? $loaded : []);
    date_default_timezone_set($config['timezone']);
    return $config;
}

function brb_db(): PDO {
    static $pdo = null;
    if ($pdo) {
        return $pdo;
    }
    $dir = brb_private_dir();
    if (!is_dir($dir)) {
        @mkdir($dir, 0700, true);
    }
    $pdo = new PDO('sqlite:' . $dir . '/leads.sqlite', null, null, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $pdo->exec('PRAGMA foreign_keys = ON');
    $pdo->exec('PRAGMA busy_timeout = 5000');
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS leads (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            created_at      TEXT NOT NULL,
            updated_at      TEXT NOT NULL,
            name            TEXT NOT NULL DEFAULT '',
            email           TEXT NOT NULL DEFAULT '',
            company         TEXT NOT NULL DEFAULT '',
            phone           TEXT NOT NULL DEFAULT '',
            source          TEXT NOT NULL DEFAULT 'website',
            interest        TEXT NOT NULL DEFAULT '',
            budget          TEXT NOT NULL DEFAULT '',
            status          TEXT NOT NULL DEFAULT 'new',
            value_cents     INTEGER NOT NULL DEFAULT 0,
            paid_cents      INTEGER NOT NULL DEFAULT 0,
            next_follow_up  TEXT
        );
        CREATE INDEX IF NOT EXISTS leads_email ON leads(email);
        CREATE INDEX IF NOT EXISTS leads_status ON leads(status);
        CREATE TABLE IF NOT EXISTS notes (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            lead_id     INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
            created_at  TEXT NOT NULL,
            kind        TEXT NOT NULL DEFAULT 'note',
            body        TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS notes_lead ON notes(lead_id);
        CREATE TABLE IF NOT EXISTS payments (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            lead_id          INTEGER REFERENCES leads(id) ON DELETE SET NULL,
            stripe_event_id  TEXT NOT NULL UNIQUE,
            created_at       TEXT NOT NULL,
            amount_cents     INTEGER NOT NULL,
            currency         TEXT NOT NULL,
            description      TEXT NOT NULL DEFAULT ''
        );
    ");
    return $pdo;
}

function brb_now(): string {
    return date('Y-m-d H:i:s');
}

function brb_add_note(int $leadId, string $body, string $kind = 'note'): void {
    $db = brb_db();
    $db->prepare('INSERT INTO notes (lead_id, created_at, kind, body) VALUES (?, ?, ?, ?)')
       ->execute([$leadId, brb_now(), $kind, $body]);
    $db->prepare('UPDATE leads SET updated_at = ? WHERE id = ?')->execute([brb_now(), $leadId]);
}

function brb_find_lead_by_email(string $email): ?array {
    if ($email === '') {
        return null;
    }
    $stmt = brb_db()->prepare('SELECT * FROM leads WHERE lower(email) = lower(?) ORDER BY id DESC LIMIT 1');
    $stmt->execute([$email]);
    return $stmt->fetch() ?: null;
}

/**
 * Insert a lead, or attach to the existing lead with the same email.
 * Returns [lead id, whether it was newly created].
 */
function brb_upsert_lead(array $f, string $source, string $noteBody, string $noteKind = 'inquiry'): array {
    $db = brb_db();
    $existing = brb_find_lead_by_email($f['email'] ?? '');
    if ($existing) {
        $id = (int)$existing['id'];
        // Fill gaps without overwriting anything already recorded.
        foreach (['name', 'company', 'phone', 'interest', 'budget'] as $col) {
            if (($existing[$col] ?? '') === '' && ($f[$col] ?? '') !== '') {
                $db->prepare("UPDATE leads SET $col = ? WHERE id = ?")->execute([$f[$col], $id]);
            }
        }
        // Put a returning lead back on today's follow-up list.
        $db->prepare("UPDATE leads SET next_follow_up = ? WHERE id = ?")->execute([date('Y-m-d'), $id]);
        brb_add_note($id, $noteBody, $noteKind);
        return [$id, false];
    }
    $now = brb_now();
    $db->prepare('
        INSERT INTO leads (created_at, updated_at, name, email, company, phone, source, interest, budget, status, next_follow_up)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ')->execute([
        $now, $now,
        $f['name'] ?? '', $f['email'] ?? '', $f['company'] ?? '', $f['phone'] ?? '',
        $source, $f['interest'] ?? '', $f['budget'] ?? '', 'new', date('Y-m-d'),
    ]);
    $id = (int)$db->lastInsertId();
    if ($noteBody !== '') {
        brb_add_note($id, $noteBody, $noteKind);
    }
    return [$id, true];
}

function brb_mail(string $subject, string $body, string $replyName = '', string $replyEmail = ''): bool {
    $c = brb_config();
    $headers = [
        'From: ' . $c['site_name'] . ' <' . $c['contact_from'] . '>',
        'Content-Type: text/plain; charset=UTF-8',
    ];
    if ($replyEmail !== '' && filter_var($replyEmail, FILTER_VALIDATE_EMAIL)) {
        $headers[] = 'Reply-To: "' . str_replace(['"', '\\', "\r", "\n"], '', $replyName) . '" <' . $replyEmail . '>';
    }
    $ok = @mail(
        $c['contact_to'],
        '=?UTF-8?B?' . base64_encode($subject) . '?=',
        $body,
        implode("\r\n", $headers),
        '-f' . $c['contact_from']
    );
    if (!$ok) {
        error_log('brb_mail: mail() failed for "' . $subject . '"');
    }
    return $ok;
}

/**
 * Push notification to your phone via ntfy (https://ntfy.sh, free and open source).
 * Install the ntfy app, subscribe to your topic, and put the same topic in config.
 * Never blocks the request for more than a few seconds and never throws.
 */
function brb_notify_phone(string $title, string $message, string $clickUrl = '', string $priority = 'default'): void {
    $config = brb_config();
    $topic = (string)$config['ntfy_topic'];
    if ($topic === '' || !preg_match('/^[A-Za-z0-9_-]{8,64}$/', $topic)) {
        return;
    }
    $headers = [
        'Content-Type: text/plain; charset=utf-8',
        // HTTP headers must be plain ASCII; ntfy reads RFC 2047 encoded titles.
        'Title: =?UTF-8?B?' . base64_encode($title) . '?=',
        'Priority: ' . $priority,
        'Tags: briefcase',
    ];
    if ($clickUrl !== '') {
        $headers[] = 'Click: ' . $clickUrl;
    }
    $ctx = stream_context_create(['http' => [
        'method' => 'POST', 'header' => implode("\r\n", $headers), 'content' => mb_substr($message, 0, 3000),
        'timeout' => 4, 'ignore_errors' => true,
    ]]);
    if (@file_get_contents(rtrim($config['ntfy_server'], '/') . '/' . $topic, false, $ctx) === false) {
        error_log('brb_notify_phone: push failed');
    }
}

/** Instant "got your message" email to the person who filled in the form. */
function brb_auto_reply(string $name, string $email, string $interest): void {
    $c = brb_config();
    if (!$c['auto_reply'] || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return;
    }
    $first = trim(explode(' ', trim($name))[0] ?? '');
    $lines = [
        'Hi' . ($first !== '' ? " $first" : '') . ',',
        '',
        'Thanks for reaching out to Business Runs Better. I got your message and will reply personally within one business day.',
    ];
    if ($c['calendar_url'] !== '') {
        $lines[] = '';
        $lines[] = 'If you would rather grab a time now, book a free 20-minute call here:';
        $lines[] = $c['calendar_url'];
    }
    $lines = array_merge($lines, ['', 'Talk soon,', 'Mike Cavallo', 'Business Runs Better', 'https://businessrunsbetter.com']);
    $headers = [
        'From: Mike Cavallo <' . $c['contact_from'] . '>',
        'Reply-To: ' . $c['contact_to'],
        'Content-Type: text/plain; charset=UTF-8',
        'Auto-Submitted: auto-replied',
    ];
    $subject = 'Got your message' . ($interest !== '' ? " ($interest)" : '');
    if (!@mail($email, '=?UTF-8?B?' . base64_encode($subject) . '?=', implode("\n", $lines), implode("\r\n", $headers), '-f' . $c['contact_from'])) {
        error_log('brb_auto_reply: mail() failed');
    }
}

function brb_money(int $cents): string {
    return '$' . number_format($cents / 100, $cents % 100 ? 2 : 0);
}

function h(?string $s): string {
    return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
}
