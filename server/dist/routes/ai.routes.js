"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = require("../controllers/ai.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Protect AI route
router.use(auth_1.requireAuth);
router.post('/chat', ai_controller_1.chatWithAI);
exports.default = router;
