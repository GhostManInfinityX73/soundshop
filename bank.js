const net = require('net');
const server = net.createServer((s) => {
console.log('🏦 VAULT LINK ACTIVE');
s.on('data', (d) => {
console.log('📦 DATA:', d.toString());
s.write('0210|APPROVED|00');
});
});
server.listen(5000, '127.0.0.1', () => {
console.log('🛡️ SOUND SHOP BANK LIVE ON PORT 5000');
});