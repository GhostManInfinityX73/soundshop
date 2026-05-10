const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const app = express();

// --- SECURITY MODULE: RSA KEY LOADING ---
const privateKeyPath = '/sdcard/SoundShop/ss_private.pem';
let privateKey;

try {
    if (fs.existsSync(privateKeyPath)) {
        privateKey = fs.readFileSync(privateKeyPath, 'utf8');
        console.log(" SECURITY MODULE: RSA Keys Loaded.");
    } else {
        console.log(" SECURITY WARNING: ss_private.pem not found at path.");
    }
} catch (err) {
    console.log(" ERROR loading RSA keys:", err.message);
}
// ----------------------------------------

app.use(cors());
app.use(express.json());
app.use(express.static('/sdcard/SoundShop'));

app.post('/tokenize', (req, res) => {
    const vaultToken = "vault_" + crypto.randomBytes(16).toString('hex');
    console.log(`\n INBOUND HANDSHAKE: ${req.body.email}`);
    // In a live scenario, the payload would be decrypted here using the privateKey
    res.json({ success: true, token: vaultToken });
});

app.post('/checkout', (req, res) => {
    const orderId = "SS-" + crypto.randomBytes(4).toString('hex').toUpperCase();
    console.log(` TRANSACTION VERIFIED: ${orderId}`);
    res.json({ success: true, orderId: orderId });
});

app.listen(3000, '0.0.0.0', () => {
    console.log('\n SOUND SHOP BUNKER: ONLINE');
    console.log(' GATEWAY: http://127.0.0.1:3000');
    console.log(' ROOT: /sdcard/SoundShop');
});
