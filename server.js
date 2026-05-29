const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const PORT = 3000;
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- MIDDLEWARE ---
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname)));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// --- HARDWARE ENGINE ---
function triggerBunkerAlert(title, message) {
    exec(`termux-notification -t "${title}" -c "${message}" --priority high --led-color 00FFC2`);
    exec('pkill -f mpv');
    const targetAudio = path.join(process.cwd(), 'audio/tgg.m4a');
    const audioProcess = spawn('mpv', ['--no-video', '--ao=opensles', targetAudio]);
    setTimeout(() => { audioProcess.kill('SIGKILL'); }, 6000);
}

// --- SOCKET.IO ---
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    socket.on('chat message', (data) => io.emit('chat message', data));
    socket.on('offer', (data) => socket.broadcast.emit('offer', data));
    socket.on('answer', (data) => socket.broadcast.emit('answer', data));
    socket.on('candidate', (data) => socket.broadcast.emit('candidate', data));
    socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

// --- API ROUTES & PAGE SERVING ---
// This route tells the server: "When someone visits the home page, show chatroom.html"
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'chatroom.html'));
});

app.post('/process.php', (req, res) => {
    const logPath = path.join(process.cwd(), 'chat_vault.json');
    let chatData = fs.existsSync(logPath) ? JSON.parse(fs.readFileSync(logPath, 'utf8')) : [];
    chatData.push({ ...req.body, timestamp: new Date().toISOString() });
    fs.writeFileSync(logPath, JSON.stringify(chatData, null, 4));
    triggerBunkerAlert("New Inquiry", `From: ${req.body.username || 'Guest'}`);
    res.status(200).json({ status: 'success' });
});

// --- START SERVER ---
// Always put this at the very end
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🛡️  MASTER NODE ONLINE ON PORT ${PORT}`);
});
