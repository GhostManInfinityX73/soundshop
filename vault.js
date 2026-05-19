const http = require('http');
const fs = require('fs');
const { exec } = require('child_process'); // Needed to execute your sound pulse alert script

const server = http.createServer((req, res) => {
    // 1. Set explicit CORS headers to let requests from your live website through
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 2. Handle preflight browser options checks instantly
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // 3. Process the live incoming handshakes
    if (req.method === 'POST' && req.url === '/log-payment') {
        let body = '';
        
        // Collect data streams safely
        req.on('data', chunk => { body += chunk.toString(); });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const timestamp = new Date().toLocaleString();
                
                // Generate a uniform unique tracking reference ID
                const orderID = "SS-" + Math.random().toString(36).substr(2, 9).toUpperCase();
                
                // Smart check: Identify if this payload is a system chat message or a shopping cart order
                const isChat = data.item && data.item.includes("Bunker Chat:");
                
                const labelType  = isChat ? "DATA LOG" : "PRICE";
                const methodType = isChat ? "SYSTEM INTERACTION" : "WESTERN UNION";
                const statusType = isChat ? "LOGGED LIVE" : "PENDING VERIFICATION";
                
                // Format the entry cleanly so ledger.txt is organized perfectly
                const entry = `------------------------------------------\n` +
                              `DATE: ${timestamp}\n` +
                              `ORDER ID: ${orderID}\n` +
                              `PRODUCT/CONTENT: ${data.item}\n` +
                              `${labelType}: ${data.amount}\n` +
                              `METHOD: ${methodType}\n` +
                              `STATUS: ${statusType}\n` +
                              `------------------------------------------\n\n`;
                
                // Commit data straight to your local device file ledger
                fs.appendFile('ledger.txt', entry, (err) => {
                    if (err) {
                        console.error("Vault Write Failure:", err);
                        res.writeHead(500);
                        res.end("Error writing to Vault");
                    } else {
                        // --- NOTIFICATION TRIGGER START ---
                        // Fires your bash shell notify script on incoming success
                        exec('./notify.sh', (notifyErr) => {
                            if (notifyErr) {
                                console.error(`Alert Script Failed: ${notifyErr}`);
                            } else {
                                console.log(`Sound Pulse Alert Notification Fired for ${orderID}`);
                            }
                        });
                        // --- NOTIFICATION TRIGGER END ---

                        // Send back the valid transaction object JSON payload to satisfy frontend expectations
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ orderID: orderID }));
                        
                        console.log(`Payload Logged Successfully: ${orderID} | ${data.item}`);
                    }
                });
            } catch (e) {
                console.error("Payload Parsing Error:", e);
                res.writeHead(400);
                res.end("Invalid Request Data");
            }
        });
    } else {
        // Fallback for any other endpoint requests
        res.writeHead(404);
        res.end("Endpoint Not Found");
    }
});

// Port configuration designated for the live Cloudflare tunnel mapping
const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`SOUND SHOP VAULT: Active on Port ${PORT}`);
    console.log(`Documentation will be saved to ledger.txt`);
});
