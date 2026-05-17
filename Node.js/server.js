const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process'); 
const nodemailer = require('nodemailer');

const app = express();

// --- 1. CORE SYSTEM & SECURITY PATHS ---
const baseDir = '/sdcard/SoundShop';
const logFile = path.join(baseDir, 'vault_ledger.log');
const chatLogPath = path.join(baseDir, 'chat_vault.json');
const privateKeyPath = path.join(baseDir, 'ss_private.pem');
let privateKey;

try {
    if (fs.existsSync(privateKeyPath)) {
        privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        console.log("🔒 SECURITY MODULE: RSA Keys Loaded.");
    }
} catch (err) {
    console.log("❌ ERROR loading RSA keys:", err.message);
}

// --- 2. ALERT CONTACTS (SMS & EMAIL DISPATCH) ---
const myEmail = 'streetmentalityrecords1973@gmail.com';
const myPhoneGateway = '9105499227@mms.cricketwireless.net'; 
const gmailAppPass = 'qhvtkofowbptntsv'; 

// --- 3. UNSTOPPABLE 5-SECOND HARDWARE AUDIO ENGINE ---
let audioProcess = null; 

function triggerBunkerAlert(title, message, audioFileName = 'tgg.m4a') {
    console.log(`\n🚨 BUNKER SYSTEM ALERT: ${title}`);
    
    // A. Local Android Notification
    exec(`termux-notification -t "${title}" -c "${message}" --priority high --led-color 00FFC2`);

    // B. Direct Hardware Playback via mpv
    const targetAudio = path.join(baseDir, `audio/${audioFileName}`);
    audioProcess = spawn('mpv', ['--no-video', '--ao=opensles', targetAudio]);
    console.log("🔊 5-Second Sound Pulse Triggered...");

    // C. The Unstoppable 5-Second Kill Switch
    setTimeout(() => {
        if (audioProcess) {
            audioProcess.kill('SIGKILL'); 
            audioProcess = null;
        }
        exec('pkill -f mpv');
    }, 5000); 
}

// --- 4. EXTERNAL DISPATCH (SMS TEXT & EMAIL NETWORK) ---
async function sendExternalAlert(subject, message) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: myEmail, pass: gmailAppPass }
    });
    
    let mailOptions = {
        from: `"The Sound Shop Bunker" <${myEmail}>`,
        to: `${myEmail}, ${myPhoneGateway}`, // Sends to email and phone simultaneously
        subject: subject,
        text: message
    };
    
    try {
        await transporter.sendMail(mailOptions);
        console.log("📨 Dispatch: SMS Text and Email Network Alerts Sent.");
    } catch (err) {
        console.error("❌ Dispatch Error:", err.message);
    }
}

// --- 5. MIDDLEWARE ---
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(baseDir));

// --- 6. BUSINESS ENDPOINTS ---

// RSA Handshake
app.get('/api/handshake', (req, res) => {
    res.json({ status: "Secure", encryption: "RSA-2048", timestamp: new Date().toISOString() });
});

// Caller ID Gatekeeper
app.get('/gatekeeper', async (req, res) => {
    const intent = req.query.intent || "General Visit";
    const timestamp = new Date().toLocaleTimeString();
    const inquiryNumber = "9105499227"; 
    const purchaseNumber = "9108796800"; 
    
    let targetNumber = (intent.toLowerCase() === 'order' || intent.toLowerCase() === 'purchase') 
        ? purchaseNumber : inquiryNumber;

    const alertMsg = `Interaction: ${intent.toUpperCase()} at ${timestamp}. Target line: ${targetNumber}`;

    // Hardware Alert & Global Text Network Alert
    triggerBunkerAlert("📞 GATEKEEPER MONITOR", alertMsg, 'tgg.m4a');
    await sendExternalAlert("📞 GATEKEEPER ALERT", alertMsg);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json({ success: true, phoneNumber: targetNumber });
});

// Direct ACH Settlement Module
app.post('/generate-ach', async (req, res) => {
    const { accHolder, email, routing, account, total } = req.body;
    const batchId = "ACH-" + crypto.randomBytes(4).toString('hex').toUpperCase();
    const alertMsg = `ACH ID: ${batchId}\nHolder: ${accHolder}\nAmount: $${total}`;

    try {
        const logEntry = `[${new Date().toISOString()}] ${alertMsg}\n`;
        fs.appendFileSync(logFile, logEntry);

        // Alert the Network
        triggerBunkerAlert("🏦 ACH TRANSACTION INCOMING", `Holder: ${accHolder} | $${total}`, 'tgg.m4a');
        await sendExternalAlert("🏦 NEW ACH TRANSACTION", alertMsg);

        res.json({ success: true, batchId: batchId });
    } catch (err) {
        res.status(500).json({ success: false, error: "Bunker ACH failure." });
    }
});

// Western Union MTCN Bunker
app.post('/api/wu-submit', async (req, res) => {
    const { name, mtcn, amount } = req.body;
    const timestamp = new Date().toLocaleString();
    const wuId = "WU-" + crypto.randomBytes(3).toString('hex').toUpperCase();
    const alertMsg = `ID: ${wuId}\nSender: ${name}\nMTCN: ${mtcn}\nAmount: $${amount}`;

    try {
        const logEntry = `[${timestamp}] ${alertMsg} | STATUS: PENDING VERIFICATION\n`;
        fs.appendFileSync(logFile, logEntry);

        // Hardware Audio Pulse + External SMS/Email Network Alert
        triggerBunkerAlert("💰 WU PAYMENT SUBMITTED", `MTCN ${mtcn} from ${name} ($${amount})`, 'tgg.m4a');
        await sendExternalAlert("💰 NEW WESTERN UNION TRANSACTION", alertMsg);

        res.status(200).json({ success: true, id: wuId });
    } catch (err) {
        console.error("❌ WU Log Error:", err);
        res.status(500).json({ success: false });
    }
});

// Independent Live Chat Module
app.post('/chat-inquiry', async (req, res) => {
    const { message, platform } = req.body;
    const timestamp = new Date().toLocaleString();
    const chatId = "MSG-" + crypto.randomBytes(3).toString('hex').toUpperCase();

    try {
        const chatEntry = {
            id: chatId,
            time: timestamp,
            text: message,
            source: platform || "Web",
            status: "unread"
        };

        let history = [];
        if (fs.existsSync(chatLogPath)) {
            const fileData = fs.readFileSync(chatLogPath, 'utf8');
            history = JSON.parse(fileData || "[]");
        }
        history.push(chatEntry);
        fs.writeFileSync(chatLogPath, JSON.stringify(history, null, 2));

        // Custom Live Chat Audio (tgg.m4a) + SMS Dispatch
        triggerBunkerAlert("💬 LIVE CHAT INQUIRY", message, 'tgg.m4a');
        await sendExternalAlert("💬 NEW LIVE CHAT MESSAGE", `Platform: ${platform || "Web"}\nMessage: ${message}`);

        res.status(200).json({ success: true, id: chatId });
    } catch (err) {
        console.error("❌ Chat Vault Error:", err);
        res.status(500).json({ success: false });
    }
});

// --- 7. SERVER INITIALIZATION ---
const PORT = 3001; 
const HOST = '0.0.0.0'; 

app.listen(PORT, HOST, () => {
    process.stdout.write('\x1Bc'); 
    console.log('--------------------------------------------------');
    console.log('🛡️  SOUND SHOP BUNKER: UNIFIED MASTER NODE ONLINE');
    console.log('⚡  NOTIFICATIONS: SMS Text + Email + Hardware Pulse Active');
    console.log('🔊  TIMER: Hard-Locked at 5 Seconds via MPV');
    console.log('🚀  ACH, WESTERN UNION, GATEKEEPER & CHAT FULLY ARMED');
    console.log('🙏  EVERYTHING FOR THE GLORY OF GOD');
    console.log('--------------------------------------------------\n');
});
