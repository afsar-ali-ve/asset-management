CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS task_activity_logs;
DROP TABLE IF EXISTS task_card_labels;
DROP TABLE IF EXISTS task_labels;
DROP TABLE IF EXISTS task_card_attachments;
DROP TABLE IF EXISTS task_card_checklists;
DROP TABLE IF EXISTS task_card_comments;

CREATE TABLE IF NOT EXISTS task_boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(180) NOT NULL,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES task_boards(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  list_id UUID NOT NULL REFERENCES task_lists(id) ON DELETE CASCADE,
  title VARCHAR(220) NOT NULL,
  description TEXT,
  priority VARCHAR(24) DEFAULT 'Medium',
  due_date DATE,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  position INTEGER NOT NULL DEFAULT 0,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE task_cards ADD COLUMN IF NOT EXISTS order_index INTEGER NOT NULL DEFAULT 0;
UPDATE task_cards SET order_index = position WHERE order_index IS NULL OR order_index = 0;

CREATE TABLE IF NOT EXISTS task_board_access_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES task_boards(id) ON DELETE CASCADE,
  requested_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_by_name VARCHAR(255) NOT NULL,
  requested_by_email VARCHAR(255) NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'Pending',
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  admin_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT task_board_access_requests_status_check CHECK (status IN ('Pending', 'Approved', 'Rejected'))
);

CREATE TABLE IF NOT EXISTS task_board_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES task_boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(24) NOT NULL DEFAULT 'Viewer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT task_board_members_role_check CHECK (role IN ('Viewer', 'Member', 'Admin')),
  UNIQUE(board_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_task_lists_board_id ON task_lists(board_id);
CREATE INDEX IF NOT EXISTS idx_task_cards_list_id ON task_cards(list_id);
CREATE INDEX IF NOT EXISTS idx_task_cards_assignee_id ON task_cards(assignee_id);
CREATE INDEX IF NOT EXISTS idx_task_cards_list_order ON task_cards(list_id, order_index);
CREATE INDEX IF NOT EXISTS idx_task_board_access_requests_board_status ON task_board_access_requests(board_id, status);
CREATE INDEX IF NOT EXISTS idx_task_board_access_requests_user ON task_board_access_requests(requested_by_user_id);
CREATE INDEX IF NOT EXISTS idx_task_board_members_board_user ON task_board_members(board_id, user_id);

INSERT INTO task_boards (name, description, created_by)
SELECT 'IT Operations', 'Track asset support, onboarding, and internal operations tasks.', u.id
FROM users u
WHERE u.email = 'admin@virtualemployee.com'
  AND NOT EXISTS (SELECT 1 FROM task_boards WHERE name = 'IT Operations');

INSERT INTO task_lists (board_id, title, position)
SELECT b.id, list_data.title, list_data.position
FROM task_boards b
CROSS JOIN (
  VALUES
    ('To Do', 0),
    ('In Progress', 1),
    ('Review', 2),
    ('Done', 3)
) AS list_data(title, position)
WHERE b.name = 'IT Operations'
  AND NOT EXISTS (
    SELECT 1 FROM task_lists l WHERE l.board_id = b.id AND l.title = list_data.title
  );

INSERT INTO task_board_members (board_id, user_id, role)
SELECT b.id, b.created_by, 'Admin'
FROM task_boards b
WHERE b.created_by IS NOT NULL
ON CONFLICT (board_id, user_id) DO NOTHING;
