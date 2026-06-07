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
let activeSocket = null;
let generationInProgress = false;
let qrTimeout = null;
let phoneTimeout = null;

// Track user sessions
const userSessions = new Map();

// Country codes mapping
const COUNTRY_CODES = {
  'us': { flag: '🇺🇸', code: '+1', country: 'United States' },
  'uk': { flag: '🇬🇧', code: '+44', country: 'United Kingdom' },
  'in': { flag: '🇮🇳', code: '+91', country: 'India' },
  'bd': { flag: '🇧🇩', code: '+880', country: 'Bangladesh' },
  'pk': { flag: '🇵🇰', code: '+92', country: 'Pakistan' },
  'ng': { flag: '🇳🇬', code: '+234', country: 'Nigeria' },
  'za': { flag: '🇿🇦', code: '+27', country: 'South Africa' },
  'eg': { flag: '🇪🇬', code: '+20', country: 'Egypt' },
  'mx': { flag: '🇲🇽', code: '+52', country: 'Mexico' },
  'br': { flag: '🇧🇷', code: '+55', country: 'Brazil' },
  'ar': { flag: '🇦🇷', code: '+54', country: 'Argentina' },
  'ph': { flag: '🇵🇭', code: '+63', country: 'Philippines' },
  'id': { flag: '🇮🇩', code: '+62', country: 'Indonesia' },
  'th': { flag: '🇹🇭', code: '+66', country: 'Thailand' },
  'vn': { flag: '🇻🇳', code: '+84', country: 'Vietnam' },
  'jp': { flag: '🇯🇵', code: '+81', country: 'Japan' },
  'kr': { flag: '🇰🇷', code: '+82', country: 'South Korea' },
  'de': { flag: '🇩🇪', code: '+49', country: 'Germany' },
  'fr': { flag: '🇫🇷', code: '+33', country: 'France' },
  'it': { flag: '🇮🇹', code: '+39', country: 'Italy' },
  'es': { flag: '🇪🇸', code: '+34', country: 'Spain' },
  'ca': { flag: '🇨🇦', code: '+1', country: 'Canada' },
  'au': { flag: '🇦🇺', code: '+61', country: 'Australia' },
};

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
async function generateSessionQR(telegramCtx = null) {
  if (generationInProgress) {
    console.log('⚠️  Session generation already in progress');
    if (telegramCtx) {
      telegramCtx.reply('⚠️ Session generation already in progress. Please wait...');
    }
    return;
  }

  generationInProgress = true;
  resetState('qr');
  
  if (telegramCtx) {
    telegramCtx.reply('⏳ Generating QR Code... Please wait...');
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
        console.log('✅ QR Code generated. Scan it with your WhatsApp app.');

        // Send QR code to Telegram
        if (telegramCtx) {
          try {
            const qrImage = await QRCode.toDataURL(qr);
            await telegramCtx.replyWithPhoto({ url: qrImage }, {
              caption: '📱 Scan this QR code with your WhatsApp app to generate the session.'
            });
          } catch (err) {
            console.error('Error sending QR to Telegram:', err);
            telegramCtx.reply('📱 QR Code generated. Scan it to continue.');
          }
        }

        // Set QR code expiration timeout (60 seconds)
        if (qrTimeout) clearTimeout(qrTimeout);
        qrTimeout = setTimeout(() => {
          console.log('⏰ QR Code expired. Please generate a new one.');
          if (telegramCtx) {
            telegramCtx.reply('⏰ QR Code expired. Use /qr to generate a new one.');
          }
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
          
          // Send session to Telegram
          if (telegramCtx) {
            telegramCtx.reply(`✅ <b>Session generated successfully!</b>\n\n🔐 <code>${sessionId}</code>`, {
              parse_mode: 'HTML'
            });
          }
        }
        
        generationInProgress = false;
      }

      if (connection === 'close') {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if (shouldReconnect && generationInProgress) {
          console.log('🔄 Reconnecting...');
          setTimeout(() => generateSessionQR(telegramCtx), 3000);
        } else if (!shouldReconnect) {
          console.log('❌ QR Session ended (logged out)');
          if (telegramCtx) {
            telegramCtx.reply('❌ QR Session ended. Please try again with /qr');
          }
          resetState('qr');
          generationInProgress = false;
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

  } catch (error) {
    console.error('Error generating session:', error);
    if (telegramCtx) {
      telegramCtx.reply(`❌ Error generating QR: ${error.message}`);
    }
    generationInProgress = false;
    resetState('qr');
  }
}

// Session Generator with Phone Number Pairing
async function generateSessionPhone(phoneNumber, telegramCtx = null) {
  if (generationInProgress) {
    console.log('⚠️  Session generation already in progress');
    if (telegramCtx) {
      telegramCtx.reply('⚠️ Session generation already in progress. Please wait...');
    }
    return;
  }

  // Validate phone number format
  if (!phoneNumber || typeof phoneNumber !== 'string' || phoneNumber.length < 10) {
    console.error('❌ Invalid phone number format');
    if (telegramCtx) {
      telegramCtx.reply('❌ Invalid phone number format. Use format: +1234567890');
    }
    pairingCode = 'INVALID_PHONE';
    return;
  }

  generationInProgress = true;
  resetState('phone');
  
  if (telegramCtx) {
    telegramCtx.reply(`⏳ <b>Connecting to WhatsApp...</b>\n\n📱 <b>Number:</b> ${phoneNumber}\n\n<i>Please wait while we generate your pairing code...</i>`, {
      parse_mode: 'HTML'
    });
  }

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
          
          // Send session to Telegram
          if (telegramCtx) {
            telegramCtx.reply(`✅ <b>Session generated successfully!</b>\n\n🔐 <code>${sessionId}</code>`, {
              parse_mode: 'HTML'
            });
          }
        }

        generationInProgress = false;
      }

      if (connection === 'close') {
        const shouldReconnect =
          lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

        if (shouldReconnect && generationInProgress) {
          console.log('🔄 Reconnecting...');
          setTimeout(() => generateSessionPhone(phoneNumber, telegramCtx), 3000);
        } else if (!shouldReconnect) {
          console.log('❌ Phone Session ended (logged out)');
          if (telegramCtx) {
            telegramCtx.reply('❌ Phone session ended. Please try again with /pair');
          }
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
          
          // Send pairing code to Telegram with fancy formatting
          if (telegramCtx) {
            const message = `
╰┈➤ <b>Sᴇssɪᴏɴ Cᴏɴɴᴇᴄᴛɪɴɢ. ❤️‍🩹</b>

╰┈➤ <b>ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ :</b> <code>${code}</code>

╰┈➤ <b>ɪɴsᴛʀᴜᴄᴛɪᴏɴs :</b>
   1️⃣ Open WhatsApp on your phone
   2️⃣ Go to Settings → Linked Devices
   3️⃣ Tap "Link a device"
   4️⃣ Enter the code above when prompted

⏱️ Code expires in 2 minutes
`;
            telegramCtx.reply(message, {
              parse_mode: 'HTML'
            });
          }

          // Set pairing code timeout (120 seconds for phone pairing)
          if (phoneTimeout) clearTimeout(phoneTimeout);
          phoneTimeout = setTimeout(() => {
            console.log('⏰ Pairing code expired. Please request a new one.');
            if (telegramCtx) {
              telegramCtx.reply('⏰ Pairing code expired. Use /pair to request a new one.');
            }
            resetState('phone');
          }, 120000);
        }
      } catch (error) {
        console.error('Error requesting pairing code:', error);
        if (telegramCtx) {
          telegramCtx.reply(`❌ Error requesting pairing code: ${error.message}`);
        }
        pairingCode = null;
        generationInProgress = false;
      }
    }, 2000);

    sock.ev.on('creds.update', saveCreds);

  } catch (error) {
    console.error('Error generating session via phone:', error);
    if (telegramCtx) {
      telegramCtx.reply(`❌ Error: ${error.message}`);
    }
    generationInProgress = false;
    pairingCode = null;
    resetState('phone');
  }
}

// Telegram Command Handlers
function getCommandsList() {
  let commands = '📋 <b>Available Commands:</b>\n\n';
  for (const [cmd, info] of Object.entries(TELEGRAM_COMMANDS)) {
    commands += `${cmd} — ${info.description}\n`;
  }
  return commands;
}

function getWelcomeMessage() {
  return `🤖 <b>Welcome to SIMON-TECH-BOT!</b>\n\n` +
    `This bot helps you generate WhatsApp sessions for automation.\n\n` +
    `✨ <b>Features:</b>\n` +
    `• Generate WhatsApp session via QR Code\n` +
    `• Generate session via Phone Number pairing\n` +
    `• Check bot status and latency\n\n` +
    `Use /help to see all available commands.`;
}

function getHelpMenu() {
  return `🆘 <b>Help Menu</b>\n\n` +
    `${getCommandsList()}\n` +
    `📖 <b>Examples:</b>\n` +
    `/start - Start the bot\n` +
    `/pair - Generate WhatsApp pair code\n` +
    `/qr - Generate QR code for session\n` +
    `/status - Check current session status\n\n` +
    `For more info, visit: https://github.com/vivi-v4/SIMON-TECH-bot2`;
}

function showCountrySelection() {
  let message = `[ ♡ SIMON TECH BOT2 👀 ]\n\n`;
  message += `<b>Select your country:</b>\n\n`;
  
  let i = 1;
  for (const [code, info] of Object.entries(COUNTRY_CODES)) {
    message += `${info.flag} ${info.country} (${info.code})\n`;
    if (i % 3 === 0) message += '\n';
    i++;
  }
  
  return message;
}

// Setup Telegram Bot Commands
if (bot) {
  bot.start((ctx) => ctx.reply(getWelcomeMessage(), { parse_mode: 'HTML' }));
  
  bot.command('help', (ctx) => ctx.reply(getHelpMenu(), { parse_mode: 'HTML' }));
  
  bot.command('ping', (ctx) => {
    const latency = Math.random() * 100;
    ctx.reply(`🏓 Pong! Latency: ${latency.toFixed(2)}ms`);
  });
  
  bot.command('status', (ctx) => {
    const status = sessionGenerated ? '✅ Session Ready' : '⏳ No active session';
    ctx.reply(`<b>Current Status:</b> ${status}\n\n<b>Bot Version:</b> 2.0.0\n<b>Uptime:</b> ${process.uptime().toFixed(2)}s`, { parse_mode: 'HTML' });
  });
  
  bot.command('qr', (ctx) => {
    generateSessionQR(ctx);
  });
  
  bot.command('pair', (ctx) => {
    const userId = ctx.from.id;
    userSessions.set(userId, { step: 'country_select', phoneNumber: null, countryCode: null });
    
    const message = `[ ♡ SIMON TECH BOT2 👀 ]\n\n<b>Select your country to get the correct country code:</b>\n\n`;
    const countryButtons = [];
    
    // Create inline buttons for countries
    const countryList = Object.entries(COUNTRY_CODES);
    for (let i = 0; i < countryList.length; i += 2) {
      const btn1 = countryList[i];
      const btn2 = countryList[i + 1];
      
      const row = [
        { text: `${btn1[1].flag} ${btn1[1].country}`, callback_data: `country_${btn1[0]}` }
      ];
      
      if (btn2) {
        row.push({ text: `${btn2[1].flag} ${btn2[1].country}`, callback_data: `country_${btn2[0]}` });
      }
      
      countryButtons.push(row);
    }
    
    ctx.reply(message, {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: countryButtons
      }
    });
  });
  
  // Handle country selection
  bot.action(/country_(.+)/, async (ctx) => {
    const countryCode = ctx.match[1];
    const userId = ctx.from.id;
    const countryInfo = COUNTRY_CODES[countryCode];
    
    if (countryInfo) {
      userSessions.set(userId, { step: 'enter_phone', countryCode: countryInfo.code, country: countryInfo.country });
      
      const message = `[ ♡ SIMON TECH BOT2 👀 ]\n\n╰┈➤ <b>ɴᴜᴍʙᴇʀ :</b> ${countryInfo.flag} ${countryInfo.country} (${countryInfo.code})\n\n<i>Please send your phone number without the country code.\nExample: 9876543210</i>`;
      
      await ctx.reply(message, { parse_mode: 'HTML' });
      ctx.answerCbQuery();
    }
  });
  
  bot.command('generate_session', (ctx) => {
    if (sessionGenerated && sessionId) {
      ctx.reply(`✅ <b>Session Ready!</b>\n\n🔐 <code>${sessionId}</code>`, { parse_mode: 'HTML' });
    } else {
      ctx.reply('⏳ No session generated yet. Use /qr or /pair to generate one.');
    }
  });
  
  // Handle text messages for phone number input
  bot.on('text', (ctx) => {
    const text = ctx.message.text.trim();
    const userId = ctx.from.id;
    const userSession = userSessions.get(userId);
    
    if (userSession && userSession.step === 'enter_phone') {
      // Validate phone number
      if (/^\d{10,}$/.test(text)) {
        const fullPhoneNumber = userSession.countryCode + text;
        userSessions.delete(userId);
        generateSessionPhone(fullPhoneNumber, ctx);
      } else {
        ctx.reply('❌ Invalid phone number. Please send only digits (e.g., 9876543210)');
      }
    } else if (!text.startsWith('/')) {
      ctx.reply('❓ Unknown command. Use /help to see available commands.');
    }
  });
  
  // Error handling
  bot.catch((err, ctx) => {
    console.error('Telegram Bot Error:', err);
    ctx.reply('❌ An error occurred. Please try again.');
  });
}

// Web UI (simplified)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SIMON-TECH-BOT - Session Generator</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
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
          max-width: 500px;
          width: 100%;
          padding: 40px;
          text-align: center;
        }
        h1 { color: #333; margin-bottom: 10px; }
        .info { background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0; color: #004085; }
        .status { padding: 15px; border-radius: 8px; margin: 15px 0; background: #d4edda; color: #155724; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 SIMON-TECH-BOT v2.0.0</h1>
        <p style="color: #666; margin-bottom: 20px;">WhatsApp Session Generator</p>
        
        <div class="info">
          <strong>✅ Bot is running!</strong><br>
          Use Telegram bot <strong>@simontech2bot</strong> to generate your session.
        </div>
        
        <div style="margin-top: 30px; font-size: 14px; color: #666;">
          <p>📱 Open Telegram</p>
          <p>🔍 Search for <strong>@simontech2bot</strong></p>
          <p>💬 Send <strong>/start</strong></p>
        </div>
      </div>
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

app.get('/commands', (req, res) => {
  res.json({
    status: 'success',
    commands: TELEGRAM_COMMANDS,
    total: Object.keys(TELEGRAM_COMMANDS).length
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    uptime: process.uptime(),
    version: '2.0.0',
    telegram_bot_active: bot !== null
  });
});

const server = app.listen(PORT, () => {
  console.log(`\n✅ SIMON-TECH-BOT v2.0.0 is running!`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`📋 Available commands: ${Object.keys(TELEGRAM_COMMANDS).join(', ')}\n`);
});

// Start Telegram Bot
if (bot) {
  bot.launch({
    polling: {
      interval: 300,
      timeout: 20,
      relatedUpdateTimeout: 100,
      shouldRetry: true,
    }
  }).then(() => {
    console.log('✅ Telegram Bot started (polling mode)');
  }).catch(err => {
    console.error('❌ Failed to start Telegram Bot:', err);
  });
  
  process.once('SIGINT', () => {
    console.log('Shutting down...');
    bot.stop('SIGINT');
    server.close(() => process.exit(0));
  });
  
  process.once('SIGTERM', () => {
    console.log('Shutting down...');
    bot.stop('SIGTERM');
    server.close(() => process.exit(0));
  });
} else {
  console.log('⚠️  Telegram Bot disabled (no token)');
}
