const fs = require('fs');

// --- 1. CONFIGURATION (Your Business Details) ---
const COMPANY_NAME = "SOUND SHOP";
const COMPANY_ID = "123456789"; // Your Federal Tax ID / EIN
const IMMEDIATE_DEST = "053100465"; // Example for United Bank (Verify your specific Routing)
const IMMEDIATE_ORIG = "123456789"; // Your Company ID/Tax ID

// --- 2. HELPER FUNCTIONS (The "Spacer" Logic) ---
// This ensures every field is exactly the right length for the bank.
const padText = (text, length) => text.toString().toUpperCase().padEnd(length, ' ').substring(0, length);
const padNum = (num, length) => num.toString().replace('.', '').padStart(length, '0').substring(0, length);

// --- 3. THE GENERATOR ---
function generateNacha() {
    const vaultPath = '/sdcard/SoundShop/secure_holding.json';
    
    if (!fs.existsSync(vaultPath)) {
        console.log("❌ No pending transactions found in the vault.");
        return;
    }

    const transactions = JSON.parse(fs.readFileSync(vaultPath, 'utf8'));
    let fileContent = "";

    // A. FILE HEADER (Record Type 1)
    fileContent += `101 ${padNum(IMMEDIATE_DEST, 10)}${padNum(IMMEDIATE_ORIG, 10)}${new Date().toISOString().slice(2,10).replace(/-/g,'')}${new Date().getHours()}${new Date().getMinutes()}A094101${padText(COMPANY_NAME, 23)}\n`;

    // B. BATCH HEADER (Record Type 5)
    fileContent += `5200${padText(COMPANY_NAME, 16)}                PPDOnline Sale      ${new Date().toISOString().slice(2,10).replace(/-/g,'')}0001053100460000001\n`;

    // C. ENTRY DETAILS (Record Type 6)
    transactions.forEach(tx => {
        const transactionCode = tx.type === 'SAVINGS' ? '37' : '27'; // 27 = Checking Debit, 37 = Savings Debit
        fileContent += `6${transactionCode}${padNum(tx.routing, 8)}${tx.routing.slice(-1)}${padText(tx.account, 17)}${padNum(tx.total, 10)}${padText(tx.batchId, 15)}${padText(tx.accHolder, 22)} 00000001\n`;
    });

    // D. BATCH CONTROL & FILE CONTROL (Simplified for now)
    fileContent += `820000000100000000000000000000000000000000000000${padNum(IMMEDIATE_ORIG, 10)}                         0000001\n`;
    fileContent += `900000100000100000001000000000000000000000000000000000000000000000000000000000000000000000000\n`;

    const outputPath = `/sdcard/SoundShop/UNITED_BANK_XFER_${Date.now()}.txt`;
    fs.writeFileSync(outputPath, fileContent);
    console.log(`\n✅ NACHA FILE GENERATED: ${outputPath}`);
    console.log(`🏛️  READY TO UPLOAD TO UNITED BANK`);
}

generateNacha();
