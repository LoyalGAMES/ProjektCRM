<?php
require_once 'config.php';
$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$goalId = $_GET['goal_id'] ?? null;

if ($method === 'GET' && $goalId) {
    $stmt = $pdo->prepare("SELECT * FROM tasks WHERE goal_id=? ORDER BY sort_order ASC");
    $stmt->execute([$goalId]);
    respond($stmt->fetchAll());
}

if ($method === 'POST') {
    $data = jsonInput();
    $id = uuid();
    $stmt = $pdo->prepare("INSERT INTO tasks (id,goal_id,milestone_id,title,description,priority,due_date,estimated_hours,sort_order) VALUES (?,?,?,?,?,?,?,?,?)");
    $stmt->execute([$id, $data['goal_id'], $data['milestone_id'] ?? null, $data['title'], $data['description'] ?? null, $data['priority'] ?? 'medium', $data['due_date'] ?? null, $data['estimated_hours'] ?? null, $data['sort_order'] ?? 0]);
    $stmt = $pdo->prepare("SELECT * FROM tasks WHERE id=?");
    $stmt->execute([$id]);
    respond($stmt->fetch(), 201);
}

if ($method === 'PUT' && $id) {
    $data = jsonInput();
    if (($data['status'] ?? '') === 'done' && empty($data['completed_date'])) {
        $data['completed_date'] = date('Y-m-d');
    }
    $allowed = ['title','description','status','priority','due_date','completed_date','milestone_id','estimated_hours','actual_hours','sort_order'];
    $sets = []; $params = [];
    foreach ($data as $k => $v) {
        if (in_array($k, $allowed)) { $sets[] = "$k=?"; $params[] = $v; }
    }
    if ($sets) {
        $params[] = $id;
        $pdo->prepare("UPDATE tasks SET " . implode(',', $sets) . " WHERE id=?")->execute($params);
    }
    $stmt = $pdo->prepare("SELECT * FROM tasks WHERE id=?");
    $stmt->execute([$id]);
    respond($stmt->fetch());
}

if ($method === 'DELETE' && $id) {
    $pdo->prepare("DELETE FROM tasks WHERE id=?")->execute([$id]);
    respond(['success' => true]);
}

respond(['error' => 'Invalid request'], 400);
