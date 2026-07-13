import { Router } from 'express';
import { 
  getWorkspaces, 
  createWorkspace, 
  getWorkspaceById, 
  updateWorkspace, 
  getWorkspaceMembers, 
  inviteMember,
  getAllUsers
} from '../controllers/workspace.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

router.get('/', getWorkspaces);
router.post('/', createWorkspace);
router.get('/users/all', getAllUsers);
router.get('/:id', getWorkspaceById);
router.put('/:id', updateWorkspace);
router.get('/:id/members', getWorkspaceMembers);
router.post('/:id/members', inviteMember);

export default router;
