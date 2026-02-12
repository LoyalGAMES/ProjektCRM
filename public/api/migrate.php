<?php
// Run this ONCE to create tables: https://your-domain/api/migrate.php
require_once 'config.php';

$pdo = getDB();

$sql = "
CREATE TABLE IF NOT EXISTS goals (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('career','health','finance','education','personal','relationships','other') DEFAULT 'personal',
  priority ENUM('critical','high','medium','low') DEFAULT 'medium',
  status ENUM('draft','active','paused','completed','abandoned') DEFAULT 'draft',
  progress DECIMAL(5,2) DEFAULT 0.00,
  smart_specific TEXT,
  smart_measurable TEXT,
  smart_achievable TEXT,
  smart_relevant TEXT,
  smart_time_bound TEXT,
  smart_score DECIMAL(3,2) DEFAULT 0.00,
  start_date DATE,
  target_date DATE NOT NULL,
  completed_date DATE,
  color VARCHAR(7) DEFAULT '#4A90D9',
  icon VARCHAR(50) DEFAULT 'target',
  parent_goal_id VARCHAR(36),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_target_date (target_date),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS milestones (
  id VARCHAR(36) PRIMARY KEY,
  goal_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE,
  completed_date DATE,
  is_completed TINYINT(1) DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
  INDEX idx_goal (goal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(36) PRIMARY KEY,
  goal_id VARCHAR(36) NOT NULL,
  milestone_id VARCHAR(36),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('todo','in_progress','done','skipped') DEFAULT 'todo',
  priority ENUM('critical','high','medium','low') DEFAULT 'medium',
  due_date DATE,
  completed_date DATE,
  estimated_hours DECIMAL(6,2),
  actual_hours DECIMAL(6,2),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
  INDEX idx_goal (goal_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS risks (
  id VARCHAR(36) PRIMARY KEY,
  goal_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('time','resources','motivation','external','technical','health','financial','other') DEFAULT 'other',
  probability ENUM('very_low','low','medium','high','very_high') DEFAULT 'medium',
  impact ENUM('negligible','minor','moderate','major','critical') DEFAULT 'moderate',
  risk_score DECIMAL(3,2) DEFAULT 0.00,
  status ENUM('identified','mitigating','resolved','occurred','accepted') DEFAULT 'identified',
  mitigation_plan TEXT,
  contingency_plan TEXT,
  trigger_conditions TEXT,
  owner VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
  INDEX idx_goal (goal_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS progress_logs (
  id VARCHAR(36) PRIMARY KEY,
  goal_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  progress_value DECIMAL(5,2),
  notes TEXT,
  mood ENUM('great','good','neutral','bad','terrible') DEFAULT 'neutral',
  hours_spent DECIMAL(6,2) DEFAULT 0,
  obstacles TEXT,
  achievements TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
  INDEX idx_goal_date (goal_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";

try {
    $pdo->exec($sql);
    echo json_encode(['success' => true, 'message' => 'All tables created successfully!']);
} catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
