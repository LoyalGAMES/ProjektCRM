<?php
require_once 'config.php';
$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$goalId = $_GET['goal_id'] ?? null;

$PROB = ['very_low'=>0.1,'low'=>0.3,'medium'=>0.5,'high'=>0.7,'very_high'=>0.9];
$IMPACT = ['negligible'=>0.1,'minor'=>0.3,'moderate'=>0.5,'major'=>0.7,'critical'=>0.9];

if ($method === 'GET' && $goalId) {
    $stmt = $pdo->prepare("SELECT * FROM risks WHERE goal_id=? ORDER BY risk_score DESC");
    $stmt->execute([$goalId]);
    respond($stmt->fetchAll());
}

if ($method === 'POST') {
    $data = jsonInput();
    $id = uuid();
    $prob = $data['probability'] ?? 'medium';
    $imp = $data['impact'] ?? 'moderate';
    $score = ($PROB[$prob] ?? 0.5) * ($IMPACT[$imp] ?? 0.5);

    $stmt = $pdo->prepare("INSERT INTO risks (id,goal_id,title,description,category,probability,impact,risk_score,mitigation_plan,contingency_plan,trigger_conditions,owner) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)");
    $stmt->execute([$id, $data['goal_id'], $data['title'], $data['description'] ?? null, $data['category'] ?? 'other', $prob, $imp, $score, $data['mitigation_plan'] ?? null, $data['contingency_plan'] ?? null, $data['trigger_conditions'] ?? null, $data['owner'] ?? null]);
    $stmt = $pdo->prepare("SELECT * FROM risks WHERE id=?");
    $stmt->execute([$id]);
    respond($stmt->fetch(), 201);
}

if ($method === 'PUT' && $id) {
    $data = jsonInput();
    if (!empty($data['probability']) || !empty($data['impact'])) {
        $stmt = $pdo->prepare("SELECT * FROM risks WHERE id=?");
        $stmt->execute([$id]);
        $cur = $stmt->fetch();
        $p = $data['probability'] ?? $cur['probability'];
        $i = $data['impact'] ?? $cur['impact'];
        $data['risk_score'] = ($PROB[$p] ?? 0.5) * ($IMPACT[$i] ?? 0.5);
    }
    $allowed = ['title','description','category','probability','impact','risk_score','status','mitigation_plan','contingency_plan','trigger_conditions','owner'];
    $sets = []; $params = [];
    foreach ($data as $k => $v) {
        if (in_array($k, $allowed)) { $sets[] = "$k=?"; $params[] = $v; }
    }
    if ($sets) {
        $params[] = $id;
        $pdo->prepare("UPDATE risks SET " . implode(',', $sets) . " WHERE id=?")->execute($params);
    }
    $stmt = $pdo->prepare("SELECT * FROM risks WHERE id=?");
    $stmt->execute([$id]);
    respond($stmt->fetch());
}

if ($method === 'DELETE' && $id) {
    $pdo->prepare("DELETE FROM risks WHERE id=?")->execute([$id]);
    respond(['success' => true]);
}

respond(['error' => 'Invalid request'], 400);
