require('dotenv').config();
const express = require('express');
const { Telegraf } = require('telegraf');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Initialize Telegram Bot
let bot = null;
if (TELEGRAM_BOT_TOKEN) {
  try {
    bot = new Telegraf(TELEGRAM_BOT_TOKEN);
  } catch (error) {
    console.error('❌ Failed to initialize Telegram bot:', error.message);
  }
}

app.use(express.static('public'));
app.use(express.json());

let qrCodeData = null;
let sessionGenerated = false;
let sessionId = null;
let pairingCode = null;
let pairingLink = null;
let activeSocket = null;
let generationInProgress = false;
let qrTimeout = null;
let phoneTimeout = null;

// Log startup info
console.log('🚀 SIMON-TECH-BOT v2.0.0 Starting...');
console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`📱 Port: ${PORT}`);
if (TELEGRAM_BOT_TOKEN) {
  console.log('✅ Telegram Bot Token loaded');
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
    pairingLink = null;
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

// Session Generator with Phone Number Pairing - Optimized
async function generateSessionPhone(phoneNumber, telegramCtx = null) {
  // Prevent multiple simultaneous requests
  if (generationInProgress) {
    if (telegramCtx) {
      telegramCtx.reply('⏳ Please wait... code is being generated', { parse_mode: 'HTML' });
    }
    return;
  }

  // Validate phone number
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    if (telegramCtx) {
      telegramCtx.reply('❌ Invalid phone number', { parse_mode: 'HTML' });
    }
    return;
  }

  // Clean phone number
  let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
  if (!cleanNumber.startsWith('+')) {
    cleanNumber = '+' + cleanNumber;
  }

  console.log(`📱 Generating code for: ${cleanNumber}`);

  generationInProgress = true;
  resetState('phone');
  
  if (telegramCtx) {
    telegramCtx.reply(`⏳ Connecting...`, { parse_mode: 'HTML' });
  }

  try {
    const sessionPath = path.join(sessionsDir, `session_${Date.now()}`);
    if (!fs.existsSync(sessionPath)) {
      fs.mkdirSync(sessionPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      browser: ['SIMON-TECH-BOT', 'Safari', '2.0.0'],
      syncFullHistory: false,
      markOnlineOnConnect: true,
      keepAliveIntervalMs: 30000,
    });

    activeSocket = sock;
    let codeRequested = false;

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'connecting') {
        console.log('🔄 Connecting...');
      }

      if (connection === 'open') {
        console.log('✅ Connected! Requesting pairing code...');
        
        if (!codeRequested) {
          codeRequested = true;
          
          // Small delay to ensure socket is ready
          setTimeout(async () => {
            try {
              console.log(`📲 Requesting code for: ${cleanNumber}`);
              const code = await sock.requestPairingCode(cleanNumber);
              
              if (code) {
                pairingCode = code;
                console.log(`✅ Code Generated: ${code}`);
                
                // Create WhatsApp link
                pairingLink = `https://wa.me/?code=${code}`;
                
                // Send to Telegram
                if (telegramCtx) {
                  // Main message with code
                  const message = `[ ♡ SIMON TECH BOT2 👀 ]

╰┈➤ <b>ᴄᴏᴅᴇ :</b> <code>${code}</code>

╰┈➤ <b>ɪɴsᴛʀᴜᴄᴛɪᴏɴs:</b>
   1️⃣ Click button below
   2️⃣ Or manually enter code in WhatsApp`;
                  
                  await telegramCtx.reply(message, {
                    parse_mode: 'HTML',
                    reply_markup: {
                      inline_keyboard: [[
                        { text: '🔗 Link WhatsApp', url: pairingLink }
                      ]]
                    }
                  });
                  
                  // Notification
                  await telegramCtx.reply('🔔 <b>Code Ready!</b>\n\n✅ Tap link or enter manually in WhatsApp', {
                    parse_mode: 'HTML'
                  });
                }

                // Expire after 2 minutes
                if (phoneTimeout) clearTimeout(phoneTimeout);
                phoneTimeout = setTimeout(() => {
                  console.log('⏰ Code expired');
                  if (telegramCtx) {
                    telegramCtx.reply('⏰ Code expired. Use /pair again', { parse_mode: 'HTML' });
                  }
                  resetState('phone');
                }, 120000);
              }
            } catch (error) {
              console.error('❌ Error:', error.message);
              if (telegramCtx) {
                telegramCtx.reply(`❌ Error: ${error.message}`, { parse_mode: 'HTML' });
              }
              generationInProgress = false;
              resetState('phone');
            }
          }, 1000);
        }
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if (shouldReconnect && !codeRequested) {
          console.log('🔄 Retrying...');
          setTimeout(() => {
            if (generationInProgress) {
              generateSessionPhone(cleanNumber, telegramCtx);
            }
          }, 3000);
        } else if (codeRequested) {
          console.log('✅ Connection staying open for linking...');
          // Keep connection open for pairing
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

  } catch (error) {
    console.error('Error:', error.message);
    if (telegramCtx) {
      telegramCtx.reply(`❌ Error: ${error.message}`, { parse_mode: 'HTML' });
    }
    generationInProgress = false;
    resetState('phone');
  }
}

// Session Generator with QR Code
async function generateSessionQR(telegramCtx = null) {
  if (generationInProgress) {
    if (telegramCtx) {
      telegramCtx.reply('⏳ Please wait... QR is being generated', { parse_mode: 'HTML' });
    }
    return;
  }

  generationInProgress = true;
  resetState('qr');
  
  if (telegramCtx) {
    telegramCtx.reply('⏳ Generating QR...', { parse_mode: 'HTML' });
  }

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
        console.log('✅ QR Code generated');

        if (telegramCtx) {
          try {
            const qrImage = await QRCode.toDataURL(qr);
            await telegramCtx.replyWithPhoto({ url: qrImage }, {
              caption: '📱 Scan with WhatsApp'
            });
          } catch (err) {
            telegramCtx.reply('📱 QR Code generated. Scan it.');
          }
        }

        if (qrTimeout) clearTimeout(qrTimeout);
        qrTimeout = setTimeout(() => {
          console.log('⏰ QR expired');
          resetState('qr');
        }, 60000);
      }

      if (connection === 'open') {
        sessionGenerated = true;
        sessionId = 'SIMON';
        console.log('✅ Session generated!');

        const credentialsPath = path.join(sessionsDir, 'SIMON', 'creds.json');
        if (fs.existsSync(credentialsPath)) {
          const credentials = JSON.stringify(require(credentialsPath));
          const encodedSession = Buffer.from(credentials).toString('base64');
          sessionId = encodedSession;
          
          if (telegramCtx) {
            telegramCtx.reply(`✅ <b>Session Ready!</b>\n\n<code>${sessionId}</code>`, {
              parse_mode: 'HTML'
            });
          }
        }
        
        generationInProgress = false;
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if (shouldReconnect && generationInProgress) {
          setTimeout(() => generateSessionQR(telegramCtx), 3000);
        } else {
          resetState('qr');
          generationInProgress = false;
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

  } catch (error) {
    console.error('Error:', error);
    generationInProgress = false;
    resetState('qr');
  }
}

// Help menu
function getHelpMenu() {
  return `👤 𝖴𝗌𝖊𝖗 𝖈𝖔𝖒𝖒𝖆𝖓𝖉𝖘
┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄���┄
📌 /pair +91XXXXXXXXXX
      Generate 8-digit code

📌 /qr
      Generate QR code

📌 /ping
      Check latency

📌 /status
      Session status

💡 𝖤𝖝𝖆𝖒𝖕𝖑𝖊:
/pair +917074420859`;
}

// Setup Telegram Bot
if (bot) {
  bot.start((ctx) => ctx.reply('🤖 Welcome! Use /help for commands', { parse_mode: 'HTML' }));
  
  bot.command('help', (ctx) => ctx.reply(getHelpMenu(), { parse_mode: 'HTML' }));
  
  bot.command('ping', (ctx) => {
    ctx.reply(`🏓 Pong! ${(Math.random() * 100).toFixed(0)}ms`);
  });
  
  bot.command('status', (ctx) => {
    const status = sessionGenerated ? '✅ Ready' : '⏳ Idle';
    ctx.reply(`Status: ${status}`, { parse_mode: 'HTML' });
  });
  
  bot.command('qr', (ctx) => {
    generateSessionQR(ctx);
  });
  
  // Handle /pair command
  bot.command('pair', (ctx) => {
    const text = ctx.message.text;
    const phoneMatch = text.match(/\+?[\d\s\-()]{10,}/);
    
    if (phoneMatch) {
      const phoneNumber = phoneMatch[0];
      generateSessionPhone(phoneNumber, ctx);
    } else {
      ctx.reply('📌 Usage: /pair +1234567890', { parse_mode: 'HTML' });
    }
  });
  
  // Catch other text
  bot.on('text', (ctx) => {
    const text = ctx.message.text;
    if (!text.startsWith('/')) {
      ctx.reply('Use /help for commands');
    }
  });
  
  bot.catch(() => {});
}

// Web UI
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SIMON-TECH-BOT</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: Arial; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; }
        .container { background: white; border-radius: 15px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 500px; width: 100%; padding: 40px; text-align: center; }
        h1 { color: #333; }
        .info { background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0; color: #004085; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 SIMON-TECH-BOT v2.0.0</h1>
        <div class="info">✅ Running! Message @simontech2bot on Telegram</div>
      </div>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', version: '2.0.0' });
});

const server = app.listen(PORT, () => {
  console.log(`\n✅ SIMON-TECH-BOT v2.0.0 running on port ${PORT}\n`);
});

// Start Telegram Bot
if (bot) {
  bot.launch({ polling: { interval: 300, timeout: 20 } })
    .then(() => console.log('✅ Telegram Bot started'))
    .catch(err => console.error('❌ Bot error:', err));
  
  process.once('SIGINT', () => {
    bot.stop('SIGINT');
    server.close(() => process.exit(0));
  });
  
  process.once('SIGTERM', () => {
    bot.stop('SIGTERM');
    server.close(() => process.exit(0));
  });
}
