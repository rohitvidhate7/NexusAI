"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const path_1 = __importDefault(require("path"));
// Load env vars
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false, // Ensure local assets can be requested from other origins
}));
app.use((0, cors_1.default)({
    origin: [
        'http://localhost:5173',
        'https://nexusai-pm.vercel.app'
    ],
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// Basic Health Check Route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'NexusAI API is running' });
});
const passport_js_1 = __importDefault(require("./config/passport.js"));
// Routes will be imported here
app.use(passport_js_1.default.initialize());
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const workspace_routes_1 = __importDefault(require("./routes/workspace.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const task_routes_1 = __importDefault(require("./routes/task.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const ai_routes_1 = __importDefault(require("./routes/ai.routes"));
const chat_routes_1 = __importDefault(require("./routes/chat.routes"));
app.use('/api/auth', auth_routes_1.default);
app.use('/api/workspaces', workspace_routes_1.default);
app.use('/api/projects', project_routes_1.default);
app.use('/api/tasks', task_routes_1.default);
app.use('/api/upload', upload_routes_1.default);
app.use('/api/admin', admin_routes_1.default);
app.use('/api/ai', ai_routes_1.default);
app.use('/api/chat', chat_routes_1.default);
const http_1 = __importDefault(require("http"));
const socket_service_1 = require("./services/socket.service");
const server = http_1.default.createServer(app);
(0, socket_service_1.initializeSocket)(server);
// Connect to Database and start server
if (process.env.NODE_ENV !== 'test') {
    (0, db_1.connectDB)().then(() => {
        server.listen(PORT, () => {
            console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        });
    });
}
// Active reload trigger
exports.default = app;
