<?php
require_once 'config.php';
$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$goalId = $_GET['goal_id'] ?? null;

if ($method === 'GET' && $goalId) {
    $stmt = $pdo->prepare("SELECT * FROM milestones WHERE goal_id=? ORDER BY sort_order ASC");
    $stmt->execute([$goalId]);
    respond($stmt->fetchAll());
}

if ($method === 'POST') {
    $data = jsonInput();
    $id = uuid();
    $stmt = $pdo->prepare("INSERT INTO milestones (id,goal_id,title,description,target_date,sort_order) VALUES (?,?,?,?,?,?)");
    $stmt->execute([$id, $data['goal_id'], $data['title'], $data['description'] ?? null, $data['target_date'] ?? null, $data['sort_order'] ?? 0]);
    $stmt = $pdo->prepare("SELECT * FROM milestones WHERE id=?");
    $stmt->execute([$id]);
    respond($stmt->fetch(), 201);
}

if ($method === 'PUT' && $id) {
    $data = jsonInput();
    $completedDate = !empty($data['is_completed']) ? date('Y-m-d') : null;
    $pdo->prepare("UPDATE milestones SET title=COALESCE(?,title), description=COALESCE(?,description), target_date=COALESCE(?,target_date), is_completed=COALESCE(?,is_completed), completed_date=?, sort_order=COALESCE(?,sort_order) WHERE id=?")
        ->execute([$data['title'] ?? null, $data['description'] ?? null, $data['target_date'] ?? null, $data['is_completed'] ?? null, $completedDate, $data['sort_order'] ?? null, $id]);

    // Update goal progress
    $m = $pdo->prepare("SELECT goal_id FROM milestones WHERE id=?");
    $m->execute([$id]);
    $row = $m->fetch();
    if ($row) {
        $stats = $pdo->prepare("SELECT COUNT(*) as total, SUM(is_completed) as done FROM milestones WHERE goal_id=?");
        $stats->execute([$row['goal_id']]);
        $s = $stats->fetch();
        if ($s['total'] > 0) {
            $progress = ($s['done'] / $s['total']) * 100;
            $pdo->prepare("UPDATE goals SET progress=? WHERE id=?")->execute([$progress, $row['goal_id']]);
        }
    }

    $stmt = $pdo->prepare("SELECT * FROM milestones WHERE id=?");
    $stmt->execute([$id]);
    respond($stmt->fetch());
}

if ($method === 'DELETE' && $id) {
    $pdo->prepare("DELETE FROM milestones WHERE id=?")->execute([$id]);
    respond(['success' => true]);
}

respond(['error' => 'Invalid request'], 400);
