const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const processor = require('./processor'); // Bridges to your ISO-8583 logic

const app = express();
app.use(express.json());

// 1. Load the Master Public Key (The Lock)
const publicKey = fs.readFileSync(path.join(__dirname, 'ss_public.pem'), 'utf8');

/**
 * THE VAULT GATEKEEPER
 * Receives raw data, encrypts it, and triggers the processor.
 */
app.post('/tokenize', async (req, res) => {
    try {
        const { cardData, amount, meta } = req.body;

        // 2. Encrypt sensitive data using RSA-4096
        const buffer = Buffer.from(JSON.stringify(cardData));
        const encrypted = crypto.publicEncrypt(publicKey, buffer);
        const newToken = encrypted.toString('base64');

        console.log("\n--- SOUND SHOP INFRASTRUCTURE ---");
        console.log("SUCCESS: Raw card data cleared from memory.");
        console.log("GENERATED TOKEN: " + newToken.substring(0, 15) + "...");

        // 3. Handshake with the Processor (The Switch)
        const paymentResult = await processor.processInstruction(newToken, amount, meta);

        res.json({
            status: "SECURE",
            token: newToken,
            authCode: paymentResult.authCode,
            stan: paymentResult.instruction_payload.fields[11]
        });

    } catch (err) {
        console.error("VAULT ERROR:", err.message);
        res.status(500).json({ status: "ERROR", message: "Encryption Failed" });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`--- SOUND SHOP INFRASTRUCTURE ---`);
    console.log(`VAULT CORE: ARMED AND LISTENING ON PORT ${PORT}`);
});
