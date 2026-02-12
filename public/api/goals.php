<?php
require_once 'config.php';
$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;
$action = $_GET['action'] ?? null;

// GET /api/goals.php?action=stats
if ($method === 'GET' && $action === 'stats') {
    $total = $pdo->query("SELECT COUNT(*) FROM goals")->fetchColumn();
    $active = $pdo->query("SELECT COUNT(*) FROM goals WHERE status='active'")->fetchColumn();
    $completed = $pdo->query("SELECT COUNT(*) FROM goals WHERE status='completed'")->fetchColumn();
    $avg = $pdo->query("SELECT COALESCE(AVG(progress),0) FROM goals WHERE status='active'")->fetchColumn();
    $upcoming = $pdo->query("SELECT * FROM goals WHERE status='active' AND target_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY) ORDER BY target_date ASC")->fetchAll();
    $highRisks = $pdo->query("SELECT r.*, g.title as goal_title FROM risks r JOIN goals g ON r.goal_id=g.id WHERE r.risk_score>=0.6 AND r.status NOT IN('resolved') ORDER BY r.risk_score DESC LIMIT 10")->fetchAll();

    respond([
        'total' => (int)$total,
        'active' => (int)$active,
        'completed' => (int)$completed,
        'averageProgress' => round((float)$avg, 1),
        'upcomingDeadlines' => $upcoming,
        'highRisks' => $highRisks,
    ]);
}

// GET /api/goals.php - list all
if ($method === 'GET' && !$id) {
    $where = ['1=1'];
    $params = [];

    if (!empty($_GET['status'])) {
        $where[] = 'status = ?';
        $params[] = $_GET['status'];
    }
    if (!empty($_GET['category'])) {
        $where[] = 'category = ?';
        $params[] = $_GET['category'];
    }

    $sort = $_GET['sort'] ?? 'created';
    $sortMap = [
        'deadline' => 'target_date ASC',
        'priority' => "FIELD(priority,'critical','high','medium','low')",
        'progress' => 'progress DESC',
        'created' => 'created_at DESC',
    ];
    $orderBy = $sortMap[$sort] ?? 'created_at DESC';

    $stmt = $pdo->prepare("SELECT * FROM goals WHERE " . implode(' AND ', $where) . " ORDER BY $orderBy");
    $stmt->execute($params);
    respond($stmt->fetchAll());
}

// GET /api/goals.php?id=xxx - single goal with relations
if ($method === 'GET' && $id) {
    $stmt = $pdo->prepare("SELECT * FROM goals WHERE id = ?");
    $stmt->execute([$id]);
    $goal = $stmt->fetch();
    if (!$goal) respond(['error' => 'Goal not found'], 404);

    $milestones = $pdo->prepare("SELECT * FROM milestones WHERE goal_id=? ORDER BY sort_order ASC");
    $milestones->execute([$id]);
    $goal['milestones'] = $milestones->fetchAll();

    $tasks = $pdo->prepare("SELECT * FROM tasks WHERE goal_id=? ORDER BY sort_order ASC");
    $tasks->execute([$id]);
    $goal['tasks'] = $tasks->fetchAll();

    $risks = $pdo->prepare("SELECT * FROM risks WHERE goal_id=? ORDER BY risk_score DESC");
    $risks->execute([$id]);
    $goal['risks'] = $risks->fetchAll();

    $logs = $pdo->prepare("SELECT * FROM progress_logs WHERE goal_id=? ORDER BY date DESC LIMIT 30");
    $logs->execute([$id]);
    $goal['progressLogs'] = $logs->fetchAll();

    $subGoals = $pdo->prepare("SELECT * FROM goals WHERE parent_goal_id=? ORDER BY sort_order ASC");
    $subGoals->execute([$id]);
    $goal['subGoals'] = $subGoals->fetchAll();

    respond($goal);
}

// POST /api/goals.php - create
if ($method === 'POST') {
    $data = jsonInput();
    $id = uuid();

    $smartFields = [$data['smart_specific'] ?? '', $data['smart_measurable'] ?? '', $data['smart_achievable'] ?? '', $data['smart_relevant'] ?? '', $data['smart_time_bound'] ?? ''];
    $filled = count(array_filter($smartFields, fn($f) => strlen(trim($f)) > 10));
    $smartScore = $filled / 5;

    $stmt = $pdo->prepare("INSERT INTO goals (id,title,description,category,priority,status,smart_specific,smart_measurable,smart_achievable,smart_relevant,smart_time_bound,smart_score,start_date,target_date,color,icon,parent_goal_id,sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
    $stmt->execute([
        $id, $data['title'], $data['description'] ?? null,
        $data['category'] ?? 'personal', $data['priority'] ?? 'medium', $data['status'] ?? 'draft',
        $data['smart_specific'] ?? null, $data['smart_measurable'] ?? null,
        $data['smart_achievable'] ?? null, $data['smart_relevant'] ?? null,
        $data['smart_time_bound'] ?? null, $smartScore,
        $data['start_date'] ?? null, $data['target_date'],
        $data['color'] ?? '#4A90D9', $data['icon'] ?? 'target',
        $data['parent_goal_id'] ?? null, $data['sort_order'] ?? 0,
    ]);

    $stmt = $pdo->prepare("SELECT * FROM goals WHERE id=?");
    $stmt->execute([$id]);
    respond($stmt->fetch(), 201);
}

// PUT /api/goals.php?id=xxx - update
if ($method === 'PUT' && $id) {
    $data = jsonInput();
    $allowed = ['title','description','category','priority','status','progress','smart_specific','smart_measurable','smart_achievable','smart_relevant','smart_time_bound','start_date','target_date','completed_date','color','icon','sort_order'];

    $sets = [];
    $params = [];
    foreach ($data as $key => $val) {
        if (in_array($key, $allowed)) {
            $sets[] = "$key = ?";
            $params[] = $val;
        }
    }

    // Recalc SMART score
    $smartKeys = ['smart_specific','smart_measurable','smart_achievable','smart_relevant','smart_time_bound'];
    if (count(array_intersect(array_keys($data), $smartKeys)) > 0) {
        $stmt = $pdo->prepare("SELECT * FROM goals WHERE id=?");
        $stmt->execute([$id]);
        $current = $stmt->fetch();
        $merged = array_merge($current, $data);
        $filled = 0;
        foreach ($smartKeys as $sk) {
            if (!empty($merged[$sk]) && strlen(trim($merged[$sk])) > 10) $filled++;
        }
        $sets[] = "smart_score = ?";
        $params[] = $filled / 5;
    }

    if (empty($sets)) respond(['error' => 'No fields'], 400);

    $params[] = $id;
    $pdo->prepare("UPDATE goals SET " . implode(', ', $sets) . " WHERE id=?")->execute($params);

    $stmt = $pdo->prepare("SELECT * FROM goals WHERE id=?");
    $stmt->execute([$id]);
    respond($stmt->fetch());
}

// DELETE /api/goals.php?id=xxx
if ($method === 'DELETE' && $id) {
    $pdo->prepare("DELETE FROM goals WHERE id=?")->execute([$id]);
    respond(['success' => true]);
}

respond(['error' => 'Invalid request'], 400);
