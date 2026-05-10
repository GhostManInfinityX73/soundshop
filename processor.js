const transport = require('./transport'); // Import the new courier

async function processInstruction(token, amount, meta) {
    console.log(`\n[PROCESSOR] Creating Instruction for United Bank...`);
    
    const instruction = createISO8583Message(amount, meta);
    
    // HERE IS THE NEW LINK: Send it to the transport layer
    const bankResponse = await transport.sendToClearinghouse(instruction);

    return {
        status: bankResponse.status === "00" ? "AUTHORIZED" : "DECLINED",
        authCode: bankResponse.approvalCode,
        timestamp: new Date().getTime(),
        instruction_payload: instruction
    };
}
