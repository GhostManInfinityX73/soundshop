const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
    // Set CORS headers so your index.html can talk to this script
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
                const timestamp = new Date().toLocaleString(); // Captures the exact date/time
                const orderID = "SS-" + Math.random().toString(36).substr(2, 9).toUpperCase();
                
                // This creates the documentation you requested
                const entry = `------------------------------------------\n` +
                              `DATE: ${timestamp}\n` +
                              `ORDER ID: ${orderID}\n` +
                              `PRODUCT: ${data.item}\n` +
                              `PRICE: ${data.amount}\n` +
                              `PAYMENT METHOD: WESTERN UNION\n` +
                              `STATUS: PENDING VERIFICATION\n` +
                              `------------------------------------------\n\n`;
                
                // Saves the entry to ledger.txt
                fs.appendFile('ledger.txt', entry, (err) => {
                    if (err) {
                        res.writeHead(500);
                        res.end("Error writing to Vault");
                    } else {
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
server.listen(PORT, () => {
    console.log(`SOUND SHOP VAULT: Active on Port ${PORT}`);
    console.log(`Documentation will be saved to ledger.txt`);
});
