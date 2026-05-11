const express = require('express');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const fs = require('fs');
const cors = require('cors');
const nodemailer = require('nodemailer');
const sdk = require('authorizenet').APIContracts;
const controller = require('authorizenet').APIControllers;
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// --- ENVIRONMENT TOGGLE (FIXED FOR TERMUX/NODE) ---
const SANDBOX_URL = "https://apitest.authorize.net/xml/v1/request.api";
const PRODUCTION_URL = "https://api.authorize.net/xml/v1/request.api";

// This chooses the URL based on your .env setting
const RUN_MODE = process.env.NODE_ENV === 'production' ? PRODUCTION_URL : SANDBOX_URL;

// --- INITIALIZATION & VERIFICATION ---
if (!process.env.AUTH_NET_LOGIN_ID || !process.env.AUTH_NET_TRANS_KEY || !process.env.EMAIL_PASS) {
    console.error("❌ ERROR: Required credentials (.env) are missing!");
} else {
    console.log(`✅ LIVE ENGINE: All Systems Ready.`);
    console.log(`🌐 TARGET: ${RUN_MODE === PRODUCTION_URL ? 'PRODUCTION' : 'SANDBOX'}`);
}

app.use(cors());
app.use(express.static(__dirname));
app.use(bodyParser.json({
    verify: (req, res, buf) => { req.rawBody = buf.toString(); }
}));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

function getMerchantAuth() {
    const auth = new sdk.MerchantAuthenticationType();
    auth.setName(process.env.AUTH_NET_LOGIN_ID);
    auth.setTransactionKey(process.env.AUTH_NET_TRANS_KEY);
    return auth;
}

// --- THE EMAIL DISPATCHER ---
async function sendVaultEmail(customerEmail, type, detail) {
    let subject, htmlContent;

    if (type === 'FREE') {
        subject = "🔑 YOUR VAULT KEY: Sound Shop Access";
        htmlContent = `<div style="background:#050505; color:#fff; padding:40px; font-family:sans-serif; border: 1px solid #00ffcc;">
            <h1 style="color:#00ffcc; letter-spacing:5px; text-transform:uppercase;">Access Granted</h1>
            <p>Welcome to the Vault. Your cinematic asset library is ready.</p>
            <a href="http://localhost:3000/vault.html?email=${encodeURIComponent(customerEmail)}"
               style="display:inline-block; padding:15px 25px; background:#00ffcc; color:#000; text-decoration:none; font-weight:bold; border-radius:50px;">OPEN THE VAULT</a>
        </div>`;
    } else if (type === 'PRO') {
        subject = "⚡ PRO ACCESS ACTIVATED: Sound Shop";
        htmlContent = `<h1 style="color:#00ffcc;">Welcome, Pro Member</h1><p>Your subscription is active. Full commercial licensing is now tied to ${customerEmail}.</p>`;
    } else {
        subject = "📦 GEAR SECURED: Sound Shop Order";
        htmlContent = `<h1 style="color:#00ffcc;">Order Confirmed</h1><p>We're prepping your ${detail || 'order'}. We'll email your tracking number shortly.</p>`;
    }

    try {
        await transporter.sendMail({
            from: `"Sound Shop" <${process.env.EMAIL_USER}>`,
            to: customerEmail,
            subject: subject,
            html: htmlContent
        });
        console.log(`📧 Email sent to ${customerEmail}`);
    } catch (error) { console.error("❌ Email Error:", error); }
}

// --- CATALOG ---
app.get('/api/catalog', (req, res) => {
    try {
        const data = fs.readFileSync('./products.json', 'utf8');
        res.json(JSON.parse(data));
    } catch (err) { res.status(500).json({ error: "Catalog file missing." }); }
});

// --- ONE-TIME SALES ---
app.post('/checkout', (req, res) => {
    const { opaqueData: incomingOpaque, trackName, customerEmail, amount } = req.body;

    const opaqueData = new sdk.OpaqueDataType();
    opaqueData.setDataDescriptor(incomingOpaque.dataDescriptor);
    opaqueData.setDataValue(incomingOpaque.dataValue);

    const paymentType = new sdk.PaymentType();
    paymentType.setOpaqueData(opaqueData);

    const transactionRequestType = new sdk.TransactionRequestType();
    transactionRequestType.setTransactionType(sdk.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
    transactionRequestType.setPayment(paymentType);
    transactionRequestType.setAmount(amount);

    const createRequest = new sdk.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(getMerchantAuth());
    createRequest.setTransactionRequest(transactionRequestType);

    const ctrl = new controller.CreateTransactionController(createRequest.getJSON());
    ctrl.setEnvironment(RUN_MODE);

    ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new sdk.CreateTransactionResponse(apiResponse);

        if (response != null && response.getMessages().getResultCode() === sdk.MessageTypeEnum.OK) {
            const transId = response.getTransactionResponse().getTransId();
            fs.appendFileSync('./orders.json', JSON.stringify({ transId, customerEmail, trackName, date: new Date() }) + '\n');
            sendVaultEmail(customerEmail, 'GEAR', trackName);
            res.json({ success: true, transactionId: transId });
        } else {
            res.status(400).json({ success: false, error: "Transaction Declined" });
        }
    });
});

// --- SUBSCRIPTIONS ---
app.post('/subscribe', (req, res) => {
    const { opaqueData: incomingOpaque, customerEmail, customerName } = req.body;

    const interval = new sdk.PaymentScheduleType.Interval();
    interval.setLength(1);
    interval.setUnit(sdk.ARBIntervalUnitEnum.MONTHS);

    const schedule = new sdk.PaymentScheduleType();
    schedule.setInterval(interval);
    schedule.setStartDate(new Date().toISOString().substring(0, 10));
    schedule.setTotalOccurrences(9999);

    const opData = new sdk.OpaqueDataType();
    opData.setDataDescriptor(incomingOpaque.dataDescriptor);
    opData.setDataValue(incomingOpaque.dataValue);

    const payment = new sdk.PaymentType();
    payment.setOpaqueData(opData);

    const sub = new sdk.ARBSubscriptionType();
    sub.setName("Sound Shop Pro Membership");
    sub.setPaymentSchedule(schedule);
    sub.setAmount(19.99);
    sub.setPayment(payment);

    const createRequest = new sdk.ARBCreateSubscriptionRequest();
    createRequest.setMerchantAuthentication(getMerchantAuth());
    createRequest.setSubscription(sub);

    const ctrl = new controller.ARBCreateSubscriptionController(createRequest.getJSON());
    ctrl.setEnvironment(RUN_MODE);

    ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new sdk.ARBCreateSubscriptionResponse(apiResponse);

        if (response != null && response.getMessages().getResultCode() === sdk.MessageTypeEnum.OK) {
            const subId = response.getSubscriptionId();
            fs.appendFileSync('./members.json', JSON.stringify({ subId, customerEmail, type: "PRO", date: new Date() }) + '\n');
            sendVaultEmail(customerEmail, 'PRO');
            res.json({ success: true, subscriptionId: subId });
        } else {
            res.status(400).json({ success: false, error: "Subscription Failed" });
        }
    });
});

// --- ACTIVITY LOGGING ---
app.post('/api/log-activity', async (req, res) => {
    const { email, action, item } = req.body;
    const userIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    let location = "Localhost/Unknown";
    if (userIp !== '::1' && userIp !== '127.0.0.1') {
        try {
            const geoRes = await fetch(`https://ipapi.co/${userIp}/json/`);
            const geoData = await geoRes.json();
            location = geoData.city ? `${geoData.city}, ${geoData.region}` : location;
        } catch (e) { console.log("🌐 GeoIP Lookup Skipped"); }
    }

    const logEntry = { time: new Date().toLocaleString(), email, action, item, location };
    fs.appendFileSync('./activity_log.json', JSON.stringify(logEntry) + '\n');
    console.log(`🔔 [LOG] ${logEntry.time} | ${email} | ${action} | ${location}`);
    res.status(200).send('Logged');
});

app.listen(port, () => console.log(`🚀 SOUND SHOP ENGINE: ONLINE ON PORT ${port} 🚀`));
