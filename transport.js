// SOUND SHOP GATEWAY - TRANSPORT LAYER
// Purpose: Secure delivery of financial instructions

const crypto = require('crypto');

/**
 * THE SECURE RELAY (Simulating United Bank Handshake)
 */
async function sendToClearinghouse(payload) {
    console.log("[TRANSPORT] Opening Secure Socket to United Bank Relay...");
    
    // Simulating the network latency of a real bank authorization (1.2 seconds)
    return new Promise((resolve) => {
        setTimeout(() => {
            // Logic to simulate a bank response based on the ISO-8583 fields
            const isAuthorized = true; // For our sandbox testing
            
            const bankResponse = {
                mti: "0210", // 0210 is the standard ISO response for a 0200 request
                status: isAuthorized ? "00" : "05", // "00" is Approved, "05" is Declined
                approvalCode: "UB-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
                networkTrace: payload.fields[11] // Matches the STAN we sent
            };

            console.log(`[TRANSPORT] Response Received: ${bankResponse.status} (APPROVED)`);
            resolve(bankResponse);
        }, 1200);
    });
}

module.exports = { sendToClearinghouse };
