require('dotenv').config();
const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || null;

app.use(express.static('public'));
app.use(express.json());

let qrCodeData = null;
let sessionGenerated = false;
let sessionId = null;
let pairingCode = null;
let activeSocket = null;
let generationInProgress = false;
let qrTimeout = null;
let phoneTimeout = null;

// Telegram Bot Commands Configuration
const TELEGRAM_COMMANDS = {
  '/start': {
    description: 'Welcome message',
    handler: 'showWelcomeMessage'
  },
  '/pair': {
    description: 'Generate WhatsApp pair code',
    handler: 'generatePairingCode'
  },
  '/ping': {
    description: 'Check bot latency',
    handler: 'checkLatency'
  },
  '/help': {
    description: 'Show this menu',
    handler: 'showHelpMenu'
  },
  '/generate_session': {
    description: 'Generate WhatsApp session',
    handler: 'generateSession'
  },
  '/qr': {
    description: 'Generate QR code',
    handler: 'generateQRCode'
  },
  '/status': {
    description: 'Check session status',
    handler: 'checkSessionStatus'
  }
};

// Log startup info
console.log('🚀 SIMON-TECH-BOT v2.0.0 Starting...');
console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📱 Port: ${PORT}`);
if (TELEGRAM_BOT_TOKEN) {
  console.log('✅ Telegram Bot Token loaded');
  console.log(`🤖 Telegram Commands Available: ${Object.keys(TELEGRAM_COMMANDS).length}`);
} else {
  console.log('⚠️  No Telegram Bot Token found (optional)');
}

// Ensure sessions directory exists
const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) {
  fs.mkdirSync(sessionsDir, { recursive: true });
}

// Helper function to reset state
function resetState(method = 'all') {
  if (method === 'qr' || method === 'all') {
    qrCodeData = null;
    if (qrTimeout) clearTimeout(qrTimeout);
  }
  if (method === 'phone' || method === 'all') {
    pairingCode = null;
    if (phoneTimeout) clearTimeout(phoneTimeout);
  }
  if (method === 'all') {
    sessionGenerated = false;
    sessionId = null;
    generationInProgress = false;
    if (activeSocket) {
      try {
        activeSocket.end();
      } catch (e) {}
      activeSocket = null;
    }
  }
}

// Session Generator with QR Code method
async function generateSessionQR() {
  if (generationInProgress) {
    console.log('⚠️  Session generation already in progress');
    return;
  }

  generationInProgress = true;
  resetState('qr');

  try {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(sessionsDir, 'SIMON'));

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
    });

    activeSocket = sock;

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrCodeData = qr;
        sessionGenerated = false;
        console.log('✅ QR Code generated. Scan it with your WhatsApp app.');

        // Set QR code expiration timeout (60 seconds)
        if (qrTimeout) clearTimeout(qrTimeout);
        qrTimeout = setTimeout(() => {
          console.log('⏰ QR Code expired. Please generate a new one.');
          resetState('qr');
        }, 60000);
      }

      if (connection === 'open') {
        sessionGenerated = true;
        sessionId = 'SIMON';
        console.log('✅ Session generated successfully via QR!');
        console.log(`📱 Session ID: ${sessionId}`);

        // Generate SESSION_ID string
        const credentialsPath = path.join(sessionsDir, 'SIMON', 'creds.json');
        if (fs.existsSync(credentialsPath)) {
          const credentials = JSON.stringify(require(credentialsPath));
          const encodedSession = Buffer.from(credentials).toString('base64');
          sessionId = encodedSession;
          console.log(`\n🔐 Your SESSION_ID (Base64):\n${sessionId}\n`);
        }
        
        generationInProgress = false;
      }

      if (connection === 'close') {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if (shouldReconnect && generationInProgress) {
          console.log('🔄 Reconnecting...');
          setTimeout(generateSessionQR, 3000);
        } else if (!shouldReconnect) {
          console.log('❌ QR Session ended (logged out)');
          resetState('qr');
          generationInProgress = false;
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

  } catch (error) {
    console.error('Error generating session:', error);
    generationInProgress = false;
    resetState('qr');
  }
}

// Session Generator with Phone Number Pairing
async function generateSessionPhone(phoneNumber) {
  if (generationInProgress) {
    console.log('⚠️  Session generation already in progress');
    return;
  }

  // Validate phone number format
  if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.length < 10) {
    console.error('❌ Invalid phone number format');
    pairingCode = 'INVALID_PHONE';
    return;
  }

  generationInProgress = true;
  resetState('phone');

  try {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(sessionsDir, 'SIMON_PHONE'));

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
    });

    activeSocket = sock;

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'open') {
        sessionGenerated = true;
        sessionId = 'SIMON_PHONE';
        console.log('✅ Session generated successfully via Phone!');
        console.log(`📱 Session ID: ${sessionId}`);

        // Generate SESSION_ID string
        const credentialsPath = path.join(sessionsDir, 'SIMON_PHONE', 'creds.json');
        if (fs.existsSync(credentialsPath)) {
          const credentials = JSON.stringify(require(credentialsPath));
          const encodedSession = Buffer.from(credentials).toString('base64');
          sessionId = encodedSession;
          console.log(`\n🔐 Your SESSION_ID (Base64):\n${sessionId}\n`);
        }

        generationInProgress = false;
      }

      if (connection === 'close') {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

        if (shouldReconnect && generationInProgress) {
          console.log('🔄 Reconnecting...');
          setTimeout(() => generateSessionPhone(phoneNumber), 3000);
        } else if (!shouldReconnect) {
          console.log('❌ Phone Session ended (logged out)');
          resetState('phone');
          generationInProgress = false;
        }
      }
    });

    // Wait for socket to be ready before requesting pairing code
    sock.ev.on('connection.update', async (update) => {
      if (update.connection === 'connecting') {
        // Socket is connecting, wait a bit more
        return;
      }
    });

    // Request pairing code after a short delay to ensure socket is ready
    setTimeout(async () => {
      try {
        if (!sock.authState.creds.registered) {
          const code = await sock.requestPairingCode(phoneNumber);
          pairingCode = code;
          console.log(`\n📱 Pairing Code: ${code}\n`);

          // Set pairing code timeout (120 seconds for phone pairing)
          if (phoneTimeout) clearTimeout(phoneTimeout);
          phoneTimeout = setTimeout(() => {
            console.log('⏰ Pairing code expired. Please request a new one.');
            resetState('phone');
          }, 120000);
        }
      } catch (error) {
        console.error('Error requesting pairing code:', error);
        pairingCode = null;
        generationInProgress = false;
      }
    }, 2000);

    sock.ev.on('creds.update', saveCreds);

  } catch (error) {
    console.error('Error generating session via phone:', error);
    generationInProgress = false;
    pairingCode = null;
    resetState('phone');
  }
}

// Telegram Command Handlers
function getCommandsList() {
  let commands = '📋 **Available Commands:**\n\n';
  for (const [cmd, info] of Object.entries(TELEGRAM_COMMANDS)) {
    commands += `${cmd} — ${info.description}\n`;
  }
  return commands;
}

function getWelcomeMessage() {
  return `🤖 Welcome to SIMON-TECH-BOT!\n\n` +
    `This bot helps you generate WhatsApp sessions for automation.\n\n` +
    `✨ Features:\n` +
    `• Generate WhatsApp session via QR Code\n` +
    `• Generate session via Phone Number pairing\n` +
    `• Check bot status and latency\n\n` +
    `Use /help to see all available commands.`;
}

function getHelpMenu() {
  return `🆘 **Help Menu**\n\n` +
    `${getCommandsList()}\n` +
    `📖 Examples:\n` +
    `/start - Start the bot\n` +
    `/pair - Generate WhatsApp pair code\n` +
    `/qr - Generate QR code for session\n` +
    `/status - Check current session status\n\n` +
    `For more info, visit: https://github.com/vivi-v4/SIMON-TECH-bot2`;
}

// Web UI
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SIMON-TECH-BOT - Session Generator</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        .container {
          background: white;
          border-radius: 15px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          max-width: 700px;
          width: 100%;
          padding: 40px;
          text-align: center;
        }
        h1 {
          color: #333;
          margin-bottom: 10px;
          font-size: 28px;
        }
        .subtitle {
          color: #666;
          margin-bottom: 30px;
          font-size: 14px;
        }
        .tabs {
          display: flex;
          gap: 10px;
          margin: 20px 0;
          border-bottom: 2px solid #eee;
        }
        .tab-btn {
          flex: 1;
          padding: 12px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          color: #999;
          border-bottom: 3px solid transparent;
          transition: all 0.3s;
        }
        .tab-btn.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }
        .tab-content {
          display: none;
        }
        .tab-content.active {
          display: block;
        }
        .qr-container {
          margin: 30px 0;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 10px;
          display: none;
        }
        .qr-container.active {
          display: block;
        }
        #qrCode {
          max-width: 300px;
          width: 100%;
          margin: 0 auto;
        }
        .button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          margin: 10px 5px;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        .button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .input-group {
          margin: 20px 0;
          text-align: left;
        }
        .input-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }
        .input-group input {
          width: 100%;
          padding: 10px;
          border: 2px solid #ddd;
          border-radius: 5px;
          font-size: 14px;
          transition: border-color 0.3s;
        }
        .input-group input:focus {
          outline: none;
          border-color: #667eea;
        }
        .session-display {
          margin: 20px 0;
          padding: 15px;
          background: #f0f4ff;
          border-radius: 8px;
          display: none;
          word-break: break-all;
          max-height: 200px;
          overflow-y: auto;
          text-align: left;
          border: 2px solid #667eea;
          font-size: 12px;
          font-family: monospace;
        }
        .session-display.active {
          display: block;
        }
        .copy-btn {
          background: #28a745;
          margin-top: 10px;
        }
        .copy-btn:hover {
          box-shadow: 0 10px 20px rgba(40, 167, 69, 0.3);
        }
        .status {
          padding: 10px;
          border-radius: 5px;
          margin: 15px 0;
          display: none;
          font-weight: bold;
        }
        .status.active {
          display: block;
        }
        .status.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        .status.waiting {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }
        .status.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        .info {
          background: #e7f3ff;
          padding: 15px;
          border-radius: 8px;
          margin: 20px 0;
          font-size: 14px;
          color: #004085;
          border-left: 4px solid #004085;
          text-align: left;
        }
        .pairing-code {
          background: #fff3cd;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          font-size: 18px;
          font-weight: bold;
          color: #856404;
          font-family: monospace;
          letter-spacing: 2px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 SIMON-TECH-BOT</h1>
        <p class="subtitle">WhatsApp Session Generator v2</p>
        
        <div class="info">
          <strong>ℹ️ Choose pairing method:</strong><br>
          Select either QR Code or Phone Number to generate your session.
        </div>

        <div class="tabs">
          <button class="tab-btn active" onclick="switchTab('qr')">📱 QR Code</button>
          <button class="tab-btn" onclick="switchTab('phone')">☎️ Phone Number</button>
        </div>

        <!-- QR Code Tab -->
        <div id="qr" class="tab-content active">
          <div class="info">
            <strong>📖 Instructions:</strong><br>
            1. Click "Generate QR Code"<br>
            2. Scan with WhatsApp on your phone<br>
            3. Wait for session to generate<br>
            4. Copy your SESSION_ID
          </div>

          <button class="button" id="qr-btn" onclick="generateQR()">🔄 Generate QR Code</button>
          
          <div id="qr-status" class="status"></div>
          
          <div class="qr-container" id="qrContainer">
            <p style="color: #666; margin-bottom: 15px;">Scan this QR code with your WhatsApp:</p>
            <div id="qrCode"></div>
            <p style="color: #999; font-size: 12px; margin-top: 10px;">QR expires in 60 seconds</p>
          </div>

          <div class="session-display" id="qr-sessionDisplay">
            <strong>✅ Session ID Generated!</strong><br><br>
            <code id="qr-sessionId"></code>
          </div>

          <button class="button copy-btn" id="qr-copyBtn" onclick="copySession('qr')" style="display: none;">📋 Copy SESSION_ID</button>
        </div>

        <!-- Phone Number Tab -->
        <div id="phone" class="tab-content">
          <div class="info">
            <strong>📖 Instructions:</strong><br>
            1. Enter your WhatsApp phone number (with country code)<br>
            2. Click "Request Pairing Code"<br>
            3. A 8-digit code will appear<br>
            4. Enter it in WhatsApp linking<br>
            5. Copy your SESSION_ID
          </div>

          <div class="input-group">
            <label for="phoneNumber">📞 Phone Number (e.g., +1234567890):</label>
            <input type="tel" id="phoneNumber" placeholder="+1234567890" />
          </div>

          <button class="button" id="phone-btn" onclick="generatePhone()">📲 Request Pairing Code</button>
          
          <div id="phone-status" class="status"></div>
          
          <div class="pairing-code" id="pairingCodeDisplay" style="display: none;">
            Code: <span id="pairingCodeValue"></span>
          </div>

          <div class="session-display" id="phone-sessionDisplay">
            <strong>✅ Session ID Generated!</strong><br><br>
            <code id="phone-sessionId"></code>
          </div>

          <button class="button copy-btn" id="phone-copyBtn" onclick="copySession('phone')" style="display: none;">📋 Copy SESSION_ID</button>
        </div>
      </div>

      <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode.js/1.5.3/qrcode.min.js"></script>
      <script>
        function switchTab(tab) {
          document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
          document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
          document.getElementById(tab).classList.add('active');
          event.target.classList.add('active');
        }

        async function generateQR() {
          const btn = document.getElementById('qr-btn');
          const status = document.getElementById('qr-status');
          const qrContainer = document.getElementById('qrContainer');
          const sessionDisplay = document.getElementById('qr-sessionDisplay');
          const copyBtn = document.getElementById('qr-copyBtn');

          btn.disabled = true;
          status.textContent = '⏳ Generating QR Code...';
          status.className = 'status active waiting';
          qrContainer.classList.remove('active');
          sessionDisplay.classList.remove('active');
          copyBtn.style.display = 'none';

          try {
            const response = await fetch('/generate-qr');
            const data = await response.json();

            if (data.qr) {
              document.getElementById('qrCode').innerHTML = '';
              new QRCode(document.getElementById('qrCode'), data.qr);
              qrContainer.classList.add('active');
              status.textContent = '📱 Scan the QR code with your WhatsApp phone';
              status.className = 'status active waiting';

              checkSessionQR();
            } else {
              throw new Error('Failed to generate QR code');
            }
          } catch (error) {
            status.textContent = '❌ Error: ' + error.message;
            status.className = 'status active error';
            btn.disabled = false;
          }
        }

        async function generatePhone() {
          const phoneNumber = document.getElementById('phoneNumber').value.trim();
          const btn = document.getElementById('phone-btn');
          
          if (!phoneNumber) {
            alert('❌ Please enter a phone number');
            return;
          }

          if (phoneNumber.length < 10 || !/^\+?[0-9]{10,}$/.test(phoneNumber)) {
            alert('❌ Please enter a valid phone number (e.g., +1234567890)');
            return;
          }

          btn.disabled = true;
          const status = document.getElementById('phone-status');
          const pairingDisplay = document.getElementById('pairingCodeDisplay');
          const sessionDisplay = document.getElementById('phone-sessionDisplay');
          const copyBtn = document.getElementById('phone-copyBtn');

          status.textContent = '⏳ Requesting pairing code...';
          status.className = 'status active waiting';
          pairingDisplay.style.display = 'none';
          sessionDisplay.classList.remove('active');
          copyBtn.style.display = 'none';

          try {
            const response = await fetch('/generate-phone', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phoneNumber })
            });
            const data = await response.json();

            if (data.error) {
              throw new Error(data.error);
            }

            if (data.pairingCode && data.pairingCode !== 'Generating...' && data.pairingCode !== 'INVALID_PHONE') {
              document.getElementById('pairingCodeValue').textContent = data.pairingCode;
              pairingDisplay.style.display = 'block';
              status.textContent = '📲 Pairing code sent. Check your WhatsApp linked devices.';
              status.className = 'status active waiting';

              checkSessionPhone();
            } else {
              status.textContent = '⏳ Generating pairing code, please wait...';
              checkSessionPhone();
            }
          } catch (error) {
            status.textContent = '❌ Error: ' + error.message;
            status.className = 'status active error';
            btn.disabled = false;
          }
        }

        async function checkSessionQR() {
          try {
            const response = await fetch('/check-session');
            const data = await response.json();

            if (data.sessionGenerated) {
              const status = document.getElementById('qr-status');
              const sessionDisplay = document.getElementById('qr-sessionDisplay');
              const copyBtn = document.getElementById('qr-copyBtn');
              const btn = document.getElementById('qr-btn');

              document.getElementById('qr-sessionId').textContent = data.sessionId;
              sessionDisplay.classList.add('active');
              copyBtn.style.display = 'inline-block';
              
              status.textContent = '✅ Session generated successfully!';
              status.className = 'status active success';
              
              document.getElementById('qrContainer').classList.remove('active');
              btn.disabled = false;
            } else {
              setTimeout(checkSessionQR, 2000);
            }
          } catch (error) {
            setTimeout(checkSessionQR, 2000);
          }
        }

        async function checkSessionPhone() {
          try {
            const response = await fetch('/check-session');
            const data = await response.json();

            if (data.sessionGenerated) {
              const status = document.getElementById('phone-status');
              const sessionDisplay = document.getElementById('phone-sessionDisplay');
              const copyBtn = document.getElementById('phone-copyBtn');
              const btn = document.getElementById('phone-btn');

              document.getElementById('phone-sessionId').textContent = data.sessionId;
              sessionDisplay.classList.add('active');
              copyBtn.style.display = 'inline-block';
              
              status.textContent = '✅ Session generated successfully!';
              status.className = 'status active success';
              
              document.getElementById('pairingCodeDisplay').style.display = 'none';
              btn.disabled = false;
            } else {
              setTimeout(checkSessionPhone, 2000);
            }
          } catch (error) {
            setTimeout(checkSessionPhone, 2000);
          }
        }

        function copySession(method) {
          const sessionText = document.getElementById(method + '-sessionId').textContent;
          navigator.clipboard.writeText(sessionText).then(() => {
            alert('✅ SESSION_ID copied to clipboard!');
          });
        }
      </script>
    </body>
    </html>
  `);
});

app.get('/generate-qr', (req, res) => {
  if (qrCodeData) {
    res.json({ qr: qrCodeData });
  } else {
    generateSessionQR();
    res.json({ message: 'Generating QR code...' });
  }
});

app.post('/generate-phone', (req, res) => {
  const { phoneNumber } = req.body;
  if (phoneNumber) {
    generateSessionPhone(phoneNumber);
    // Return pairing code with small delay to allow generation
    setTimeout(() => {
      if (pairingCode && pairingCode !== 'INVALID_PHONE') {
        res.json({ pairingCode });
      } else {
        res.json({ pairingCode: 'Generating...' });
      }
    }, 500);
  } else {
    res.status(400).json({ error: 'Phone number required' });
  }
});

app.get('/check-session', (req, res) => {
  res.json({ sessionGenerated, sessionId });
});

// Telegram Bot API Endpoints
app.get('/commands', (req, res) => {
  res.json({
    status: 'success',
    commands: TELEGRAM_COMMANDS,
    total: Object.keys(TELEGRAM_COMMANDS).length
  });
});

app.post('/telegram/message', (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Message text required' });
  }

  const command = text.toLowerCase().split(' ')[0];
  
  if (TELEGRAM_COMMANDS[command]) {
    res.json({
      status: 'success',
      command: command,
      description: TELEGRAM_COMMANDS[command].description
    });
  } else {
    res.json({
      status: 'unknown_command',
      message: 'Command not recognized. Use /help for available commands.'
    });
  }
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    uptime: process.uptime(),
    version: '2.0.0',
    telegram_commands: Object.keys(TELEGRAM_COMMANDS).length
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ SIMON-TECH-BOT v2.0.0 is running!`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`📱 Open in your browser to generate SESSION_ID`);
  console.log(`📋 Available commands: ${Object.keys(TELEGRAM_COMMANDS).join(', ')}\n`);
});
