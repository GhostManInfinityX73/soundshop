const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const crypto = require('crypto');
const { SquareClient, SquareEnvironment } = require('square'); 
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('./')); 

// --- SQUARE CONFIGURATION ---
const squareClient = new SquareClient({
  accessToken: 'EAAAl5GAwomtWi5KLo0Q-gwCOkC9TIzMtHyu7LhApanBFAlX1nhkiXcV7B5ovmz3',
  environment: SquareEnvironment.Sandbox, 
});

// --- PUSHOVER CONFIGURATION ---
const PUSHOVER_USER = "upumu7kpzvtszbf7cva9zp7rb45hq";
const PUSHOVER_TOKEN = "a9wb5v3s9xuev9mwi1b6ytoxmmr9hn";

function sendOrderAlert(amount, email, items) {
    const itemNames = (items && Array.isArray(items)) 
        ? items.map(i => i.name).join(', ') 
        : "Premium Instrumental";
    
    axios.post('https://api.pushover.net/1/messages.json', {
        token: PUSHOVER_TOKEN,
        user: PUSHOVER_USER,
        title: "💰 NEW SQUARE ORDER",
        message: `Total: $${amount}\nCustomer: ${email}\nItems: ${itemNames}`,
        sound: 'cashregister',
        priority: 1
    }).catch(err => console.error("❌ Pushover Error:", err.message));
}

// --- NEW: SECURE VAULT HANDSHAKE (PORT 3001) ---
app.post('/process-payment', async (req, res) => {
    const { cardData, amount, trackTitle, customerEmail } = req.body;

    try {
        // 1. Reach out to your internal Bunker on Port 3001
        const vaultResponse = await axios.post('http://localhost:3001/tokenize', {
            cardData: cardData
        });

        const secureToken = vaultResponse.data.token;

        // 2. Log that the Handshake is secure
        console.log(`[VAULT HANDSHAKE] SUCCESS for ${customerEmail}`);
        console.log(`[TOKEN]: ${secureToken.substring(0, 15)}...`);

        // 3. Return success to the Frontend
        res.json({ 
            success: true, 
            message: "Security Handshake Complete", 
            vaultToken: secureToken 
        });

    } catch (error) {
        console.error("❌ VAULT CONNECTION ERROR: Is Port 3001 Armed?");
        res.status(500).json({ success: false, message: "Internal Security Handshake Failed" });
    }
});

// --- EXISTING SQUARE CHECKOUT ---
app.post('/checkout', async (req, res) => {
    const { sourceId, amount, customerEmail, items } = req.body;
    try {
        const amountInCents = BigInt(Math.round(parseFloat(amount) * 100));
        const { result } = await squareClient.paymentsApi.createPayment({
            sourceId: sourceId,
            idempotencyKey: crypto.randomBytes(12).toString('hex'),
            amountMoney: { amount: amountInCents, currency: 'USD' },
            buyerEmailAddress: customerEmail
        });
        sendOrderAlert(amount, customerEmail, items);
        res.json({ success: true, message: 'Payment Approved!', orderId: result.payment.id });
    } catch (error) {
        const detail = error.result?.errors?.[0]?.detail || "Payment Failed";
        res.status(400).json({ success: false, error: detail });
    }
});

app.listen(PORT, () => {
    console.log(`
    -------------------------------------------
    🚀 SOUND SHOP MULTI-SERVER ACTIVE 🚀
    Storefront Port: ${PORT}
    Security Bunker: Listening on Port 3001
    Blueprint: Square + Custom Gateway Handshake
    -------------------------------------------
    `);
});
