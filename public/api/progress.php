<?php
require_once 'config.php';
$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$goalId = $_GET['goal_id'] ?? null;

if ($method === 'GET' && $goalId) {
    $limit = (int)($_GET['limit'] ?? 30);
    $stmt = $pdo->prepare("SELECT * FROM progress_logs WHERE goal_id=? ORDER BY date DESC LIMIT ?");
    $stmt->execute([$goalId, $limit]);
    respond($stmt->fetchAll());
}

if ($method === 'POST') {
    $data = jsonInput();
    $id = uuid();
    $date = $data['date'] ?? date('Y-m-d');
    $stmt = $pdo->prepare("INSERT INTO progress_logs (id,goal_id,date,progress_value,notes,mood,hours_spent,obstacles,achievements) VALUES (?,?,?,?,?,?,?,?,?)");
    $stmt->execute([$id, $data['goal_id'], $date, $data['progress_value'] ?? null, $data['notes'] ?? null, $data['mood'] ?? 'neutral', $data['hours_spent'] ?? 0, $data['obstacles'] ?? null, $data['achievements'] ?? null]);

    if (isset($data['progress_value'])) {
        $pdo->prepare("UPDATE goals SET progress=? WHERE id=?")->execute([$data['progress_value'], $data['goal_id']]);
    }

    $stmt = $pdo->prepare("SELECT * FROM progress_logs WHERE id=?");
    $stmt->execute([$id]);
    respond($stmt->fetch(), 201);
}

respond(['error' => 'Invalid request'], 400);
