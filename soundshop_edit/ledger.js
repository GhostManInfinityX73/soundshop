const fs = require('fs');
const path = require('path');

const LEDGER_PATH = path.join(__dirname, 'ledger.json');

// Initialize ledger if it doesn't exist
if (!fs.existsSync(LEDGER_PATH)) {
    fs.writeFileSync(LEDGER_PATH, JSON.stringify([], null, 2));
}

function logTransaction(data) {
    try {
        const fileContent = fs.readFileSync(LEDGER_PATH, 'utf8');
        const transactions = JSON.parse(fileContent);

        const record = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            track: data.meta,
            amount: data.amount,
            authCode: data.authCode,
            stan: data.stan,
            status: data.status
        };

        transactions.push(record);
        fs.writeFileSync(LEDGER_PATH, JSON.stringify(transactions, null, 2));
        console.log(`[LEDGER] SUCCESS: Record saved for STAN ${record.stan}`);
    } catch (err) {
        console.error("[LEDGER ERROR]:", err.message);
    }
}

module.exports = { logTransaction };
