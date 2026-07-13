"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All admin routes require authentication and admin role
router.use(auth_1.requireAuth);
router.use(auth_1.requireAdmin);
router.get('/users', admin_controller_1.getUsers);
router.patch('/users/:id/role', admin_controller_1.updateUserRole);
router.patch('/users/:id/status', admin_controller_1.updateUserStatus);
router.delete('/users/:id', admin_controller_1.deleteUser);
exports.default = router;
