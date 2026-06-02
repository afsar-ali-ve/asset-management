const pool = require('../config/db');

const DEFAULT_LISTS = ['To Do', 'In Progress', 'Review', 'Done'];
const BOARD_VISIBILITIES = ['Private', 'Public'];
const BOARD_MEMBER_ROLES = ['Viewer', 'Member', 'Admin'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

const isAdmin = (user) => user?.role_name === 'Admin';

const getCurrentUser = async (userId) => {
  const result = await pool.query(
    `SELECT u.id, u.full_name, u.email, u.is_active, r.role_name
     FROM users u
     LEFT JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1`,
    [userId]
  );
  return result.rows[0] || null;
};

const requireActiveUser = async (req, res) => {
  const user = await getCurrentUser(req.user.id);
  if (!user || !user.is_active) {
    res.status(403).json({ error: 'Access denied' });
    return null;
  }
  return user;
};

const requireAdminUser = async (req, res) => {
  const user = await requireActiveUser(req, res);
  if (!user) return null;
  if (!isAdmin(user)) {
    res.status(403).json({ error: 'Access denied' });
    return null;
  }
  return user;
};

const getBoardIdForList = async (listId) => {
  const result = await pool.query('SELECT board_id FROM task_lists WHERE id = $1', [listId]);
  return result.rows[0]?.board_id || null;
};

const getCardContext = async (cardId) => {
  const result = await pool.query(
    `SELECT c.id, c.list_id, l.board_id
     FROM task_cards c
     JOIN task_lists l ON l.id = c.list_id
     WHERE c.id = $1`,
    [cardId]
  );
  return result.rows[0] || null;
};

const canAccessBoard = async (boardId, user) => {
  if (isAdmin(user)) return true;

  const result = await pool.query(
    `SELECT b.id
     FROM task_boards b
     WHERE b.id = $1
       AND (
         b.visibility = 'Public'
         OR b.created_by = $2
         OR EXISTS (
           SELECT 1
           FROM task_board_members m
           WHERE m.board_id = b.id AND m.user_id = $2
         )
       )`,
    [boardId, user.id]
  );

  return result.rows.length > 0;
};

const getLatestAccessRequest = async (boardId, userId) => {
  const result = await pool.query(
    `SELECT id, status, requested_at, reviewed_at, admin_note
     FROM task_board_access_requests
     WHERE board_id = $1 AND requested_by_user_id = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [boardId, userId]
  );
  return result.rows[0] || null;
};

const getTaskBoards = async (req, res) => {
  try {
    const user = await requireActiveUser(req, res);
    if (!user) return;

    const values = [];
    const accessWhere = isAdmin(user)
      ? ''
      : `WHERE b.created_by = $1
         OR b.visibility = 'Public'
         OR EXISTS (
           SELECT 1
           FROM task_board_members m
           WHERE m.board_id = b.id AND m.user_id = $1
         )`;

    if (!isAdmin(user)) {
      values.push(user.id);
    }

    const result = await pool.query(
      `SELECT b.id,
              b.name,
              b.description,
              b.visibility,
              b.created_by,
              b.created_at,
              b.updated_at,
              u.full_name AS created_by_name,
              (
                SELECT COUNT(*)
                FROM task_lists l
                JOIN task_cards c ON c.list_id = l.id
                WHERE l.board_id = b.id
              )::int AS cards_count
       FROM task_boards b
       LEFT JOIN users u ON u.id = b.created_by
       ${accessWhere}
       ORDER BY b.updated_at DESC, b.created_at DESC`,
      values
    );

    res.json({ boards: result.rows });
  } catch (error) {
    console.error('Get task boards error:', error);
    res.status(500).json({ error: 'Unable to load task boards' });
  }
};

const createTaskBoard = async (req, res) => {
  const client = await pool.connect();
  try {
    const user = await requireActiveUser(req, res);
    if (!user) return;

    const name = req.body.name?.trim();
    const description = req.body.description?.trim() || null;
    const visibility = BOARD_VISIBILITIES.includes(req.body.visibility) ? req.body.visibility : 'Private';
    if (!name) {
      return res.status(400).json({ error: 'Board name is required' });
    }

    await client.query('BEGIN');
    const boardResult = await client.query(
      `INSERT INTO task_boards (name, description, visibility, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, description, visibility, created_by, created_at, updated_at`,
      [name, description, visibility, user.id]
    );
    const board = boardResult.rows[0];

    for (const [position, title] of DEFAULT_LISTS.entries()) {
      await client.query(
        'INSERT INTO task_lists (board_id, title, position) VALUES ($1, $2, $3)',
        [board.id, title, position]
      );
    }
    await client.query(
      `INSERT INTO task_board_members (board_id, user_id, role)
       VALUES ($1, $2, 'Admin')
       ON CONFLICT (board_id, user_id) DO NOTHING`,
      [board.id, user.id]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Board created successfully', board });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create task board error:', error);
    res.status(500).json({ error: 'Unable to create board' });
  } finally {
    client.release();
  }
};

const updateTaskBoard = async (req, res) => {
  try {
    const user = await requireAdminUser(req, res);
    if (!user) return;

    const { boardId } = req.params;
    const name = req.body.name?.trim();
    const description = req.body.description?.trim() || null;
    const visibility = req.body.visibility;

    if (!name) {
      return res.status(400).json({ error: 'Board name is required' });
    }
    if (!BOARD_VISIBILITIES.includes(visibility)) {
      return res.status(400).json({ error: 'Visibility must be Private or Public' });
    }

    const result = await pool.query(
      `UPDATE task_boards
       SET name = $1,
           description = $2,
           visibility = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, name, description, visibility, created_by, created_at, updated_at`,
      [name, description, visibility, boardId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }

    res.json({ message: 'Board updated successfully', board: result.rows[0] });
  } catch (error) {
    console.error('Update task board error:', error);
    res.status(500).json({ error: 'Unable to update board' });
  }
};

const assignUserToBoard = async (req, res) => {
  try {
    const currentUser = await requireAdminUser(req, res);
    if (!currentUser) return;

    const { boardId } = req.params;
    const email = req.body.email?.trim().toLowerCase();
    const role = req.body.role;

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Valid user email is required' });
    }
    if (!BOARD_MEMBER_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Board role must be Viewer, Member, or Admin' });
    }

    const boardResult = await pool.query('SELECT id FROM task_boards WHERE id = $1', [boardId]);
    if (boardResult.rows.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const userResult = await pool.query(
      `SELECT id, full_name, email, is_active
       FROM users
       WHERE LOWER(email) = $1`,
      [email]
    );
    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (!user.is_active) {
      return res.status(400).json({ error: 'User account is inactive' });
    }

    const memberResult = await pool.query(
      `INSERT INTO task_board_members (board_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (board_id, user_id)
       DO UPDATE SET role = EXCLUDED.role, updated_at = CURRENT_TIMESTAMP
       RETURNING id, board_id, user_id, role, created_at, updated_at`,
      [boardId, user.id, role]
    );

    res.json({
      message: 'Board assigned successfully',
      member: memberResult.rows[0],
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Assign board user error:', error);
    res.status(500).json({ error: 'Unable to assign board' });
  }
};

const getBoardMembers = async (req, res) => {
  try {
    const currentUser = await requireAdminUser(req, res);
    if (!currentUser) return;

    const { boardId } = req.params;
    const boardResult = await pool.query('SELECT id, created_by FROM task_boards WHERE id = $1', [boardId]);
    const board = boardResult.rows[0];
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const result = await pool.query(
      `SELECT m.id,
              m.board_id,
              m.user_id,
              m.role,
              m.created_at,
              m.updated_at,
              u.full_name,
              u.email,
              u.is_active,
              (u.id = $2) AS is_owner
       FROM task_board_members m
       JOIN users u ON u.id = m.user_id
       WHERE m.board_id = $1
       ORDER BY is_owner DESC, u.full_name ASC, u.email ASC`,
      [boardId, board.created_by]
    );

    res.json({ members: result.rows });
  } catch (error) {
    console.error('Get board members error:', error);
    res.status(500).json({ error: 'Unable to load assigned users' });
  }
};

const removeUserFromBoard = async (req, res) => {
  try {
    const currentUser = await requireAdminUser(req, res);
    if (!currentUser) return;

    const { boardId, userId } = req.params;
    const boardResult = await pool.query('SELECT id, created_by FROM task_boards WHERE id = $1', [boardId]);
    const board = boardResult.rows[0];
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    if (board.created_by === userId) {
      return res.status(400).json({ error: 'Board owner cannot be removed' });
    }

    const result = await pool.query(
      `DELETE FROM task_board_members
       WHERE board_id = $1 AND user_id = $2
       RETURNING id, board_id, user_id, role`,
      [boardId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Assigned user not found' });
    }

    res.json({ message: 'User removed from board', member: result.rows[0] });
  } catch (error) {
    console.error('Remove board user error:', error);
    res.status(500).json({ error: 'Unable to remove assigned user' });
  }
};

const getTaskLists = async (req, res) => {
  try {
    const user = await requireActiveUser(req, res);
    if (!user) return;

    const { boardId } = req.params;
    if (!(await canAccessBoard(boardId, user))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const listsResult = await pool.query(
      `SELECT id, board_id, title, position, created_at, updated_at
       FROM task_lists
       WHERE board_id = $1
       ORDER BY position ASC, created_at ASC`,
      [boardId]
    );

    const cardsResult = await pool.query(
      `SELECT c.id,
              c.list_id,
              c.title,
              c.description,
              c.priority,
              c.due_date,
              c.assignee_id,
              c.position,
              c.order_index,
              c.created_by,
              c.created_at,
              c.updated_at,
              u.full_name AS assignee_name,
              u.email AS assignee_email
       FROM task_cards c
       LEFT JOIN users u ON u.id = c.assignee_id
       JOIN task_lists l ON l.id = c.list_id
       WHERE l.board_id = $1
       ORDER BY c.order_index ASC, c.position ASC, c.created_at ASC`,
      [boardId]
    );

    const cardsByList = cardsResult.rows.reduce((acc, card) => {
      acc[card.list_id] = acc[card.list_id] || [];
      acc[card.list_id].push(card);
      return acc;
    }, {});

    res.json({
      lists: listsResult.rows.map((list) => ({
        ...list,
        cards: cardsByList[list.id] || [],
      })),
    });
  } catch (error) {
    console.error('Get task lists error:', error);
    res.status(500).json({ error: 'Unable to load task lists' });
  }
};

const createTaskList = async (req, res) => {
  try {
    const user = await requireActiveUser(req, res);
    if (!user) return;

    const boardId = req.body.board_id || req.body.boardId;
    const title = req.body.title?.trim();
    if (!boardId || !title) {
      return res.status(400).json({ error: 'Board and list title are required' });
    }

    if (!(await canAccessBoard(boardId, user))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const positionResult = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS position FROM task_lists WHERE board_id = $1',
      [boardId]
    );
    const result = await pool.query(
      `INSERT INTO task_lists (board_id, title, position)
       VALUES ($1, $2, $3)
       RETURNING id, board_id, title, position, created_at, updated_at`,
      [boardId, title, positionResult.rows[0].position]
    );

    res.status(201).json({ message: 'List created successfully', list: result.rows[0] });
  } catch (error) {
    console.error('Create task list error:', error);
    res.status(500).json({ error: 'Unable to create list' });
  }
};

const getTaskCards = async (req, res) => {
  try {
    const user = await requireActiveUser(req, res);
    if (!user) return;

    const boardId = await getBoardIdForList(req.params.listId);
    if (!boardId || !(await canAccessBoard(boardId, user))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT c.id,
              c.list_id,
              c.title,
              c.description,
              c.priority,
              c.due_date,
              c.assignee_id,
              c.position,
              c.order_index,
              c.created_by,
              c.created_at,
              c.updated_at,
              u.full_name AS assignee_name,
              u.email AS assignee_email
       FROM task_cards c
       LEFT JOIN users u ON u.id = c.assignee_id
       WHERE c.list_id = $1
       ORDER BY c.order_index ASC, c.position ASC, c.created_at ASC`,
      [req.params.listId]
    );

    res.json({ cards: result.rows });
  } catch (error) {
    console.error('Get task cards error:', error);
    res.status(500).json({ error: 'Unable to load task cards' });
  }
};

const createTaskCard = async (req, res) => {
  try {
    const user = await requireActiveUser(req, res);
    if (!user) return;

    const listId = req.body.list_id || req.body.listId;
    const title = req.body.title?.trim();
    if (!listId || !title) {
      return res.status(400).json({ error: 'List and task title are required' });
    }

    const boardId = await getBoardIdForList(listId);
    if (!boardId || !(await canAccessBoard(boardId, user))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const positionResult = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS position FROM task_cards WHERE list_id = $1',
      [listId]
    );
    const result = await pool.query(
      `INSERT INTO task_cards (list_id, title, description, priority, due_date, assignee_id, position, order_index, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8)
       RETURNING id, list_id, title, description, priority, due_date, assignee_id, position, order_index, created_by, created_at, updated_at`,
      [
        listId,
        title,
        req.body.description?.trim() || null,
        req.body.priority || 'Medium',
        req.body.due_date || req.body.dueDate || null,
        req.body.assignee_id || req.body.assigneeId || null,
        positionResult.rows[0].position,
        user.id,
      ]
    );

    res.status(201).json({ message: 'Task created successfully', card: result.rows[0] });
  } catch (error) {
    console.error('Create task card error:', error);
    res.status(500).json({ error: 'Unable to create task' });
  }
};

const updateTaskCard = async (req, res) => {
  try {
    const user = await requireActiveUser(req, res);
    if (!user) return;

    const cardId = req.params.id;
    const title = req.body.title?.trim();
    const description = req.body.description?.trim() || null;

    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    const cardContext = await getCardContext(cardId);
    if (!cardContext || !(await canAccessBoard(cardContext.board_id, user))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `UPDATE task_cards
       SET title = $1,
           description = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, list_id, title, description, priority, due_date, assignee_id, position, order_index, created_by, created_at, updated_at`,
      [title, description, cardId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task updated successfully', card: result.rows[0] });
  } catch (error) {
    console.error('Update task card error:', error);
    res.status(500).json({ error: 'Unable to update task' });
  }
};

const getTaskCardComments = async (req, res) => {
  try {
    const user = await requireActiveUser(req, res);
    if (!user) return;

    const cardContext = await getCardContext(req.params.id);
    if (!cardContext || !(await canAccessBoard(cardContext.board_id, user))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT c.id,
              c.card_id,
              c.user_id,
              c.comment,
              c.created_at,
              c.updated_at,
              u.full_name AS commented_by_name,
              u.email AS commented_by_email
       FROM task_card_comments c
       LEFT JOIN users u ON u.id = c.user_id
       WHERE c.card_id = $1
       ORDER BY c.created_at ASC`,
      [req.params.id]
    );

    res.json({ comments: result.rows });
  } catch (error) {
    console.error('Get task card comments error:', error);
    res.status(500).json({ error: 'Unable to load comments' });
  }
};

const addTaskCardComment = async (req, res) => {
  try {
    const user = await requireActiveUser(req, res);
    if (!user) return;

    const comment = req.body.comment?.trim();
    if (!comment) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    const cardContext = await getCardContext(req.params.id);
    if (!cardContext || !(await canAccessBoard(cardContext.board_id, user))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `INSERT INTO task_card_comments (card_id, user_id, comment)
       VALUES ($1, $2, $3)
       RETURNING id, card_id, user_id, comment, created_at, updated_at`,
      [req.params.id, user.id, comment]
    );

    res.status(201).json({
      message: 'Comment added successfully',
      comment: {
        ...result.rows[0],
        commented_by_name: user.full_name,
        commented_by_email: user.email,
      },
    });
  } catch (error) {
    console.error('Add task card comment error:', error);
    res.status(500).json({ error: 'Unable to add comment' });
  }
};

const getTaskCardAttachments = async (req, res) => {
  try {
    const user = await requireActiveUser(req, res);
    if (!user) return;

    const cardContext = await getCardContext(req.params.id);
    if (!cardContext || !(await canAccessBoard(cardContext.board_id, user))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `SELECT a.id,
              a.card_id,
              a.uploaded_by,
              a.file_name,
              a.mime_type,
              a.file_size,
              a.file_data,
              a.created_at,
              a.updated_at,
              u.full_name AS uploaded_by_name,
              u.email AS uploaded_by_email
       FROM task_card_attachments a
       LEFT JOIN users u ON u.id = a.uploaded_by
       WHERE a.card_id = $1
       ORDER BY a.created_at DESC`,
      [req.params.id]
    );

    res.json({
      attachments: result.rows.map((attachment) => ({
        ...attachment,
        file_data: undefined,
        data_url: `data:${attachment.mime_type};base64,${attachment.file_data.toString('base64')}`,
      })),
    });
  } catch (error) {
    console.error('Get task card attachments error:', error);
    res.status(500).json({ error: 'Unable to load attachments' });
  }
};

const addTaskCardAttachment = async (req, res) => {
  try {
    const user = await requireActiveUser(req, res);
    if (!user) return;

    const fileName = req.body.file_name?.trim() || req.body.fileName?.trim();
    const mimeType = req.body.mime_type?.trim() || req.body.mimeType?.trim();
    const dataUrl = req.body.data_url || req.body.dataUrl;
    const base64 = req.body.base64 || (typeof dataUrl === 'string' ? dataUrl.split(',')[1] : '');

    if (!fileName || !mimeType || !base64) {
      return res.status(400).json({ error: 'Attachment file is required' });
    }

    const fileBuffer = Buffer.from(base64, 'base64');
    if (!fileBuffer.length) {
      return res.status(400).json({ error: 'Attachment file is empty' });
    }
    if (fileBuffer.length > MAX_ATTACHMENT_BYTES) {
      return res.status(400).json({ error: 'Attachment must be 5MB or smaller' });
    }

    const cardContext = await getCardContext(req.params.id);
    if (!cardContext || !(await canAccessBoard(cardContext.board_id, user))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await pool.query(
      `INSERT INTO task_card_attachments (card_id, uploaded_by, file_name, mime_type, file_size, file_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, card_id, uploaded_by, file_name, mime_type, file_size, created_at, updated_at`,
      [req.params.id, user.id, fileName, mimeType, fileBuffer.length, fileBuffer]
    );

    res.status(201).json({
      message: 'Attachment added successfully',
      attachment: {
        ...result.rows[0],
        uploaded_by_name: user.full_name,
        uploaded_by_email: user.email,
        data_url: `data:${mimeType};base64,${fileBuffer.toString('base64')}`,
      },
    });
  } catch (error) {
    console.error('Add task card attachment error:', error);
    res.status(500).json({ error: 'Unable to add attachment' });
  }
};

const updateCardOrder = async (client, listId, orderedIds) => {
  for (const [index, cardId] of orderedIds.entries()) {
    await client.query(
      'UPDATE task_cards SET order_index = $1, position = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND list_id = $3',
      [index, cardId, listId]
    );
  }
};

const moveTaskCard = async (req, res) => {
  const client = await pool.connect();
  try {
    const user = await requireActiveUser(req, res);
    if (!user) return;

    const cardId = req.params.id || req.body.cardId;
    const destinationListId = req.body.destinationListId || req.body.list_id || req.body.listId;
    const newOrderIndex = Number.isFinite(Number(req.body.newOrderIndex ?? req.body.order_index ?? req.body.position))
      ? Number(req.body.newOrderIndex ?? req.body.order_index ?? req.body.position)
      : 0;

    if (!cardId || !destinationListId) {
      return res.status(400).json({ error: 'Card and destination list are required' });
    }

    const cardContext = await getCardContext(cardId);
    const destinationBoardId = await getBoardIdForList(destinationListId);
    if (!cardContext || !destinationBoardId || cardContext.board_id !== destinationBoardId) {
      return res.status(404).json({ error: 'Card or destination list not found' });
    }
    if (!(await canAccessBoard(destinationBoardId, user))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await client.query('BEGIN');
    await client.query(
      `UPDATE task_cards
       SET list_id = $1, order_index = $2, position = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [destinationListId, newOrderIndex, cardId]
    );

    if (Array.isArray(req.body.sourceOrderedIds) && req.body.sourceListId) {
      await updateCardOrder(client, req.body.sourceListId, req.body.sourceOrderedIds);
    }
    if (Array.isArray(req.body.destinationOrderedIds)) {
      await updateCardOrder(client, destinationListId, req.body.destinationOrderedIds);
    }

    await client.query('COMMIT');
    res.json({ message: 'Task moved successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Move task card error:', error);
    res.status(500).json({ error: 'Unable to move task' });
  } finally {
    client.release();
  }
};

const reorderTaskCards = async (req, res) => {
  const client = await pool.connect();
  try {
    const user = await requireActiveUser(req, res);
    if (!user) return;

    const listId = req.body.listId || req.body.list_id;
    const orderedIds = req.body.orderedIds || req.body.cardIds;
    if (!listId || !Array.isArray(orderedIds)) {
      return res.status(400).json({ error: 'List and card order are required' });
    }

    const boardId = await getBoardIdForList(listId);
    if (!boardId || !(await canAccessBoard(boardId, user))) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await client.query('BEGIN');
    await updateCardOrder(client, listId, orderedIds);
    await client.query('COMMIT');
    res.json({ message: 'Task order updated successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Reorder task cards error:', error);
    res.status(500).json({ error: 'Unable to reorder tasks' });
  } finally {
    client.release();
  }
};

const getBoardAccessStatus = async (req, res) => {
  try {
    const user = await requireActiveUser(req, res);
    if (!user) return;

    const { boardId } = req.params;
    const boardResult = await pool.query('SELECT id FROM task_boards WHERE id = $1', [boardId]);
    if (boardResult.rows.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const hasAccess = await canAccessBoard(boardId, user);
    const request = hasAccess ? null : await getLatestAccessRequest(boardId, user.id);

    res.json({
      boardId,
      hasAccess,
      requestStatus: request?.status || null,
      request,
    });
  } catch (error) {
    console.error('Get board access status error:', error);
    res.status(500).json({ error: 'Unable to check board access' });
  }
};

const requestBoardAccess = async (req, res) => {
  try {
    const user = await requireActiveUser(req, res);
    if (!user) return;

    const { boardId } = req.params;
    const boardResult = await pool.query('SELECT id FROM task_boards WHERE id = $1', [boardId]);
    if (boardResult.rows.length === 0) {
      return res.status(404).json({ error: 'Board not found' });
    }

    if (await canAccessBoard(boardId, user)) {
      return res.json({ message: 'You already have access to this board', requestStatus: 'Approved' });
    }

    const existingRequest = await getLatestAccessRequest(boardId, user.id);
    if (existingRequest) {
      return res.json({
        message: existingRequest.status === 'Pending'
          ? 'Request pending approval'
          : `Your request was ${existingRequest.status.toLowerCase()}`,
        requestStatus: existingRequest.status,
        request: existingRequest,
      });
    }

    const result = await pool.query(
      `INSERT INTO task_board_access_requests (
         board_id,
         requested_by_user_id,
         requested_by_name,
         requested_by_email,
         status
       )
       VALUES ($1, $2, $3, $4, 'Pending')
       RETURNING id, status, requested_at`,
      [boardId, user.id, user.full_name || user.email, user.email]
    );

    res.status(201).json({
      message: 'Access request sent successfully',
      requestStatus: 'Pending',
      request: result.rows[0],
    });
  } catch (error) {
    console.error('Request board access error:', error);
    res.status(500).json({ error: 'Unable to send access request' });
  }
};

const getBoardAccessRequests = async (req, res) => {
  try {
    const user = await requireAdminUser(req, res);
    if (!user) return;

    const result = await pool.query(
      `SELECT r.id,
              r.board_id,
              b.name AS board_name,
              r.requested_by_user_id,
              r.requested_by_name,
              r.requested_by_email,
              r.status,
              r.requested_at,
              r.reviewed_by_user_id,
              r.reviewed_at,
              r.admin_note,
              reviewer.full_name AS reviewed_by_name
       FROM task_board_access_requests r
       JOIN task_boards b ON b.id = r.board_id
       LEFT JOIN users reviewer ON reviewer.id = r.reviewed_by_user_id
       WHERE r.status = 'Pending'
       ORDER BY r.requested_at ASC`
    );

    res.json({ requests: result.rows });
  } catch (error) {
    console.error('Get board access requests error:', error);
    res.status(500).json({ error: 'Unable to load board access requests' });
  }
};

const approveBoardAccessRequest = async (req, res) => {
  const client = await pool.connect();
  try {
    const user = await requireAdminUser(req, res);
    if (!user) return;

    await client.query('BEGIN');
    const requestResult = await client.query(
      `UPDATE task_board_access_requests
       SET status = 'Approved',
           reviewed_by_user_id = $1,
           reviewed_at = CURRENT_TIMESTAMP,
           admin_note = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND status = 'Pending'
       RETURNING *`,
      [user.id, req.body.admin_note || req.body.adminNote || null, req.params.requestId]
    );

    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pending request not found' });
    }

    const request = requestResult.rows[0];
    await client.query(
      `INSERT INTO task_board_members (board_id, user_id, role)
       VALUES ($1, $2, 'Member')
       ON CONFLICT (board_id, user_id)
       DO UPDATE SET role = EXCLUDED.role, updated_at = CURRENT_TIMESTAMP`,
      [request.board_id, request.requested_by_user_id]
    );
    await client.query('COMMIT');

    res.json({ message: 'Board access request approved', request });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Approve board access request error:', error);
    res.status(500).json({ error: 'Unable to approve request' });
  } finally {
    client.release();
  }
};

const rejectBoardAccessRequest = async (req, res) => {
  try {
    const user = await requireAdminUser(req, res);
    if (!user) return;

    const result = await pool.query(
      `UPDATE task_board_access_requests
       SET status = 'Rejected',
           reviewed_by_user_id = $1,
           reviewed_at = CURRENT_TIMESTAMP,
           admin_note = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND status = 'Pending'
       RETURNING *`,
      [user.id, req.body.admin_note || req.body.adminNote || null, req.params.requestId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pending request not found' });
    }

    res.json({ message: 'Board access request rejected', request: result.rows[0] });
  } catch (error) {
    console.error('Reject board access request error:', error);
    res.status(500).json({ error: 'Unable to reject request' });
  }
};

module.exports = {
  getTaskBoards,
  createTaskBoard,
  updateTaskBoard,
  assignUserToBoard,
  getBoardMembers,
  removeUserFromBoard,
  getTaskLists,
  createTaskList,
  getTaskCards,
  createTaskCard,
  updateTaskCard,
  getTaskCardComments,
  addTaskCardComment,
  getTaskCardAttachments,
  addTaskCardAttachment,
  moveTaskCard,
  reorderTaskCards,
  getBoardAccessStatus,
  requestBoardAccess,
  getBoardAccessRequests,
  approveBoardAccessRequest,
  rejectBoardAccessRequest,
};
