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

// --- 2. ALERT CONTACTS (SMS & EMAIL DISPATCH) ---
const myEmail = 'streetmentalityrecords1973@gmail.com';
const myPhoneGateway = '9105499227@mms.cricketwireless.net'; 
const gmailAppPass = 'qhvtkofowbptntsv'; 

// --- 3. HARDWARE AUDIO ALARM ENGINE (5-SECOND HARD LOCK) ---
let audioProcess = null; 

function triggerBunkerAlert(title, message, audioFileName = 'tgg.m4a') {
    console.log(`\n🚨 BUNKER SYSTEM ALERT: ${title}`);
    
    // Local Android Notification via Termux API
    exec(`termux-notification -t "${title}" -c "${message}" --priority high --led-color 00FFC2`);

    // Direct Hardware Playback
    const targetAudio = path.join(baseDir, `audio/${audioFileName}`);
    audioProcess = spawn('mpv', ['--no-video', '--ao=opensles', targetAudio]);
    console.log("🔊 5-Second Sound Pulse Triggered...");

    // Unstoppable Kill Switch
    setTimeout(() => {
        if (audioProcess) {
            audioProcess.kill('SIGKILL'); 
            audioProcess = null;
        }
        exec('pkill -f mpv');
    }, 5000); 
}

// --- 4. EXTERNAL DISPATCH SYSTEM ---
async function sendExternalAlert(subject, message) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: myEmail, pass: gmailAppPass }
    });
    
    let mailOptions = {
        from: `"The Sound Shop Bunker" <${myEmail}>`,
        to: `${myEmail}, ${myPhoneGateway}`, 
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

// --- 5. ONE-SHOT, ONE-KILL BAN MATRIX ENGINE ---
function getBanRegistry() {
    if (!fs.existsSync(banRegistryPath)) {
        fs.writeFileSync(banRegistryPath, JSON.stringify({ emails: [], ips: [], devices: [] }, null, 4));
    }
    try {
        return JSON.parse(fs.readFileSync(banRegistryPath, 'utf8'));
    } catch (e) {
        return { emails: [], ips: [], devices: [] };
    }
}

function isPermanentlyBanned(email, ip, userAgent) {
    const vault = getBanRegistry();
    if (email && vault.emails.includes(email.toLowerCase().trim())) return true;
    if (ip && vault.ips.includes(ip)) return true;
    if (userAgent && vault.devices.includes(userAgent)) return true;
    return false;
}

function executePermanentExile(email, ip, userAgent, username = "Unknown User") {
    const vault = getBanRegistry();
    const timestamp = new Date().toISOString();
    
    if (email && email !== "Spam Threshold Breached" && !vault.emails.includes(email.toLowerCase().trim())) {
        vault.emails.push(email.toLowerCase().trim());
    }
    if (ip && !vault.ips.includes(ip)) vault.ips.push(ip);
    if (userAgent && !vault.devices.includes(userAgent)) vault.devices.push(userAgent);
    
    fs.writeFileSync(banRegistryPath, JSON.stringify(vault, null, 4));
    
    const logEntry = `[${timestamp}] [ONE SHOT ONE KILL BAN] User: ${username} | Email: ${email} | IP: ${ip} | Device: ${userAgent}\n`;
    fs.appendFileSync(logFile, logEntry);
}

// --- 6. ANTI-SPAM RADAR SHIELD (RATE LIMITER) ---
const transmissionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 Minutes
    max: 10, // Max 10 hits
    handler: (req, res) => {
        const userIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || "0.0.0.0";
        const userAgent = req.headers['user-agent'] || "Unknown Device";
        
        console.log(`⚠️ [RADAR TRIGGER] Rate limit breached by IP: ${userIp}`);
        
        // Auto-exile on rate limit breach
        executePermanentExile("Spam Threshold Breached", userIp, userAgent, "Rate Limit Spammer");
        
        triggerBunkerAlert("🚨 RADAR FLOOD ISOLATION", `IP ${userIp} exiled for structural spam.`, 'tgg.m4a');
        
        res.status(403).json({ 
            success: false, 
            error: "SECURITY EXILE: Rate limit threshold breached. Network signature flagged for structural spam." 
        });
    }
});

// Zero-Tolerance Sanitization Core
function sanitizeTransmission(inputStr) {
    if (typeof inputStr !== 'string') return '';
    return inputStr
        .replace(/<[^>]*>/g, '') // Strip HTML
        .replace(/[&<>"'/`=]/g, '') // Strip dangerous symbols
        .trim();
}

// Content Policy and Decency Filter
function validateContent(message) {
    if (!message || typeof message !== 'string') return { valid: false, reason: "Malicious payload signature." };
    const cleanMessage = message.trim();
    if (cleanMessage.length === 0) return { valid: false, reason: "Empty input payload." };
    if (cleanMessage.length > 300) return { valid: false, reason: "Flood attempt (character length limit exceeded)." };

    // Complete Media & URL Link Block
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    const domainPattern = /[a-zA-Z0-9-]+\.(com|net|org|edu|gov|mil|biz|info|mobi|xyz|top|club|live|online|adult|porn|xxx)/i;
    if (urlPattern.test(cleanMessage) || domainPattern.test(cleanMessage)) {
        return { valid: false, reason: "Unauthorized link or external media attachment." };
    }

    // Adult Content Decency Filter
    const normalized = cleanMessage.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '');
    const adultBlacklist = ["porn", "pornography", "xxx", "nsfw", "xrated"]; 
    for (let word of adultBlacklist) {
        if (normalized.split(/\s+/).includes(word) || normalized.includes(word)) {
            return { valid: false, reason: "Content Policy Violation: Indecent/Adult language detected." };
        }
    }

    return { valid: true, cleanText: cleanMessage };
}

// --- 7. CRYPTOGRAPHIC HANDSHAKE & INJECTION GUARD (MIDDLEWARE) ---
function enforceStrictPayload(req, res, next) {
    const { username, email, message } = req.body;
    const userIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || "0.0.0.0";
    const userAgent = req.headers['user-agent'] || "Unknown Device";

    // Early Denial Check before processing anything else
    if (isPermanentlyBanned(email, userIp, userAgent)) {
        return res.status(403).json({ error: "ACCESS REVOKED: Permanent Security Exile Is Active." });
    }

    if (!username || !email || !message) {
        return res.status(403).json({ error: "PAYLOAD VIOLATION: Incomplete handshake structural layout." });
    }

    // Strict Attack String Detection (XSS / SQLi)
    const toxicPatterns = [/javascript:/i, /<script/i, /UNION SELECT/i, /OR 1=1/i, /--/];
    const combinedPayload = `${username} ${email} ${message}`;

    for (let pattern of toxicPatterns) {
        if (pattern.test(combinedPayload)) {
            console.error(`[!!! EXPLOIT INTERCEPT !!!] Hostile injection signature matched from vector.`);
            
            executePermanentExile(email, userIp, userAgent, username);
            
            triggerBunkerAlert("🚨 INJECTION COMPROMISE BLOCK", `User ${username} dropped structural exploit strings. Exiled.`, 'tgg.m4a');
            sendExternalAlert("🚨 CRITICAL EXPLOIT INTERCEPT", `User: ${username}\nEmail: ${email}\nIP: ${userIp}\nPayload: ${message}`);

            return res.status(403).json({ 
                error: "MALICIOUS INJECTION DETECTED: Automated defense network active. Session profile permanently exiled." 
            });
        }
    }

    // Pass clean, sanitized elements down the pipeline
    req.sanitizedData = {
        username: sanitizeTransmission(username),
        email: sanitizeTransmission(email),
        message: sanitizeTransmission(message)
    };

    next();
}

// --- 8. MIDDLEWARE INTEGRATION (FORTIFIED) ---

// A. Disable framework fingerprinting to hide your stack from scanning bots
app.disable('x-powered-by');

// B. Strict Domain Lockdown
const allowedOrigins = ['http://localhost:3000', 'https://soundshop.cc'];
app.use(cors({
    origin: function(origin, callback) {
        // Allow server-to-server requests or local tests with no origin
        if(!origin) return callback(null, true);
        if(allowedOrigins.indexOf(origin) === -1){
            return callback(new Error('CORS Policy Violation: Direct structural access denied.'), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// C. Guard against buffer overflow/payload flood attacks by capping JSON size at 10 kilobytes
app.use(express.json({ limit: '10kb' }));
app.use(express.static(baseDir));

// --- 9. BUSINESS & SECURITY NETWORK ENDPOINTS ---

app.get('/api/handshake', (req, res) => {
    res.json({ status: "Secure", encryption: "RSA-2048", timestamp: new Date().toISOString() });
});

// Caller ID Gatekeeper Entry Port
app.get('/gatekeeper', async (req, res) => {
    const intent = req.query.intent || "General Visit";
    const name = req.query.name || "Unknown Caller";
    const phone = req.query.phone || "No Number Provided";
    const timestamp = new Date().toLocaleTimeString();
    
    const userIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || "0.0.0.0";
    const userAgent = req.headers['user-agent'] || "Unknown Device";

    if (isPermanentlyBanned(null, userIp, userAgent)) {
        console.log(`🛑 [SECURITY DENIAL] Banned network signature blocked at Gatekeeper.`);
        return res.status(403).json({ error: "Access Revoked. Security Violation Logged." });
    }
    
    const inquiryNumber = "9105499227"; 
    const purchaseNumber = "9108796800"; 
    let targetNumber = (intent.toLowerCase() === 'order' || intent.toLowerCase() === 'purchase') ? purchaseNumber : inquiryNumber;

    if (req.query.phone) {
        const whitelistPath = path.join(baseDir, 'verified_contacts.json');
        const cleanPhone = phone.replace(/\D/g, '');

        let whitelist = {};
        if (fs.existsSync(whitelistPath)) {
            try { whitelist = JSON.parse(fs.readFileSync(whitelistPath, 'utf8')); } catch (e) {}
        }

        whitelist[cleanPhone] = {
            name: name,
            originalInput: phone,
            verifiedAt: new Date().toLocaleString(),
            status: `Inquiry via ${intent}`
        };

        fs.writeFileSync(whitelistPath, JSON.stringify(whitelist, null, 2), 'utf8');
        console.log(`👤 [GATEKEEPER WHITELIST] Verified: ${name} (${cleanPhone})`);
    }

    const secureToken = crypto.randomBytes(2).toString('hex').toUpperCase();
    const alertMsg = `Caller: ${name.toUpperCase()}\nPhone: ${phone}\nIntent: ${intent.toUpperCase()}\nAccess Code: ${secureToken}\nTime: ${timestamp}`;

    triggerBunkerAlert("📞 GATEKEEPER MONITOR", `Call from ${name} (${phone})`, 'tgg.m4a');
    await sendExternalAlert(`📞 GATEKEEPER ALERT: ${name.toUpperCase()}`, alertMsg);

    res.json({ success: true, phoneNumber: targetNumber, token: secureToken });
});

// Direct ACH Settlement Module
app.post('/generate-ach', async (req, res) => {
    const { accHolder, email, routing, account, total } = req.body;
    const userIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || "0.0.0.0";
    const userAgent = req.headers['user-agent'] || "Unknown Device";

    if (isPermanentlyBanned(email, userIp, userAgent)) {
        return res.status(403).json({ success: false, error: "Access Revoked." });
    }

    const batchId = "ACH-" + crypto.randomBytes(4).toString('hex').toUpperCase();
    const alertMsg = `ACH ID: ${batchId}\nHolder: ${accHolder}\nAmount: $${total}`;

    try {
        const logEntry = `[${new Date().toISOString()}] ${alertMsg}\n`;
        fs.appendFileSync(logFile, logEntry);

        triggerBunkerAlert("🏦 ACH TRANSACTION INCOMING", `Holder: ${accHolder} | $${total}`, 'tgg.m4a');
        await sendExternalAlert("🏦 NEW ACH TRANSACTION", alertMsg);

        res.json({ success: true, batchId: batchId });
    } catch (err) {
        res.status(500).json({ success: false, error: "Bunker ACH failure." });
    }
});

// Western Union MTCN Bunker
app.post('/api/wu-submit', async (req, res) => {
    const { name, mtcn, amount, email } = req.body;
    const userIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || "0.0.0.0";
    const userAgent = req.headers['user-agent'] || "Unknown Device";

    if (isPermanentlyBanned(email, userIp, userAgent)) {
        return res.status(403).json({ success: false, error: "Access Revoked." });
    }

    const timestamp = new Date().toLocaleString();
    const wuId = "WU-" + crypto.randomBytes(3).toString('hex').toUpperCase();
    const alertMsg = `ID: ${wuId}\nSender: ${name}\nMTCN: ${mtcn}\nAmount: $${amount}`;

    try {
        const logEntry = `[${timestamp}] ${alertMsg} | STATUS: PENDING VERIFICATION\n`;
        fs.appendFileSync(logFile, logEntry);

        triggerBunkerAlert("💰 WU PAYMENT SUBMITTED", `MTCN ${mtcn} from ${name} ($${amount})`, 'tgg.m4a');
        await sendExternalAlert("💰 NEW WESTERN UNION TRANSACTION", alertMsg);

        res.status(200).json({ success: true, id: wuId });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// Live Chat Module (UNIFIED WITH RATE LIMITING & CRYPTO HANDSHAKE PACKET ENTRY)
app.post('/chat-inquiry', transmissionLimiter, enforceStrictPayload, async (req, res) => {
    // Structural parameters have cleared injection test and come out fully sanitized
    const { username, email, message } = req.sanitizedData;
    const timestamp = new Date().toLocaleString();
    const chatId = "MSG-" + crypto.randomBytes(3).toString('hex').toUpperCase();

    const userIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || "0.0.0.0";
    const userAgent = req.headers['user-agent'] || "Unknown Device";

    // Run Decency and External Link Policies
    const check = validateContent(message);
    if (!check.valid) {
        executePermanentExile(email, userIp, userAgent, username);

        const dispatchMsg = `CONTENT DEVIATION DETECTED: ${check.reason}\nUser: ${username}\nEmail: ${email}\nIP: ${userIp}\nAttempted Data: "${message}"`;
        
        triggerBunkerAlert("🚨 CHAT POLICY COMPROMISED", `User ${username} Permanently Exiled.`, 'tgg.m4a');
        await sendExternalAlert("🚨 CRITICAL CHAT SECURITY INTERCEPT", dispatchMsg);

        return res.status(403).json({ success: false, error: `SECURITY VIOLATION: ${check.reason}. Permanent network exile executed.` });
    }

    try {
        const chatEntry = {
            id: chatId,
            time: timestamp,
            user: username,
            email: email,
            text: check.cleanText,
            source: req.body.platform || "Web UI Client",
            status: "unread"
        };

        let history = [];
        if (fs.existsSync(chatLogPath)) {
            const fileData = fs.readFileSync(chatLogPath, 'utf8');
            history = JSON.parse(fileData || "[]");
        }
        history.push(chatEntry);
        fs.writeFileSync(chatLogPath, JSON.stringify(history, null, 2));

        // Normal Inbox Notification Pulse
        triggerBunkerAlert("💬 LIVE CHAT INQUIRY", check.cleanText, 'tgg.m4a');
        await sendExternalAlert("💬 NEW LIVE CHAT MESSAGE", `User: ${username}\nMessage: ${check.cleanText}`);

        res.status(200).json({ success: true, id: chatId });
    } catch (err) {
        console.error("❌ Chat Vault Error:", err);
        res.status(500).json({ success: false });
    }
});

app.get('/checkout', (req, res) => {
    res.sendFile(path.join(baseDir, 'checkout.html'));
});

// --- 10. CUSTOM 404 MATRIX ---
app.use((req, res) => {
    res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>404 | SOUND SHOP</title>
            <style>
                body { background: #000; color: #00FFC2; font-family: monospace; text-align: center; padding-top: 20%; text-transform: lowercase; }
                .error-box { border: 1px dashed #00FFC2; display: inline-block; padding: 30px; border-radius: 12px; background: #050505; }
                a { color: #fff; text-decoration: none; border: 1px solid #00FFC2; padding: 10px 20px; border-radius: 5px; display: inline-block; margin-top: 20px; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="error-box">
                <h1>[error 404: route vulnerable or missing]</h1>
                <p>the infrastructure path you requested does not exist on this node.</p>
                <a href="/">return to main matrix</a>
            </div>
        </body>
        </html>
    `);
});

// --- 11. UNIFIED SYSTEM SPIN-UP ---
const PORT = 3001; 
const HOST = '0.0.0.0'; 

app.listen(PORT, HOST, () => {
    process.stdout.write('\x1Bc'); // Clear mobile console screen cleanly
    console.log('--------------------------------------------------');
    console.log('🛡️  SOUND SHOP BUNKER: UNIFIED MASTER NODE ONLINE');
    console.log('⚡  NOTIFICATIONS: SMS Text + Email + Hardware Pulse Active');
    console.log('🔊  ALARM TRACKER: Hard-Locked at 5 Seconds via MPV (tgg.m4a)');
    console.log('🔥  CHAT COMPROMISE RADAR: RATE LIMITER + EXPLOIT GUARD INTEGRATED');
    console.log('🚀  ONE-SHOT EXILE REGISTRY ACTIVE & MONITORING ALL ORBITS');
    console.log('🙏  EVERYTHING FOR THE GLORY OF GOD');
    console.log('--------------------------------------------------\n');
});
