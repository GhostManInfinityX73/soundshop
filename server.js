const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const sdk = require('authorizenet').APIContracts;
const controller = require('authorizenet').APIControllers;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURATION ---
app.use(cors());
app.use(bodyParser.json());
// Serves files from your soundshop directory
app.use(express.static('./')); 

const PUSHOVER_USER = "upumu7kpzvtszbf7cva9zp7rb45hq";
const PUSHOVER_TOKEN = "a9wb5v3s9xuev9mwi1b6ytoxmmr9hn";

// --- MOBILE ALERT FUNCTION ---
function sendOrderAlert(amount, email, items) {
    // Check if items exists and is an array before mapping
    const itemNames = (items && Array.isArray(items)) 
        ? items.map(i => i.name).join(', ') 
        : "Digital Product";
    
    axios.post('https://api.pushover.net/1/messages.json', {
        token: PUSHOVER_TOKEN,
        user: PUSHOVER_USER,
        title: "💰 NEW VAULT ORDER",
        message: `Total: $${amount}\nCustomer: ${email}\nItems: ${itemNames}`,
        sound: 'cashregister',
        priority: 1
    })
    .then(() => console.log("✅ Mobile alert sent to Pushover!"))
    .catch(err => console.error("❌ Pushover Error:", err.message));
}

// --- CHECKOUT ENDPOINT ---
app.post('/checkout', (req, res) => {
    const { dataDescriptor, dataValue, amount, customerEmail, items } = req.body;
    
    console.log(`---------------------------------`);
    console.log(`🎵 Processing Vault Order for: ${customerEmail}`);
    console.log(`💰 Amount: $${amount}`);

    // 1. Setup Authorize.net Auth
    const merchantAuthenticationType = new sdk.MerchantAuthenticationType();
    merchantAuthenticationType.setName(process.env.AUTH_NET_LOGIN_ID || "43cLv2Jb");
    merchantAuthenticationType.setTransactionKey(process.env.AUTH_NET_TRANS_KEY);

    // 2. Setup Payment Data (Opaque Data from Accept.js)
    const opaqueData = new sdk.OpaqueDataType();
    opaqueData.setDataDescriptor(dataDescriptor);
    opaqueData.setDataValue(dataValue);

    const paymentType = new sdk.PaymentType();
    paymentType.setOpaqueData(opaqueData);

    // 3. Create Transaction Request
    const transactionRequestType = new sdk.TransactionRequestType();
    transactionRequestType.setTransactionType(sdk.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
    transactionRequestType.setPayment(paymentType);
    transactionRequestType.setAmount(amount);

    const createRequest = new sdk.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuthenticationType);
    createRequest.setTransactionRequest(transactionRequestType);

    const ctrl = new controller.CreateTransactionController(createRequest.getJSON());
    
    // Use Sandbox environment for testing
    ctrl.setEnvironment("https://apitest.authorize.net/xml/v1/request.api");

    ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new sdk.CreateTransactionResponse(apiResponse);

        if (response != null && response.getMessages().getResultCode() === sdk.MessageTypeEnum.OK) {
            const transResponse = response.getTransactionResponse();
            
            if (transResponse && transResponse.getResponseCode() === '1') {
                const transId = transResponse.getTransId();
                console.log("✅ SUCCESS: Transaction ID", transId);

                // --- TRIGGER MOBILE NOTIFICATION ---
                sendOrderAlert(amount, customerEmail, items);

                res.json({ 
                    success: true, 
                    message: 'Payment Approved!', 
                    orderId: "SMR-" + transId 
                });
            } else {
                const errorText = transResponse ? transResponse.getErrors().getError()[0].getErrorText() : "Transaction Declined";
                console.log("❌ DECLINED: " + errorText);
                res.status(400).json({ success: false, error: errorText });
            }
        } else {
            const errorText = (response && response.getMessages()) ? response.getMessages().getMessage()[0].getText() : "Communication Error";
            console.log("❌ FAILED: " + errorText);
            res.status(400).json({ success: false, error: errorText });
        }
    });
});

app.listen(PORT, () => {
    console.log(`
    -------------------------------------------
    🚀 SOUND SHOP VAULT SERVER ACTIVE 🚀
    Port: ${PORT}
    Mobile Alerts: ENABLED (Pushover)
    -------------------------------------------
    `);
});
