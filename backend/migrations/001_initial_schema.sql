-- ============================================
-- SMART Goal Tracker - Database Schema
-- ============================================

-- Database: 3087_myplan (hosted on webbiloo.atthost24.pl)
-- The database is pre-created by the hosting provider

-- ============================================
-- Goals table - main entity with SMART fields
-- ============================================
CREATE TABLE IF NOT EXISTS goals (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('career', 'health', 'finance', 'education', 'personal', 'relationships', 'other') DEFAULT 'personal',
  priority ENUM('critical', 'high', 'medium', 'low') DEFAULT 'medium',
  status ENUM('draft', 'active', 'paused', 'completed', 'abandoned') DEFAULT 'draft',
  progress DECIMAL(5,2) DEFAULT 0.00,

  -- SMART Criteria
  smart_specific TEXT COMMENT 'What exactly do you want to achieve?',
  smart_measurable TEXT COMMENT 'How will you measure progress?',
  smart_achievable TEXT COMMENT 'Is it realistic? What resources do you need?',
  smart_relevant TEXT COMMENT 'Why is this goal important to you?',
  smart_time_bound TEXT COMMENT 'What is your deadline?',
  smart_score DECIMAL(3,2) DEFAULT 0.00 COMMENT 'Overall SMART quality score 0-1',

  -- Time fields
  start_date DATE,
  target_date DATE NOT NULL,
  completed_date DATE,

  -- Metadata
  color VARCHAR(7) DEFAULT '#4A90D9',
  icon VARCHAR(50) DEFAULT 'target',
  parent_goal_id VARCHAR(36),
  sort_order INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (parent_goal_id) REFERENCES goals(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_target_date (target_date),
  INDEX idx_category (category)
) ENGINE=InnoDB;

-- ============================================
-- Milestones - checkpoints toward a goal
-- ============================================
CREATE TABLE IF NOT EXISTS milestones (
  id VARCHAR(36) PRIMARY KEY,
  goal_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE,
  completed_date DATE,
  is_completed BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
  INDEX idx_goal (goal_id)
) ENGINE=InnoDB;

-- ============================================
-- Tasks - actionable items within milestones
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(36) PRIMARY KEY,
  goal_id VARCHAR(36) NOT NULL,
  milestone_id VARCHAR(36),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('todo', 'in_progress', 'done', 'skipped') DEFAULT 'todo',
  priority ENUM('critical', 'high', 'medium', 'low') DEFAULT 'medium',
  due_date DATE,
  completed_date DATE,
  estimated_hours DECIMAL(6,2),
  actual_hours DECIMAL(6,2),
  sort_order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
  FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE SET NULL,
  INDEX idx_goal (goal_id),
  INDEX idx_status (status)
) ENGINE=InnoDB;

-- ============================================
-- Risks - risk management for goals
-- ============================================
CREATE TABLE IF NOT EXISTS risks (
  id VARCHAR(36) PRIMARY KEY,
  goal_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category ENUM('time', 'resources', 'motivation', 'external', 'technical', 'health', 'financial', 'other') DEFAULT 'other',
  probability ENUM('very_low', 'low', 'medium', 'high', 'very_high') DEFAULT 'medium',
  impact ENUM('negligible', 'minor', 'moderate', 'major', 'critical') DEFAULT 'moderate',
  risk_score DECIMAL(3,2) DEFAULT 0.00 COMMENT 'Calculated: probability * impact (0-1)',
  status ENUM('identified', 'mitigating', 'resolved', 'occurred', 'accepted') DEFAULT 'identified',
  mitigation_plan TEXT,
  contingency_plan TEXT,
  trigger_conditions TEXT,
  owner VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
  INDEX idx_goal (goal_id),
  INDEX idx_risk_score (risk_score)
) ENGINE=InnoDB;

-- ============================================
-- Progress Log - track daily progress entries
-- ============================================
CREATE TABLE IF NOT EXISTS progress_logs (
  id VARCHAR(36) PRIMARY KEY,
  goal_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  progress_value DECIMAL(5,2) COMMENT 'Progress percentage at this point',
  notes TEXT,
  mood ENUM('great', 'good', 'neutral', 'bad', 'terrible') DEFAULT 'neutral',
  hours_spent DECIMAL(6,2) DEFAULT 0,
  obstacles TEXT,
  achievements TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
  INDEX idx_goal_date (goal_id, date)
) ENGINE=InnoDB;

-- ============================================
-- Goal Notes - free-form notes attached to goals
-- ============================================
CREATE TABLE IF NOT EXISTS goal_notes (
  id VARCHAR(36) PRIMARY KEY,
  goal_id VARCHAR(36) NOT NULL,
  title VARCHAR(255),
  content TEXT NOT NULL,
  type ENUM('note', 'idea', 'reflection', 'lesson_learned') DEFAULT 'note',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
  INDEX idx_goal (goal_id)
) ENGINE=InnoDB;

-- ============================================
-- Sync metadata - for multi-device sync
-- ============================================
CREATE TABLE IF NOT EXISTS sync_log (
  id VARCHAR(36) PRIMARY KEY,
  device_id VARCHAR(100) NOT NULL,
  table_name VARCHAR(50) NOT NULL,
  record_id VARCHAR(36) NOT NULL,
  action ENUM('create', 'update', 'delete') NOT NULL,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data JSON COMMENT 'Snapshot of the changed record',

  INDEX idx_device (device_id),
  INDEX idx_synced (synced_at)
) ENGINE=InnoDB;
