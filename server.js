const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const rateLimit = require('express-rate-limit');
const http = require('http');

const app = express();

// --- 1. UPDATED CORS & MIDDLEWARE ---
// Using broad origin access to ensure the handshake completes via Cloudflare Tunnel
app.use(cors()); 

app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

// --- 2. CONFIG ---
const baseDir = process.cwd();
const chatLogPath = path.join(baseDir, 'chat_vault.json');

// --- 3. ANTI-SPAM ---
const transmissionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 20, 
    message: { error: "Rate limit reached." }
});

// --- 4. HARDWARE ENGINE ---
function triggerBunkerAlert(title, message) {
    exec(`termux-notification -t "${title}" -c "${message}" --priority high --led-color 00FFC2`);
    exec('pkill -f mpv');
    const targetAudio = path.join(baseDir, 'audio/tgg.m4a');
    const audioProcess = spawn('mpv', ['--no-video', '--ao=opensles', targetAudio]);
    setTimeout(() => { audioProcess.kill('SIGKILL'); }, 6000);
}

// --- 5. ENDPOINTS ---
app.post('/process.php', transmissionLimiter, async (req, res) => {
    console.log("🔍 DEBUG: Incoming request received:", req.body);
    try {
        const { username, message, timestamp } = req.body;
        
        let chatData = fs.existsSync(chatLogPath) ? JSON.parse(fs.readFileSync(chatLogPath, 'utf8')) : [];
        chatData.push({ 
            timestamp: timestamp || new Date().toISOString(), 
            username: username || "Guest", 
            message: message || "..." 
        });
        fs.writeFileSync(chatLogPath, JSON.stringify(chatData, null, 4));
        
        triggerBunkerAlert("New Inquiry", `From: ${username || 'Guest'}`);
        res.status(200).json({ status: 'success' });
    } catch (err) {
        console.error("DEBUG: Server Error:", err);
        res.status(500).json({ status: 'error' });
    }
});

// --- 6. STARTUP ---
const PORT = 3001;
const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
    console.log('--------------------------------------------------');
    console.log(`🛡️  SOUND SHOP BUNKER: MASTER NODE ONLINE (HTTP)`);
    console.log(`🚀  READY FOR CLOUDFLARE TUNNEL ON PORT ${PORT}`);
    console.log('--------------------------------------------------');
});
