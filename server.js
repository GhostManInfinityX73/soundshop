const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process'); 
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express();

// --- 1. CORE SYSTEM & SECURITY PATHS ---
const baseDir = '/sdcard/SoundShop';
const logFile = path.join(baseDir, 'vault_ledger.log');
const chatLogPath = path.join(baseDir, 'chat_vault.json');
const privateKeyPath = path.join(baseDir, 'ss_private.pem');
const banRegistryPath = path.join(baseDir, 'banned_vault.json'); 
let privateKey;

try {
    if (fs.existsSync(privateKeyPath)) {
        privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        console.log("🔒 SECURITY MODULE: RSA Keys Loaded.");
    }
} catch (err) {
    console.log("❌ ERROR loading RSA keys:", err.message);
}

// --- 2. ALERT CONTACTS ---
const myEmail = 'streetmentalityrecords1973@gmail.com';
const myPhoneGateway = '9105499227@mms.cricketwireless.net'; 
const gmailAppPass = 'qhvtkofowbptntsv'; 

// --- 3. HARDWARE AUDIO ALARM ENGINE ---
function triggerBunkerAlert(title, message, audioFileName = 'tgg.m4a') {
    exec(`termux-notification -t "${title}" -c "${message}" --priority high --led-color 00FFC2`);
    const targetAudio = path.join(baseDir, `audio/${audioFileName}`);
    const audioProcess = spawn('mpv', ['--no-video', '--ao=opensles', targetAudio]);
    setTimeout(() => { audioProcess.kill('SIGKILL'); exec('pkill -f mpv'); }, 5000); 
}

async function sendExternalAlert(subject, message) {
    let transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: myEmail, pass: gmailAppPass } });
    try { await transporter.sendMail({ from: `"The Sound Shop Bunker" <${myEmail}>`, to: `${myEmail}, ${myPhoneGateway}`, subject, text: message }); } catch (err) { console.error("❌ Dispatch Error:", err.message); }
}

// --- 4. SECURITY & BAN MATRIX ---
function getBanRegistry() {
    if (!fs.existsSync(banRegistryPath)) fs.writeFileSync(banRegistryPath, JSON.stringify({ emails: [], ips: [], devices: [] }, null, 4));
    return JSON.parse(fs.readFileSync(banRegistryPath, 'utf8'));
}

function isPermanentlyBanned(email, ip, userAgent) {
    const vault = getBanRegistry();
    if (email && vault.emails.includes(email.toLowerCase().trim())) return true;
    if (ip && vault.ips.includes(ip)) return true;
    if (userAgent && vault.devices.includes(userAgent)) return true;
    return false;
}

function executePermanentExile(email, ip, userAgent, username = "Unknown") {
    const vault = getBanRegistry();
    if (email && !vault.emails.includes(email.toLowerCase().trim())) vault.emails.push(email.toLowerCase().trim());
    if (ip && !vault.ips.includes(ip)) vault.ips.push(ip);
    if (userAgent && !vault.devices.includes(userAgent)) vault.devices.push(userAgent);
    fs.writeFileSync(banRegistryPath, JSON.stringify(vault, null, 4));
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] [EXILE] User: ${username} | Email: ${email} | IP: ${ip}\n`);
}

// --- 5. MIDDLEWARE & ANTI-SPAM ---
app.disable('x-powered-by');
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(express.static(baseDir));

const transmissionLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, handler: (req, res) => res.status(403).json({ error: "Rate limit breached." }) });

// --- 6. UNIFIED BUSINESS & PORTAL ENDPOINTS ---

app.post('/log-payment', (req, res) => {
    const { item, amount } = req.body;
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] [TELEMETRY] ${item} | ${amount}\n`);
    res.status(200).json({ success: true });
});

app.post('/verify-order', (req, res) => {
    const { transId, email } = req.body;
    const ledger = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : "";
    if (ledger.includes(transId) && ledger.toLowerCase().includes(email.toLowerCase().trim())) {
        res.json({ valid: true });
    } else {
        res.json({ valid: false, reason: "Mismatch in ledger." });
    }
});

app.post('/request-vault-download', (req, res) => {
    const { email, targetFile } = req.body;
    const ledger = fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : "";
    
    if (ledger.toLowerCase().includes(email.toLowerCase().trim())) {
        const token = crypto.randomBytes(8).toString('hex');
        res.json({ authorized: true, secureLink: `success.html?transId=TK-${token}&downloadUrl=downloads/${targetFile}` });
    } else {
        res.json({ authorized: false, reason: "No license record found." });
    }
});

// Legacy Payment/Chat Routes
app.get('/gatekeeper', async (req, res) => { res.json({ success: true }); });
app.post('/generate-ach', async (req, res) => { res.json({ success: true }); });
app.post('/api/wu-submit', async (req, res) => { res.json({ success: true }); });
app.post('/chat-inquiry', transmissionLimiter, async (req, res) => { res.json({ success: true }); });

// --- 7. FALLBACK ---
app.use((req, res) => res.status(404).send("404 - Node Offline"));

// --- 8. STARTUP (Fixed for Tunnel Integration) ---
const PORT = 8080;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log('🛡️ SOUND SHOP MASTER NODE ONLINE');
    console.log(`🚀 Listening on http://${HOST}:${PORT}`);
});
