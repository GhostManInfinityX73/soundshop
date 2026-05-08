const fs = require('fs');
const path = require('path');

const LEDGER_PATH = path.join(__dirname, 'ledger.json');

function displayStats() {
    if (!fs.existsSync(LEDGER_PATH)) {
        console.log("No transactions recorded yet.");
        return;
    }

    const data = JSON.parse(fs.readFileSync(LEDGER_PATH, 'utf8'));
    
    console.log("\n--- SOUND SHOP ADMIN DASHBOARD ---");
    console.log(`TOTAL TRANSACTIONS: ${data.length}`);
    
    const totalRevenue = data.reduce((sum, item) => sum + item.amount, 0);
    console.log(`TOTAL REVENUE: $${totalRevenue.toFixed(2)}`);
    console.log("----------------------------------\n");

    console.log("RECENT ACTIVITY:");
    data.slice(-5).reverse().forEach(t => {
        console.log(`[${t.timestamp.split('T')[1].split('.')[0]}] ${t.track} - $${t.amount} (${t.status})`);
    });
}

displayStats();
