/**
 * SOUND SHOP - Unified Infrastructure
 * Featuring: Live Bounce, Real-Time Time Clock, & Secure Checkout
 */

const introText = "With at least 25 years of industry experience, I specialize in crafting high-impact soundtracks. Explore the drop.";
let charIndex = 0;

const audioTracks = [
    { id: "5", name: "Grudge Gobbler", price: "19.99", sku: "SKU-TGG", file: "audio/grudgegobbler.m4a" },
    { id: "7", name: "The Rumbler", price: "24.99", sku: "SKU-RUM", file: "audio/rumbler.m4a" },
    { id: "2", name: "Holding Heavy Weight", price: "29.99", sku: "SKU-HHW", file: "audio/holdenhw.m4a" }
];

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

// --- 1. FORMAT TIME HELPER ---
function formatTime(seconds) {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// --- 2. RENDER CATALOG ---
function renderCatalog() {
    const container = document.getElementById('product-container');
    if (!container) return;

    container.innerHTML = audioTracks.map(track => `
        <div class="track-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                <div>
                    <h2 style="color: #00ffcc; font-style: italic; font-size: 1.4rem;">${track.name}</h2>
                    <p style="font-size: 0.6rem; opacity: 0.4; letter-spacing: 2px;">PRODUCT ID: 00${track.id}</p>
                </div>
                <div id="clock-${track.id}" style="color: #00ffcc; font-family: monospace; font-size: 0.8rem; background: rgba(0,0,0,0.5); padding: 4px 8px; border-radius: 5px;">0:00 / 0:00</div>
            </div>
            
            <canvas id="visualizer-${track.id}" style="width: 100%; height: 100px; background: rgba(0,0,0,0.3); border-radius: 12px; margin: 15px 0; border: 1px solid rgba(0,255,204,0.1);"></canvas>

            <div style="display: flex; gap: 10px;">
                <button class="buy-btn" id="play-${track.id}" style="background: rgba(255,255,255,0.05); color: #00ffcc; border: 1px solid #00ffcc;">PLAY PREVIEW</button>
                <button class="buy-btn" onclick="addToCart('${track.name}', '${track.price}', 'audio')">LICENSE - $${track.price}</button>
            </div>
        </div>
    `).join('');

    audioTracks.forEach(track => setupStudioEngine(track));
}

// --- 3. THE STUDIO ENGINE (Handles the Bounce & the Clock) ---
function setupStudioEngine(track) {
    const audio = new Audio(track.file);
    const playBtn = document.getElementById(`play-${track.id}`);
    const clock = document.getElementById(`clock-${track.id}`);
    const canvas = document.getElementById(`visualizer-${track.id}`);
    const ctx = canvas.getContext("2d");
    let source, analyser;

    audio.onloadedmetadata = () => {
        clock.innerText = `0:00 / ${formatTime(audio.duration)}`;
    };

    audio.ontimeupdate = () => {
        clock.innerText = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
    };

    playBtn.onclick = function() {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();

        if (audio.paused) {
            if (!source) {
                source = audioCtx.createMediaElementSource(audio);
                analyser = audioCtx.createAnalyser();
                source.connect(analyser);
                analyser.connect(audioCtx.destination);
                analyser.fftSize = 64;
            }
            audio.play();
            this.innerText = "PAUSE PREVIEW";
            drawBounce(analyser, ctx, canvas, audio);
        } else {
            audio.pause();
            this.innerText = "PLAY PREVIEW";
        }
    };
}

function drawBounce(analyser, ctx, canvas, audio) {
    if (audio.paused) return;
    requestAnimationFrame(() => drawBounce(analyser, ctx, canvas, audio));
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const barWidth = (canvas.width / dataArray.length) * 2.5;
    let x = 0;
    for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        ctx.fillStyle = '#00ffcc';
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 4, barHeight);
        x += barWidth;
    }
}

// --- 4. RIM SIGNATURE LOGIC (Integrated) ---
let hasSigned = false;

function setupSignaturePad() {
    const sigCanvas = document.getElementById('sig-canvas');
    if (!sigCanvas) return;

    const sigCtx = sigCanvas.getContext('2d');
    let drawing = false;

    // Detect if Rims are in the cart (Assuming you store cart in localStorage)
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const hasRims = cart.some(item => item.name.toLowerCase().includes('rim'));

    if (hasRims) {
        document.getElementById('rim-signature-area').style.display = 'block';
    }

    // Signature Drawing Controls
    sigCanvas.addEventListener('mousedown', () => drawing = true);
    window.addEventListener('mouseup', () => {
        drawing = false;
        sigCtx.beginPath();
    });

    sigCanvas.addEventListener('mousemove', (e) => {
        if (!drawing) return;
        const rect = sigCanvas.getBoundingClientRect();
        sigCtx.lineWidth = 2;
        sigCtx.lineCap = 'round';
        sigCtx.strokeStyle = '#000'; // Black ink on white canvas
        sigCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        sigCtx.stroke();
        hasSigned = true; // Flag that they actually signed
    });

    // Clear Button
    const clearBtn = document.getElementById('sig-clearBtn');
    if (clearBtn) {
        clearBtn.onclick = () => {
            sigCtx.clearRect(0, 0, sigCanvas.width, sigCanvas.height);
            hasSigned = false;
        };
    }
}

// --- 5. INITIALIZE ON LOAD ---
window.onload = () => {
    renderCatalog();
    setupSignaturePad();
};
