/**
 * SOUND SHOP - Unified Infrastructure
 * FULL DRIVER SCRIPT: V1.5 (Bunker Sync Edition)
 */

const audioTracks = [
    { id: "5", name: "Grudge Gobbler", price: "19.99", sku: "SKU-TGG", file: "audio/tgg.m4a" },
    { id: "8", name: "Electro", price: "24.99", sku: "SKU-ELE", file: "audio/electro.m4a" },
    { id: "2", name: "Holding Heavy Weight", price: "29.99", sku: "SKU-HHW", file: "audio/holdenhw.m4a" }
];

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;
let cart = JSON.parse(localStorage.getItem('soundshop_cart')) || [];

function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

function renderCatalog() {
    const container = document.getElementById('product-container');
    if (!container) return;

    container.innerHTML = audioTracks.map(track => `
        <div class="track-card" style="background:rgba(18,18,18,0.8); border:1px solid rgba(0,255,204,0.2); padding:30px; border-radius:20px; margin-bottom:20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h2 style="color: #00ffcc; font-style: italic;">${track.name}</h2>
                    <p style="font-size: 0.6rem; opacity: 0.4; letter-spacing: 2px;">PRODUCT ID: 00${track.id}</p>
                </div>
                <div id="clock-${track.id}" style="color: #00ffcc; font-family: monospace;">0:00 / 0:00</div>
            </div>
            <canvas id="visualizer-${track.id}" style="width: 100%; height: 80px; background: rgba(0,0,0,0.3); border-radius: 10px; margin: 15px 0;"></canvas>
            <div style="display: flex; gap: 10px;">
                <button class="buy-btn" id="play-${track.id}" style="background: transparent; color: #00ffcc; border: 1px solid #00ffcc; padding:10px; cursor:pointer;">PLAY PREVIEW</button>
                <button class="buy-btn" onclick="addToCart('${track.name}', '${track.price}')" style="background: #00ffcc; color: #000; border:none; padding:10px; cursor:pointer; font-weight:bold;">LICENSE - $${track.price}</button>
            </div>
        </div>
    `).join('');

    audioTracks.forEach(track => setupStudioEngine(track));
}

function setupStudioEngine(track) {
    const audio = new Audio(track.file);
    const playBtn = document.getElementById(`play-${track.id}`);
    const clock = document.getElementById(`clock-${track.id}`);
    const canvas = document.getElementById(`visualizer-${track.id}`);
    const ctx = canvas.getContext("2d");
    let source, analyser;

    audio.onloadedmetadata = () => { clock.innerText = `0:00 / ${formatTime(audio.duration)}`; };
    audio.ontimeupdate = () => { clock.innerText = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`; };

    playBtn.onclick = function() {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audio.paused) {
            if (!source) {
                source = audioCtx.createMediaElementSource(audio);
                analyser = audioCtx.createAnalyser();
                source.connect(analyser);
                analyser.connect(audioCtx.destination);
            }
            audio.play();
            this.innerText = "PAUSE";
            drawVisuals(analyser, ctx, canvas, audio);
        } else {
            audio.pause();
            this.innerText = "PLAY PREVIEW";
        }
    };
}

function drawVisuals(analyser, ctx, canvas, audio) {
    if (audio.paused) return;
    requestAnimationFrame(() => drawVisuals(analyser, ctx, canvas, audio));
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < dataArray.length; i++) {
        ctx.fillStyle = '#00ffcc';
        ctx.fillRect(i * 3, canvas.width, 2, -(dataArray[i]/2));
    }
}

function addToCart(name, price) {
    // This looks for the modal function defined in index.html
    if (typeof openPaymentModal === "function") {
        openPaymentModal(name, price);
    } else {
        // Fallback for pages without the built-in gateway
        cart.push({ name, price });
        localStorage.setItem('soundshop_cart', JSON.stringify(cart));
        window.location.href = "checkout.html";
    }
}

window.onload = renderCatalog;
