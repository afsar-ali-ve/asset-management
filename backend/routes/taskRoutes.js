const express = require('express');
const {
  getTaskBoards,
  createTaskBoard,
  updateTaskBoard,
  assignUserToBoard,
  getTaskLists,
  createTaskList,
  getTaskCards,
  createTaskCard,
  moveTaskCard,
  reorderTaskCards,
  getBoardAccessStatus,
  requestBoardAccess,
  getBoardAccessRequests,
  approveBoardAccessRequest,
  rejectBoardAccessRequest,
} = require('../controllers/taskController');

const router = express.Router();

router.get('/task-boards', getTaskBoards);
router.post('/task-boards', createTaskBoard);
router.put('/task-boards/:boardId', updateTaskBoard);
router.post('/task-boards/:boardId/assign-user', assignUserToBoard);
router.get('/task-boards/:boardId/access-status', getBoardAccessStatus);
router.post('/task-boards/:boardId/request-access', requestBoardAccess);
router.get('/task-boards/:boardId/lists', getTaskLists);
router.post('/task-lists', createTaskList);
router.get('/task-lists/:listId/cards', getTaskCards);
router.post('/task-cards', createTaskCard);
router.put('/task-cards/reorder', reorderTaskCards);
router.put('/task-cards/:id/move', moveTaskCard);
router.get('/admin/board-access-requests', getBoardAccessRequests);
router.put('/admin/board-access-requests/:requestId/approve', approveBoardAccessRequest);
router.put('/admin/board-access-requests/:requestId/reject', rejectBoardAccessRequest);

module.exports = router;
