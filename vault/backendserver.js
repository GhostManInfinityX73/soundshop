const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express();

// --- 1. CONFIG & PATHS ---
// Pointing back to the parent directory for all data
const baseDir = path.join(__dirname, '..');
const logFile = path.join(baseDir, 'vault_ledger.log');
const chatLogPath = path.join(baseDir, 'chat_vault.json');
const audioPath = path.join(baseDir, 'audio/tgg.m4a');

const myEmail = 'streetmentalityrecords1973@gmail.com';
const myPhoneGateway = '9105499227@mms.cricketwireless.net';
const gmailAppPass = 'qhvtkofowbptntsv';

// --- 2. MIDDLEWARE ---
app.disable('x-powered-by');
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'] }));
app.use(express.json({ limit: '10kb' }));

const limiter = rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 20, 
    message: { error: "Rate limit reached." } 
});

// --- 3. HARDWARE ENGINE ---
function triggerBunkerAlert(title, message) {
    exec(`termux-notification -t "${title}" -c "${message}" --priority high --led-color 00FFC2`);
    exec('pkill -f mpv');
    const audioProcess = spawn('mpv', ['--no-video', '--ao=opensles', audioPath]);
    setTimeout(() => { audioProcess.kill('SIGKILL'); }, 6000);
}

async function sendExternalAlert(subject, message) {
    let transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: myEmail, pass: gmailAppPass } });
    try { 
        await transporter.sendMail({ 
            from: `"Bunker" <${myEmail}>`, 
            to: `${myEmail}, ${myPhoneGateway}`, 
            subject, 
            text: message 
        }); 
    } catch (err) { console.error("❌ Email Error:", err.message); }
}

// --- 4. ENDPOINTS ---
// Communication Bridge
app.post('/process.php', limiter, async (req, res) => {
    try {
        const { username, message, timestamp } = req.body;
        
        // Ensure log file exists
        let chatData = fs.existsSync(chatLogPath) ? JSON.parse(fs.readFileSync(chatLogPath, 'utf8')) : [];
        chatData.push({ timestamp: timestamp || new Date().toISOString(), username: username || "Guest", message: message || "..." });
        fs.writeFileSync(chatLogPath, JSON.stringify(chatData, null, 4));
        
        triggerBunkerAlert("New Inquiry", `From: ${username || 'Guest'}`);
        await sendExternalAlert("New Bunker Inquiry", `User: ${username}\nMsg: ${message}`);
        
        res.status(200).json({ status: 'success' });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ status: 'error' }); 
    }
});

// Payment Logging
app.post('/log-payment', limiter, (req, res) => {
    const { item, amount } = req.body;
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] [PAYMENT] ${item} | ${amount}\n`);
    res.status(200).json({ success: true });
});

// --- 5. STARTUP ---
app.listen(8080, '0.0.0.0', () => {
    console.log('🛡️ HARDENED MASTER NODE ACTIVE ON PORT 8080');
});
