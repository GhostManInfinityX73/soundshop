const http = require('http');
const fs = require('fs');
const { exec } = require('child_process'); // Needed to run your notify.sh

const server = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/log-payment') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const timestamp = new Date().toLocaleString();
                const orderID = "SS-" + Math.random().toString(36).substr(2, 9).toUpperCase();
                
                const entry = `------------------------------------------\n` +
                              `DATE: ${timestamp}\n` +
                              `ORDER ID: ${orderID}\n` +
                              `PRODUCT: ${data.item}\n` +
                              `PRICE: ${data.amount}\n` +
                              `PAYMENT METHOD: WESTERN UNION\n` +
                              `STATUS: PENDING VERIFICATION\n` +
                              `------------------------------------------\n\n`;
                
                fs.appendFile('ledger.txt', entry, (err) => {
                    if (err) {
                        res.writeHead(500);
                        res.end("Error writing to Vault");
                    } else {
                        // --- NOTIFICATION TRIGGER START ---
                        exec('./notify.sh', (notifyErr) => {
                            if (notifyErr) {
                                console.error(`Alert Failed: ${notifyErr}`);
                            } else {
                                console.log(`Notification Fired for ${orderID}`);
                            }
                        });
                        // --- NOTIFICATION TRIGGER END ---

                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ orderID: orderID }));
                        console.log(`Order Logged: ${orderID} for ${data.item}`);
                    }
                });
            } catch (e) {
                res.writeHead(400);
                res.end("Invalid Request");
            }
        });
    }
});

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`SOUND SHOP VAULT: Active on Port ${PORT}`);
    console.log(`Documentation will be saved to ledger.txt`);
});

