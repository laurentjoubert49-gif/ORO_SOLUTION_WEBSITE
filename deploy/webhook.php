<?php
/**
 * GitHub Webhook Handler — ORO Solution
 * Déploie automatiquement les 3 sites ORO sur o2switch via cPanel API.
 *
 * URL publique : https://oro-solution.com/deploy/webhook.php
 *
 * Variables à configurer (une seule fois) :
 *   WEBHOOK_SECRET   → identique dans GitHub > Settings > Webhooks > Secret
 *   CPANEL_USER      → cosu0953
 *   CPANEL_TOKEN     → token créé dans cPanel > Security > Manage API Tokens
 */

// ─── CONFIGURATION ───────────────────────────────────────────────────────────

define('WEBHOOK_SECRET', getenv('WEBHOOK_SECRET') ?: 'REMPLACER_PAR_VOTRE_SECRET');
define('CPANEL_USER',    'cosu0953');
define('CPANEL_TOKEN',   getenv('CPANEL_TOKEN')   ?: 'REMPLACER_PAR_VOTRE_TOKEN_CPANEL');
define('CPANEL_HOST',    '127.0.0.1');
define('CPANEL_PORT',    2083);
define('LOG_FILE',       '/home/cosu0953/deploy_webhook.log');

// Repos GitHub → repo path sur le serveur o2switch
const REPO_MAP = [
    'ORO_WEBSITE'          => '/home/cosu0953/oro_website',
    'ORO-IMMO-WEBSITE'     => '/home/cosu0953/oro_immo_website',
    'ORO_SOLUTION_WEBSITE' => '/home/cosu0953/oro_solution_website_repo',
];

// ─── VALIDATION SIGNATURE ────────────────────────────────────────────────────

$payload = file_get_contents('php://input');

$sig_header = $_SERVER['HTTP_X_HUB_SIGNATURE_256'] ?? '';
$expected   = 'sha256=' . hash_hmac('sha256', $payload, WEBHOOK_SECRET);

if (!hash_equals($expected, $sig_header)) {
    http_response_code(403);
    log_event('REJECTED', 'Invalid signature from ' . ($_SERVER['REMOTE_ADDR'] ?? '?'));
    exit('Forbidden');
}

// ─── IDENTIFICATION DU REPO ──────────────────────────────────────────────────

$data      = json_decode($payload, true);
$repo_name = $data['repository']['name'] ?? '';
$branch    = ltrim($data['ref'] ?? '', 'refs/heads/');

if (!isset(REPO_MAP[$repo_name])) {
    http_response_code(200);
    log_event('IGNORED', "Repo '$repo_name' non géré");
    exit('Repo not handled');
}

if ($branch !== 'master') {
    http_response_code(200);
    log_event('IGNORED', "Branch '$branch' ignorée (seul master est déployé)");
    exit('Branch ignored');
}

$repo_root = REPO_MAP[$repo_name];

// ─── APPEL CPANEL API ────────────────────────────────────────────────────────

$api_url = sprintf(
    'https://%s:%d/execute/VersionControlDeployment/create',
    CPANEL_HOST,
    CPANEL_PORT
);

$post_data = json_encode(['repository_root' => $repo_root]);

$ch = curl_init($api_url);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $post_data,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => false,
    CURLOPT_TIMEOUT        => 120,
    CURLOPT_HTTPHEADER     => [
        'Authorization: cpanel ' . CPANEL_USER . ':' . CPANEL_TOKEN,
        'Content-Type: application/json',
    ],
]);

$response = curl_exec($ch);
$http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error = curl_error($ch);
curl_close($ch);

// ─── LOG & RÉPONSE ───────────────────────────────────────────────────────────

if ($curl_error) {
    log_event('ERROR', "$repo_name → cURL error: $curl_error");
    http_response_code(500);
    exit('cURL error');
}

$result = json_decode($response, true);
$status = ($result['status'] ?? 0) == 1 ? 'OK' : 'FAILED';

log_event($status, sprintf(
    '%s (branch: %s) → deploy triggered, HTTP %d, cPanel: %s',
    $repo_name,
    $branch,
    $http_code,
    $response
));

http_response_code(200);
echo json_encode(['status' => $status, 'repo' => $repo_name]);

// ─── HELPER ──────────────────────────────────────────────────────────────────

function log_event(string $level, string $msg): void {
    $line = sprintf("[%s] [%s] %s\n", date('Y-m-d H:i:s'), $level, $msg);
    file_put_contents(LOG_FILE, $line, FILE_APPEND | LOCK_EX);
}
