function openChat() {
  console.log("Sound Shop Widget Toggled");
  const chatPopup = document.getElementById('chat-popup');
  chatPopup.classList.toggle('active');
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('support-ticket-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('user-name').value;
      const rawMessage = document.getElementById('user-message').value;
      const userMessage = `New Support Ticket from Site\nName: ${name}\nMessage: ${rawMessage}`;
      sendSupportTicket(userMessage);
      alert('Sound Alert Sent to Admin! We will get back to you shortly.');
      document.getElementById('chat-popup').classList.remove('active');
      form.reset();
    });
  }
});

function sendSupportTicket(userMessage) {
  const audio = new Audio('alert.mp3');
  audio.play().catch(err => {
    console.log("Audio waiting for user interaction.", err);
  });
  const ticketData = {
    message: userMessage,
    timestamp: new Date().toISOString()
  };
  console.log("Attempting Handshake to process.php...");
  fetch('process.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ticketData)
  })
  .then(res => res.json())
  .then(data => {
    if (data.status === 'success') {
      console.log("Alert Sent to Admin!");
    } else {
      console.error("PHP Error:", data.error);
    }
  })
  .catch(err => {
    console.error("Handshake Error:", err);
  });
}
