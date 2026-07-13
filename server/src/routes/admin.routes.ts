import { Router } from 'express';
import { getUsers, updateUserRole, updateUserStatus, deleteUser } from '../controllers/admin.controller';
import { requireAuth, requireAdmin } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

router.get('/users', getUsers);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

export default router;
