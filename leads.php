<?php
/**
 * Private lead tracker for Business Runs Better.
 *
 * Password lives in ../brb-private/config.php ('admin_password').
 * Data lives in ../brb-private/leads.sqlite. Nothing here is public.
 */

require __DIR__ . '/brb-lib.php';

header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
header('X-Frame-Options: DENY');
header('X-Content-Type-Options: nosniff');
header("Content-Security-Policy: default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'unsafe-inline'; img-src 'self' data:; form-action 'self'; frame-ancestors 'none'");

$config = brb_config();
$https = ($_SERVER['HTTPS'] ?? '') === 'on' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
session_name('brb_admin');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict']);
session_start();

const LOGIN_MAX_FAILS = 5;
const LOGIN_LOCK_SECONDS = 900;

function csrf_token(): string {
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(16));
    }
    return $_SESSION['csrf'];
}
function csrf_field(): string {
    return '<input type="hidden" name="csrf" value="' . csrf_token() . '">';
}
function check_csrf(): void {
    if (!hash_equals(csrf_token(), (string)($_POST['csrf'] ?? ''))) {
        http_response_code(400);
        exit('Session expired. Go back and reload the page.');
    }
}
function redirect(string $to): void {
    header('Location: ' . $to);
    exit;
}
function flash(?string $msg = null): ?string {
    if ($msg !== null) {
        $_SESSION['flash'] = $msg;
        return null;
    }
    $m = $_SESSION['flash'] ?? null;
    unset($_SESSION['flash']);
    return $m;
}
function post(string $k, int $max = 500): string {
    return mb_substr(trim((string)($_POST[$k] ?? '')), 0, $max);
}
function dollars_to_cents(string $v): int {
    $v = preg_replace('/[^0-9.]/', '', $v);
    return $v === '' ? 0 : (int)round((float)$v * 100);
}
function valid_date(string $d): ?string {
    return preg_match('/^\d{4}-\d{2}-\d{2}$/', $d) ? $d : null;
}

// ---------------------------------------------------------------- auth
$password = (string)$config['admin_password'];
$setupNeeded = mb_strlen($password) < 12;
$lockFile = sys_get_temp_dir() . '/brb_login_' . md5($_SERVER['REMOTE_ADDR'] ?? '');
$authed = !empty($_SESSION['authed']);
$loginError = '';

if (!$setupNeeded && ($_POST['action'] ?? '') === 'login') {
    check_csrf();
    $fails = array_filter(array_map('intval', @file($lockFile, FILE_IGNORE_NEW_LINES) ?: []),
        fn($t) => $t > time() - LOGIN_LOCK_SECONDS);
    if (count($fails) >= LOGIN_MAX_FAILS) {
        $loginError = 'Too many attempts. Try again in 15 minutes.';
    } elseif (hash_equals($password, (string)($_POST['password'] ?? ''))) {
        session_regenerate_id(true);
        $_SESSION['authed'] = true;
        @unlink($lockFile);
        redirect('leads.php');
    } else {
        $fails[] = time();
        @file_put_contents($lockFile, implode("\n", $fails));
        sleep(1);
        $loginError = 'Wrong password.';
    }
}

if (!$authed) {
    page_start('Sign in');
    if ($setupNeeded) {
        echo '<div class="card narrow"><h1>Lead tracker setup</h1>
            <p>Set a password of at least 12 characters before using this page:</p>
            <ol>
              <li>In cPanel File Manager, open the folder <b>above</b> <code>public_html</code>.</li>
              <li>Create a folder named <code>brb-private</code> if it isn\'t there.</li>
              <li>Upload <code>config.sample.php</code> into it, rename it to <code>config.php</code>, and set <code>admin_password</code>.</li>
            </ol></div>';
    } else {
        echo '<form class="card narrow" method="post">' . csrf_field() . '
            <h1>Leads</h1>
            <input type="hidden" name="action" value="login">
            <label>Password<input type="password" name="password" autocomplete="current-password" autofocus required></label>
            ' . ($loginError ? '<p class="error">' . h($loginError) . '</p>' : '') . '
            <button class="btn primary">Sign in</button></form>';
    }
    page_end();
    exit;
}

// ---------------------------------------------------------------- actions
$db = brb_db();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    check_csrf();
    $action = $_POST['action'] ?? '';
    $id = (int)($_POST['id'] ?? 0);

    if ($action === 'logout') {
        $_SESSION = [];
        session_destroy();
        redirect('leads.php');
    }

    if ($action === 'create') {
        $name = post('name', 120);
        if ($name === '') {
            flash('A lead needs at least a name.');
            redirect('leads.php');
        }
        $now = brb_now();
        $db->prepare('INSERT INTO leads (created_at, updated_at, name, email, company, phone, source, interest, status, value_cents, next_follow_up)
                      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
           ->execute([$now, $now, $name, post('email', 200), post('company', 160), post('phone', 40),
                      post('source', 40) ?: 'manual', post('interest', 80), 'new',
                      dollars_to_cents(post('value', 20)), valid_date(post('next_follow_up', 10)) ?? date('Y-m-d')]);
        $newId = (int)$db->lastInsertId();
        if (($note = post('note', 5000)) !== '') {
            brb_add_note($newId, $note);
        }
        flash('Lead added.');
        redirect('leads.php?id=' . $newId);
    }

    $lead = $id ? $db->query('SELECT * FROM leads WHERE id = ' . $id)->fetch() : null;
    if (!$lead) {
        flash('That lead no longer exists.');
        redirect('leads.php');
    }

    if ($action === 'update') {
        $status = array_key_exists($_POST['status'] ?? '', BRB_STATUSES) ? $_POST['status'] : $lead['status'];
        $followUp = valid_date(post('next_follow_up', 10));
        $db->prepare('UPDATE leads SET name = ?, email = ?, company = ?, phone = ?, interest = ?, budget = ?,
                      status = ?, value_cents = ?, next_follow_up = ?, updated_at = ? WHERE id = ?')
           ->execute([post('name', 120), post('email', 200), post('company', 160), post('phone', 40),
                      post('interest', 80), post('budget', 40), $status, dollars_to_cents(post('value', 20)),
                      $followUp, brb_now(), $id]);
        if ($status !== $lead['status']) {
            brb_add_note($id, 'Status: ' . BRB_STATUSES[$lead['status']] . ' → ' . BRB_STATUSES[$status], 'status');
        }
        flash('Saved.');
    } elseif ($action === 'note') {
        if (($note = post('note', 5000)) !== '') {
            brb_add_note($id, $note);
            flash('Note added.');
        }
    } elseif ($action === 'touch') {
        // "I just contacted them": log it, move New → Contacted, schedule the next follow-up.
        $days = max(1, min(60, (int)($_POST['days'] ?? 3)));
        $next = date('Y-m-d', strtotime("+$days days"));
        $newStatus = $lead['status'] === 'new' ? 'contacted' : $lead['status'];
        $db->prepare('UPDATE leads SET status = ?, next_follow_up = ?, updated_at = ? WHERE id = ?')
           ->execute([$newStatus, $next, brb_now(), $id]);
        brb_add_note($id, 'Contacted. Next follow-up ' . date('D M j', strtotime($next)) . '.', 'status');
        flash("Logged. Follow up again in $days days.");
    } elseif ($action === 'delete') {
        $db->prepare('DELETE FROM leads WHERE id = ?')->execute([$id]);
        flash('Lead deleted.');
        redirect('leads.php');
    }
    redirect('leads.php?id=' . $id);
}

// ---------------------------------------------------------------- export
if (isset($_GET['export'])) {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="leads-' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, ['id', 'created', 'name', 'email', 'company', 'phone', 'source', 'interest', 'budget',
                   'status', 'value', 'paid', 'next_follow_up', 'notes']);
    $notes = $db->prepare("SELECT group_concat(created_at || ': ' || body, char(10)) FROM notes WHERE lead_id = ? ORDER BY id");
    foreach ($db->query('SELECT * FROM leads ORDER BY id') as $r) {
        $notes->execute([$r['id']]);
        fputcsv($out, [$r['id'], $r['created_at'], $r['name'], $r['email'], $r['company'], $r['phone'],
                       $r['source'], $r['interest'], $r['budget'], BRB_STATUSES[$r['status']] ?? $r['status'],
                       $r['value_cents'] / 100, $r['paid_cents'] / 100, $r['next_follow_up'], $notes->fetchColumn()]);
    }
    exit;
}

// ---------------------------------------------------------------- views
$today = date('Y-m-d');
$openIn = "'" . implode("','", BRB_OPEN_STATUSES) . "'";

if (isset($_GET['id'])) {
    $lead = $db->query('SELECT * FROM leads WHERE id = ' . (int)$_GET['id'])->fetch();
    if (!$lead) {
        flash('That lead no longer exists.');
        redirect('leads.php');
    }
    $stmt = $db->prepare('SELECT * FROM notes WHERE lead_id = ? ORDER BY id DESC');
    $stmt->execute([$lead['id']]);
    $notes = $stmt->fetchAll();
    $stmt = $db->prepare('SELECT * FROM payments WHERE lead_id = ? ORDER BY id DESC');
    $stmt->execute([$lead['id']]);
    $payments = $stmt->fetchAll();

    page_start($lead['name'] ?: 'Lead');
    topbar();
    $due = $lead['next_follow_up'] && $lead['next_follow_up'] <= $today && in_array($lead['status'], BRB_OPEN_STATUSES, true);
    ?>
    <p><a href="leads.php">← All leads</a></p>
    <div class="detail">
      <div>
        <div class="card">
          <div class="lead-head">
            <div>
              <h1><?= h($lead['name']) ?></h1>
              <p class="muted"><?= h($lead['company']) ?><?= $lead['company'] ? ' · ' : '' ?>from <?= h($lead['source']) ?> · added <?= h(date('M j, Y', strtotime($lead['created_at']))) ?></p>
            </div>
            <span class="pill s-<?= h($lead['status']) ?>"><?= h(BRB_STATUSES[$lead['status']] ?? $lead['status']) ?></span>
          </div>
          <p class="contact-links">
            <?php if ($lead['email']): ?><a class="btn" href="mailto:<?= h($lead['email']) ?>">Email <?= h($lead['email']) ?></a><?php endif; ?>
            <?php if ($lead['phone']): ?><a class="btn" href="tel:<?= h(preg_replace('/[^0-9+]/', '', $lead['phone'])) ?>">Call <?= h($lead['phone']) ?></a><?php endif; ?>
          </p>
          <?php if ($due): ?><p class="due-banner">Follow-up due<?= $lead['next_follow_up'] < $today ? ' (overdue since ' . h(date('M j', strtotime($lead['next_follow_up']))) . ')' : ' today' ?>.</p><?php endif; ?>
          <form method="post" class="touch">
            <?= csrf_field() ?><input type="hidden" name="action" value="touch"><input type="hidden" name="id" value="<?= (int)$lead['id'] ?>">
            <span>Just contacted them? Follow up again in</span>
            <?php foreach ([2, 3, 7, 14] as $d): ?><button class="btn small" name="days" value="<?= $d ?>"><?= $d ?> days</button><?php endforeach; ?>
          </form>
        </div>

        <form method="post" class="card grid">
          <?= csrf_field() ?><input type="hidden" name="action" value="update"><input type="hidden" name="id" value="<?= (int)$lead['id'] ?>">
          <label>Name<input name="name" value="<?= h($lead['name']) ?>" required></label>
          <label>Business<input name="company" value="<?= h($lead['company']) ?>"></label>
          <label>Email<input name="email" type="email" value="<?= h($lead['email']) ?>"></label>
          <label>Phone<input name="phone" value="<?= h($lead['phone']) ?>"></label>
          <label>Interested in<input name="interest" value="<?= h($lead['interest']) ?>"></label>
          <label>Budget<input name="budget" value="<?= h($lead['budget']) ?>"></label>
          <label>Status<select name="status"><?php foreach (BRB_STATUSES as $k => $v): ?><option value="<?= $k ?>"<?= $k === $lead['status'] ? ' selected' : '' ?>><?= $v ?></option><?php endforeach; ?></select></label>
          <label>Deal value ($)<input name="value" inputmode="decimal" value="<?= $lead['value_cents'] ? h(number_format($lead['value_cents'] / 100, 2, '.', '')) : '' ?>" placeholder="0"></label>
          <label>Next follow-up<input name="next_follow_up" type="date" value="<?= h($lead['next_follow_up']) ?>"></label>
          <label>Paid so far<input value="<?= h(brb_money((int)$lead['paid_cents'])) ?>" disabled></label>
          <div class="full actions"><button class="btn primary">Save changes</button></div>
        </form>

        <?php if ($payments): ?>
        <div class="card"><h2>Payments</h2><table>
          <?php foreach ($payments as $p): ?><tr><td><?= h(date('M j, Y', strtotime($p['created_at']))) ?></td><td><?= h($p['description']) ?></td><td class="num"><?= h(brb_money((int)$p['amount_cents'])) ?> <?= h(strtoupper($p['currency'])) ?></td></tr><?php endforeach; ?>
        </table></div>
        <?php endif; ?>

        <form method="post" class="card danger-zone" onsubmit="return confirm('Delete this lead and all its notes? This cannot be undone.')">
          <?= csrf_field() ?><input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="<?= (int)$lead['id'] ?>">
          <button class="btn danger">Delete lead</button>
        </form>
      </div>

      <div class="card">
        <h2>Timeline</h2>
        <form method="post" class="note-form">
          <?= csrf_field() ?><input type="hidden" name="action" value="note"><input type="hidden" name="id" value="<?= (int)$lead['id'] ?>">
          <textarea name="note" rows="3" placeholder="Call notes, what they need, next steps..." required></textarea>
          <button class="btn primary">Add note</button>
        </form>
        <?php foreach ($notes as $n): ?>
          <div class="note k-<?= h($n['kind']) ?>">
            <div class="note-meta"><?= h(ucfirst($n['kind'])) ?> · <?= h(date('M j, Y g:ia', strtotime($n['created_at']))) ?></div>
            <div class="note-body"><?= nl2br(h($n['body'])) ?></div>
          </div>
        <?php endforeach; ?>
        <?php if (!$notes): ?><p class="muted">No notes yet.</p><?php endif; ?>
      </div>
    </div>
    <?php
    page_end();
    exit;
}

// List view
$filter = array_key_exists($_GET['status'] ?? '', BRB_STATUSES) ? $_GET['status'] : (($_GET['status'] ?? '') === 'all' ? 'all' : 'open');
$q = trim((string)($_GET['q'] ?? ''));

$where = [];
$args = [];
if ($filter === 'open') {
    $where[] = "status IN ($openIn)";
} elseif ($filter !== 'all') {
    $where[] = 'status = ?';
    $args[] = $filter;
}
if ($q !== '') {
    $where[] = '(name LIKE ? OR email LIKE ? OR company LIKE ? OR phone LIKE ? OR interest LIKE ?)';
    array_push($args, ...array_fill(0, 5, '%' . $q . '%'));
}
$sql = 'SELECT * FROM leads' . ($where ? ' WHERE ' . implode(' AND ', $where) : '') .
       " ORDER BY (next_follow_up IS NULL), next_follow_up, updated_at DESC LIMIT 500";
$stmt = $db->prepare($sql);
$stmt->execute($args);
$leads = $stmt->fetchAll();

$counts = array_fill_keys(array_keys(BRB_STATUSES), 0);
foreach ($db->query('SELECT status, count(*) c FROM leads GROUP BY status') as $r) {
    $counts[$r['status']] = (int)$r['c'];
}
$openCount = array_sum(array_intersect_key($counts, array_flip(BRB_OPEN_STATUSES)));
$due = $db->query("SELECT * FROM leads WHERE status IN ($openIn) AND next_follow_up IS NOT NULL AND next_follow_up <= '$today' ORDER BY next_follow_up")->fetchAll();
$pipeline = (int)$db->query("SELECT coalesce(sum(value_cents), 0) FROM leads WHERE status IN ($openIn)")->fetchColumn();
$monthStart = date('Y-m-01');
$paidMonth = (int)$db->query("SELECT coalesce(sum(amount_cents), 0) FROM payments WHERE created_at >= '$monthStart'")->fetchColumn();
$newWeek = (int)$db->query("SELECT count(*) FROM leads WHERE created_at >= '" . date('Y-m-d', strtotime('-7 days')) . "'")->fetchColumn();

page_start('Leads');
topbar();
?>
<div class="stats">
  <div class="stat"><span><?= count($due) ?></span>follow-ups due</div>
  <div class="stat"><span><?= $openCount ?></span>open leads</div>
  <div class="stat"><span><?= $newWeek ?></span>new this week</div>
  <div class="stat"><span><?= h(brb_money($pipeline)) ?></span>open pipeline</div>
  <div class="stat"><span><?= h(brb_money($paidMonth)) ?></span>paid this month</div>
</div>

<?php if ($due): ?>
<div class="card due">
  <h2>Follow up today</h2>
  <table>
    <?php foreach ($due as $l): ?>
    <tr onclick="location='leads.php?id=<?= (int)$l['id'] ?>'">
      <td><a href="leads.php?id=<?= (int)$l['id'] ?>"><?= h($l['name']) ?></a><div class="muted"><?= h($l['company']) ?></div></td>
      <td><?= h($l['interest']) ?></td>
      <td><span class="pill s-<?= h($l['status']) ?>"><?= h(BRB_STATUSES[$l['status']]) ?></span></td>
      <td class="num <?= $l['next_follow_up'] < $today ? 'overdue' : '' ?>"><?= $l['next_follow_up'] < $today ? 'Overdue ' . h(date('M j', strtotime($l['next_follow_up']))) : 'Today' ?></td>
    </tr>
    <?php endforeach; ?>
  </table>
</div>
<?php endif; ?>

<div class="toolbar">
  <nav class="tabs">
    <a class="<?= $filter === 'open' ? 'on' : '' ?>" href="?status=open">Open <b><?= $openCount ?></b></a>
    <?php foreach (BRB_STATUSES as $k => $v): ?>
      <a class="<?= $filter === $k ? 'on' : '' ?>" href="?status=<?= $k ?>"><?= $v ?> <b><?= $counts[$k] ?></b></a>
    <?php endforeach; ?>
    <a class="<?= $filter === 'all' ? 'on' : '' ?>" href="?status=all">All</a>
  </nav>
  <form class="search"><input type="hidden" name="status" value="<?= h($filter) ?>"><input name="q" value="<?= h($q) ?>" placeholder="Search name, email, business..."></form>
</div>

<div class="card">
  <?php if ($leads): ?>
  <table class="list">
    <thead><tr><th>Lead</th><th>Interested in</th><th>Status</th><th class="num">Value</th><th class="num">Follow up</th></tr></thead>
    <?php foreach ($leads as $l): $late = $l['next_follow_up'] && $l['next_follow_up'] < $today && in_array($l['status'], BRB_OPEN_STATUSES, true); ?>
    <tr onclick="location='leads.php?id=<?= (int)$l['id'] ?>'">
      <td><a href="leads.php?id=<?= (int)$l['id'] ?>"><?= h($l['name']) ?></a><div class="muted"><?= h($l['company'] ?: $l['email']) ?></div></td>
      <td><?= h($l['interest']) ?></td>
      <td><span class="pill s-<?= h($l['status']) ?>"><?= h(BRB_STATUSES[$l['status']] ?? $l['status']) ?></span></td>
      <td class="num"><?= $l['value_cents'] ? h(brb_money((int)$l['value_cents'])) : '' ?></td>
      <td class="num <?= $late ? 'overdue' : '' ?>"><?= $l['next_follow_up'] ? h(date('M j', strtotime($l['next_follow_up']))) : '' ?></td>
    </tr>
    <?php endforeach; ?>
  </table>
  <?php else: ?>
  <p class="muted empty"><?= $q !== '' || $filter !== 'open' ? 'No leads match.' : 'No open leads yet. Website inquiries and Stripe payments show up here automatically.' ?></p>
  <?php endif; ?>
</div>

<details class="card add">
  <summary>+ Add a lead by hand (phone call, referral, met in person)</summary>
  <form method="post" class="grid">
    <?= csrf_field() ?><input type="hidden" name="action" value="create">
    <label>Name<input name="name" required></label>
    <label>Business<input name="company"></label>
    <label>Email<input name="email" type="email"></label>
    <label>Phone<input name="phone"></label>
    <label>Interested in<input name="interest" placeholder="Time Audit, AI receptionist..."></label>
    <label>Source<select name="source"><option>referral</option><option>phone</option><option>in person</option><option>social</option><option>manual</option></select></label>
    <label>Deal value ($)<input name="value" inputmode="decimal"></label>
    <label>Follow up on<input name="next_follow_up" type="date" value="<?= h($today) ?>"></label>
    <label class="full">Notes<textarea name="note" rows="3"></textarea></label>
    <div class="full actions"><button class="btn primary">Add lead</button></div>
  </form>
</details>
<?php
page_end();

// ---------------------------------------------------------------- layout
function topbar(): void {
    $msg = flash();
    echo '<header class="top"><a class="brand" href="leads.php">Business Runs Better <span>Leads</span></a>
      <div><a class="btn small" href="leads.php?export=1">Export CSV</a>
      <form method="post" style="display:inline">' . csrf_field() . '<input type="hidden" name="action" value="logout"><button class="btn small">Sign out</button></form></div></header>';
    if ($msg) {
        echo '<p class="flash">' . h($msg) . '</p>';
    }
}

function page_start(string $title): void {
    ?><!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='6' fill='%230e1116'/%3E%3Cpath d='M9 22 L29 11.5' stroke='%234c7dff' stroke-width='3'/%3E%3Ccircle cx='30.25' cy='10.75' r='3.25' fill='%234c7dff'/%3E%3C/svg%3E"><title><?= h($title) ?> · BRB Leads</title>
<style>
:root{--bg:#0d1117;--panel:#151b24;--line:#263041;--ink:#eef2f8;--muted:#9aa5b8;--brand:#1d5cff;--lift:#4c7dff;--warn:#ffb020;--bad:#ff6b6b;--good:#3ecf8e}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1180px;margin:0 auto;padding:18px 16px 60px}a{color:var(--lift);text-decoration:none}a:hover{text-decoration:underline}
h1{font-size:24px;margin:0 0 4px}h2{font-size:16px;margin:0 0 12px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
.top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px;flex-wrap:wrap}
.brand{font-weight:700;color:var(--ink);font-size:17px}.brand span{color:var(--lift);font-weight:500}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:18px;margin-bottom:16px}
.narrow{max-width:420px;margin:12vh auto;display:grid;gap:14px}
.btn{display:inline-block;background:transparent;color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:9px 14px;font:inherit;cursor:pointer}
.btn:hover{border-color:var(--lift);text-decoration:none}.btn.primary{background:var(--brand);border-color:var(--brand);color:#fff;font-weight:600}
.btn.small{padding:5px 10px;font-size:13px}.btn.danger{color:var(--bad);border-color:#5a2a2a}
input,select,textarea{width:100%;background:#0b0f15;color:var(--ink);border:1px solid var(--line);border-radius:6px;padding:9px 10px;font:inherit;color-scheme:dark}
input:focus,select:focus,textarea:focus{outline:2px solid var(--brand);outline-offset:-1px}
label{display:grid;gap:5px;font-size:13px;color:var(--muted)}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.full{grid-column:1/-1}.actions{display:flex;justify-content:flex-end}
table{width:100%;border-collapse:collapse}td,th{padding:10px 8px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
th{font-size:12px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.05em}
tr[onclick]{cursor:pointer}tr[onclick]:hover td{background:#1a2230}.num{text-align:right;white-space:nowrap}
.muted{color:var(--muted);font-size:13px}.overdue{color:var(--bad);font-weight:600}.error{color:var(--bad)}
.pill{display:inline-block;padding:2px 9px;border-radius:99px;font-size:12px;font-weight:600;background:#243049;color:#c9d6ff;white-space:nowrap}
.s-new{background:#173a7a;color:#cfe0ff}.s-call_booked,.s-proposal_sent{background:#4a3a10;color:#ffd98a}.s-audit_paid{background:#2e2a5c;color:#d6d0ff}
.s-won{background:#123d2c;color:#9ff0c8}.s-lost{background:#2a2f38;color:#9aa5b8}
.stats{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:16px}
.stat{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 14px;color:var(--muted);font-size:13px}
.stat span{display:block;color:var(--ink);font-size:24px;font-weight:700}
.due{border-color:#5a4410}.due h2{color:var(--warn)}
.toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:10px;flex-wrap:wrap}
.tabs{display:flex;flex-wrap:wrap;gap:4px}.tabs a{padding:6px 10px;border-radius:6px;color:var(--muted);font-size:14px}
.tabs a.on{background:var(--panel);color:var(--ink);border:1px solid var(--line)}.tabs b{font-weight:600;color:var(--lift);margin-left:3px}
.search input{width:260px}.empty{padding:20px 0;text-align:center}
.add summary{cursor:pointer;color:var(--lift);font-weight:600}.add form{margin-top:14px}
.flash{background:#14301f;border:1px solid #1f5c3a;color:#9ff0c8;padding:9px 14px;border-radius:8px}
.detail{display:grid;grid-template-columns:1.25fr 1fr;gap:16px;align-items:start}
.lead-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.contact-links{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 0}
.due-banner{margin:14px 0 0;color:var(--warn);font-weight:600}
.touch{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-top:14px;font-size:14px;color:var(--muted)}
.note-form{display:grid;gap:8px;margin-bottom:16px}.note-form .btn{justify-self:end}
.note{border-left:3px solid var(--line);padding:4px 0 4px 12px;margin-bottom:14px}
.note.k-inquiry{border-color:var(--lift)}.note.k-payment{border-color:var(--good)}.note.k-status{border-color:#4a5568}
.note-meta{font-size:12px;color:var(--muted)}.note-body{white-space:normal;overflow-wrap:anywhere}
.danger-zone{display:flex;justify-content:flex-end;background:transparent;border-style:dashed}
code{background:#0b0f15;padding:1px 5px;border-radius:4px}
@media(max-width:820px){.stats{grid-template-columns:repeat(2,1fr)}.detail,.grid{grid-template-columns:1fr}.search input{width:100%}.search{width:100%}
 .list th:nth-child(2),.list td:nth-child(2){display:none}}
</style></head><body><main>
<?php
}

function page_end(): void {
    echo '</main></body></html>';
}
