import { Router } from 'express';
import { getTasks, createTask, updateTaskStatus, getTaskById, updateTask, addSubtask, toggleSubtask, addDependency } from '../controllers/task.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getTasks);
router.get('/:id', getTaskById);
router.post('/', createTask);
router.patch('/:id/status', updateTaskStatus);
router.patch('/:id', updateTask);
router.post('/:id/subtasks', addSubtask);
router.patch('/:id/subtasks/:subtaskId/toggle', toggleSubtask);
router.post('/:id/dependencies', addDependency);

export default router;
