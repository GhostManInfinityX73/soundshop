const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process'); 

const app = express();

// --- 1. SECURITY MODULE: RSA KEY LOADING ---
const baseDir = '/sdcard/SoundShop';
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

// --- 2. MIDDLEWARE ---
app.use(cors());
app.use(express.json());
app.use(express.static(baseDir));

// --- 3. CALLER ID GATEKEEPER ---
app.get('/gatekeeper', (req, res) => {
    const intent = req.query.intent || "General";
    const timestamp = new Date().toLocaleTimeString();
    const inquiryNumber = "9105499227"; 
    const purchaseNumber = "9108796800"; 
    
    let targetNumber = (intent.toLowerCase() === 'order' || intent.toLowerCase() === 'purchase') 
        ? purchaseNumber : inquiryNumber;

    console.log(`📞 CALLER ID TRIGGERED: ${intent} at ${timestamp}`);
    const title = `"Sound Shop: ${intent.toUpperCase()}"`;
    const content = `"Customer is dialing ${targetNumber} for a ${intent}."`;
    
    exec(`termux-notification -t ${title} -c ${content} --priority high`, (err) => {
        if (err) console.error("❌ Notification Error:", err);
    });

    res.json({ success: true, phoneNumber: targetNumber });
});

// --- 4. DIRECT ACH SETTLEMENT MODULE ---
app.post('/generate-ach', (req, res) => {
    const { accHolder, email, routing, account, total } = req.body;
    const batchId = "ACH-" + crypto.randomBytes(4).toString('hex').toUpperCase();

    try {
        const logEntry = `[${new Date().toISOString()}] ACH ID: ${batchId} | Holder: ${accHolder} | Amt: ${total}\n`;
        fs.appendFileSync(path.join(baseDir, 'vault_ledger.log'), logEntry);
        res.json({ success: true, batchId: batchId });
    } catch (err) {
        res.status(500).json({ success: false, error: "Bunker ACH failure." });
    }
});

// --- 5. NEW: WESTERN UNION MTCN BUNKER ---
app.post('/api/wu-submit', (req, res) => {
    const { name, mtcn, amount } = req.body;
    const timestamp = new Date().toLocaleString();
    const wuId = "WU-" + crypto.randomBytes(3).toString('hex').toUpperCase();

    console.log(`\n💰 [BUNKER ALERT] Incoming Western Union: ${mtcn}`);

    try {
        // Log to the main ledger
        const logEntry = `[${timestamp}] ID: ${wuId} | SENDER: ${name} | MTCN: ${mtcn} | AMT: $${amount} | STATUS: PENDING VERIFICATION\n`;
        fs.appendFileSync(path.join(baseDir, 'vault_ledger.log'), logEntry);

        // Trigger Android Alert so you know a payment is waiting
        const title = `"PAYMENT ALERT: WESTERN UNION"`;
        const content = `"MTCN ${mtcn} received from ${name} for $${amount}."`;
        exec(`termux-notification -t ${title} -c ${content} --priority high --led-color FFFF00`);

        res.status(200).json({ success: true, id: wuId });
    } catch (err) {
        console.error("❌ WU Log Error:", err);
        res.status(500).json({ success: false });
    }
});

// --- 6. SERVER INITIALIZATION ---
const PORT = 3001; // Updated to 3001 for the Secure Gateway
const HOST = '0.0.0.0'; 

app.listen(PORT, HOST, () => {
    console.log('\n🛡️  SOUND SHOP BUNKER: ONLINE (PORT 3001)');
    console.log(`🔗 GATEWAY ACTIVE: http://127.0.0.1:${PORT}`);
    console.log('🚀 ACH & WESTERN UNION MODULES READY');
    console.log('🙏 EVERYTHING FOR THE GLORY OF GOD');
});
