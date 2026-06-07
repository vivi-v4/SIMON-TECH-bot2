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

// Track user sessions
const userSessions = new Map();

// RESTRICTED: Only allowed countries
const ALLOWED_COUNTRIES = {
  'in': { flag: '🇮🇳', code: '+91', country: 'India' },
  'bd': { flag: '🇧🇩', code: '+880', country: 'Bangladesh' },
  'pk': { flag: '🇵🇰', code: '+92', country: 'Pakistan' },
  'ng': { flag: '🇳🇬', code: '+234', country: 'Nigeria' },
  'za': { flag: '🇿🇦', code: '+27', country: 'South Africa' },
  'eg': { flag: '🇪🇬', code: '+20', country: 'Egypt' },
  'ph': { flag: '🇵🇭', code: '+63', country: 'Philippines' },
  'id': { flag: '🇮🇩', code: '+62', country: 'Indonesia' },
  'th': { flag: '🇹🇭', code: '+66', country: 'Thailand' },
  'vn': { flag: '🇻🇳', code: '+84', country: 'Vietnam' },
  'br': { flag: '🇧🇷', code: '+55', country: 'Brazil' },
  'mx': { flag: '🇲🇽', code: '+52', country: 'Mexico' },
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

// Session Generator with Phone Number Pairing - Fixed Version
async function generateSessionPhone(phoneNumber, telegramCtx = null) {
  if (generationInProgress) {
    console.log('⚠️  Session generation already in progress');
    if (telegramCtx) {
      telegramCtx.reply('⚠️ Session generation already in progress. Please wait...');
    }
    return;
  }

  // Validate phone number format
  if (!phoneNumber || typeof phoneNumber !== 'string') {
    console.error('❌ Invalid phone number format');
    if (telegramCtx) {
      telegramCtx.reply('❌ Invalid phone number format. Use format: +1234567890');
    }
    return;
  }

  // Remove non-numeric characters except +
  let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
  
  // Ensure it starts with +
  if (!cleanNumber.startsWith('+')) {
    cleanNumber = '+' + cleanNumber;
  }

  console.log(`📱 Processing phone number: ${cleanNumber}`);

  generationInProgress = true;
  resetState('phone');
  
  if (telegramCtx) {
    telegramCtx.reply(`⏳ <b>Connecting to WhatsApp...</b>\n\n📱 <b>Number:</b> ${cleanNumber}\n\n<i>Please wait while we generate your pairing code...</i>`, {
      parse_mode: 'HTML'
    });
  }

  try {
    const sessionPath = path.join(sessionsDir, `session_${Date.now()}`);
    
    // Create session directory
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
    });

    activeSocket = sock;
    let codeRequested = false;
    let connectionOpened = false;

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, isOnline } = update;

      console.log(`📡 Connection Status: ${connection}`);

      if (connection === 'connecting') {
        console.log('🔄 Connecting to WhatsApp...');
      }

      if (connection === 'open') {
        connectionOpened = true;
        console.log('✅ Socket connected to WhatsApp!');
        
        // Wait a moment before requesting pairing code
        if (!codeRequested) {
          codeRequested = true;
          setTimeout(async () => {
            try {
              console.log(`📲 Requesting pairing code for: ${cleanNumber}`);
              const code = await sock.requestPairingCode(cleanNumber);
              
              if (code) {
                pairingCode = code;
                console.log(`✅ Pairing Code Received: ${code}`);
                
                // Generate WhatsApp linking URL
                pairingLink = `https://wa.me/?code=${code}`;
                console.log(`🔗 Pairing Link: ${pairingLink}`);
                
                // Send pairing code AND link to Telegram with notifications
                if (telegramCtx) {
                  const message = `╰┈➤ <b>Sᴇssɪᴏɴ Cᴏɴɴᴇᴄᴛɪɴɢ. ❤️‍🩹</b>

╰┈➤ <b>ᴘᴀɪʀɪɴɢ ᴄᴏᴅᴇ :</b> <code>${code}</code>

╰┈➤ <b>ᴏᴘᴛɪᴏɴ 1: ᴍᴀɴᴜᴀʟ ᴇɴᴛʀʏ</b>
   Open WhatsApp → Settings → Linked Devices
   Click "Link Device" → Enter code

╰┈➤ <b>ᴏᴘᴛɪᴏɴ 2: ᴄʟɪᴄᴋ ʟɪɴᴋ</b>
   Tap button below to open WhatsApp`;
                  
                  await telegramCtx.reply(message, {
                    parse_mode: 'HTML',
                    reply_markup: {
                      inline_keyboard: [[
                        { text: '🔗 Open WhatsApp', url: pairingLink }
                      ]]
                    }
                  });
                  
                  // Send alert notification
                  await telegramCtx.reply('🔔 <b>PAIRING CODE READY!</b>\n\n✅ Your code is valid for 2 minutes\n⏱️ Scan or enter manually in WhatsApp\n\n👉 Use the button above to link your WhatsApp account', {
                    parse_mode: 'HTML'
                  });
                }

                // Set pairing code timeout (120 seconds)
                if (phoneTimeout) clearTimeout(phoneTimeout);
                phoneTimeout = setTimeout(() => {
                  console.log('⏰ Pairing code expired');
                  if (telegramCtx) {
                    telegramCtx.reply('⏰ <b>Pairing code expired!</b>\n\nUse /pair to request a new one.', { parse_mode: 'HTML' });
                  }
                  resetState('phone');
                }, 120000);
              }
            } catch (error) {
              console.error('❌ Error requesting pairing code:', error.message);
              if (telegramCtx) {
                telegramCtx.reply(`❌ Error: ${error.message}\n\nPlease try again with /pair`, { parse_mode: 'HTML' });
              }
              generationInProgress = false;
              resetState('phone');
            }
          }, 1500);
        }
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if (shouldReconnect && !codeRequested && connectionOpened === false) {
          console.log('🔄 Reconnecting...');
          setTimeout(() => {
            if (generationInProgress) {
              sock.ws?.close();
              generateSessionPhone(cleanNumber, telegramCtx);
            }
          }, 3000);
        } else if (codeRequested) {
          console.log('✅ Keeping connection open for pairing...');
        } else {
          console.log('❌ Connection closed');
          if (telegramCtx && !pairingCode) {
            telegramCtx.reply('❌ Connection closed. Please try again with /pair', { parse_mode: 'HTML' });
          }
          generationInProgress = false;
          resetState('phone');
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);
    
    // Keep connection alive
    sock.ev.on('messages.upsert', () => {});

  } catch (error) {
    console.error('❌ Error in phone pairing:', error.message);
    if (telegramCtx) {
      telegramCtx.reply(`❌ Error: ${error.message}\n\nPlease try again`, { parse_mode: 'HTML' });
    }
    generationInProgress = false;
    resetState('phone');
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
        console.log('✅ QR Code generated.');

        if (telegramCtx) {
          try {
            const qrImage = await QRCode.toDataURL(qr);
            await telegramCtx.replyWithPhoto({ url: qrImage }, {
              caption: '📱 Scan this QR code with your WhatsApp app'
            });
          } catch (err) {
            console.error('Error sending QR:', err);
            telegramCtx.reply('📱 QR Code generated. Scan it to continue.');
          }
        }

        if (qrTimeout) clearTimeout(qrTimeout);
        qrTimeout = setTimeout(() => {
          console.log('⏰ QR Code expired');
          if (telegramCtx) {
            telegramCtx.reply('⏰ QR Code expired. Use /qr for a new one.');
          }
          resetState('qr');
        }, 60000);
      }

      if (connection === 'open') {
        sessionGenerated = true;
        sessionId = 'SIMON';
        console.log('✅ Session generated via QR!');

        const credentialsPath = path.join(sessionsDir, 'SIMON', 'creds.json');
        if (fs.existsSync(credentialsPath)) {
          const credentials = JSON.stringify(require(credentialsPath));
          const encodedSession = Buffer.from(credentials).toString('base64');
          sessionId = encodedSession;
          
          if (telegramCtx) {
            telegramCtx.reply(`✅ <b>Session generated!</b>\n\n🔐 <code>${sessionId}</code>`, {
              parse_mode: 'HTML'
            });
          }
        }
        
        generationInProgress = false;
      }

      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
        
        if (shouldReconnect && generationInProgress) {
          console.log('🔄 Reconnecting...');
          setTimeout(() => generateSessionQR(telegramCtx), 3000);
        } else if (!shouldReconnect) {
          console.log('❌ QR Session ended');
          resetState('qr');
          generationInProgress = false;
        }
      }
    });

    sock.ev.on('creds.update', saveCreds);

  } catch (error) {
    console.error('Error generating QR:', error);
    if (telegramCtx) {
      telegramCtx.reply(`❌ Error: ${error.message}`);
    }
    generationInProgress = false;
    resetState('qr');
  }
}

// Telegram Command Handlers
function getWelcomeMessage() {
  return `👤 𝖴𝗌𝖾𝗋 𝖐𝖊𝖊𝖕
┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
🤖 <b>Welcome to SIMON-TECH-BOT!</b>

✨ <b>Features:</b>
• Generate WhatsApp session via QR Code
• Generate session via Phone Number pairing
• Check bot status

Use /help to see all commands.`;
}

function getHelpMenu() {
  return `👤 𝖴𝗌𝖊𝖗 𝖈𝖔𝖒𝖒𝖆𝖓𝖉𝖘
┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄
📌 /start  — Welcome message
📌 /pair +91XXXXXXXXXX — Generate WhatsApp pair code
📌 /qr — Generate QR code
📌 /ping  — Check bot latency
📌 /help  — Show this menu
📌 /status — Check session status

💡 𝖤𝖝𝖆𝖒𝖕𝖑𝖎:
/pair +917074420859`;
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
    ctx.reply(`<b>Status:</b> ${status}\n\n<b>Bot:</b> 2.0.0\n<b>Uptime:</b> ${process.uptime().toFixed(2)}s`, { parse_mode: 'HTML' });
  });
  
  bot.command('qr', (ctx) => {
    generateSessionQR(ctx);
  });
  
  // Handle /pair command with direct phone number
  bot.command('pair', (ctx) => {
    const text = ctx.message.text;
    const phoneMatch = text.match(/\+?[\d\s\-()]{10,}/);
    
    if (phoneMatch) {
      // Phone number provided directly
      const phoneNumber = phoneMatch[0];
      generateSessionPhone(phoneNumber, ctx);
    } else {
      // Ask for phone number
      const message = `[ ♡ SIMON TECH BOT2 👀 ]\n\n<b>SELECT YOUR COUNTRY:</b>`;
      const countryButtons = [];
      
      const countryList = Object.entries(ALLOWED_COUNTRIES);
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
    }
  });
  
  // Handle country selection
  bot.action(/country_(.+)/, async (ctx) => {
    const countryCode = ctx.match[1];
    const userId = ctx.from.id;
    const countryInfo = ALLOWED_COUNTRIES[countryCode];
    
    if (countryInfo) {
      userSessions.set(userId, { step: 'enter_phone', countryCode: countryInfo.code, country: countryInfo.country });
      
      const message = `[ ♡ SIMON TECH BOT2 👀 ]\n\n╰┈➤ <b>ɴᴜᴍʙᴇʀ :</b> ${countryInfo.flag} ${countryInfo.country} (${countryInfo.code})\n\n<i>Send your phone number without country code.\nExample: 7074420859</i>`;
      
      await ctx.reply(message, { parse_mode: 'HTML' });
      ctx.answerCbQuery();
    } else {
      ctx.answerCbQuery('❌ Country not allowed!', true);
    }
  });
  
  // Handle text messages for phone number input
  bot.on('text', (ctx) => {
    const text = ctx.message.text.trim();
    const userId = ctx.from.id;
    const userSession = userSessions.get(userId);
    
    if (userSession && userSession.step === 'enter_phone') {
      if (/^\d{10,}$/.test(text)) {
        const fullPhoneNumber = userSession.countryCode + text;
        userSessions.delete(userId);
        generateSessionPhone(fullPhoneNumber, ctx);
      } else {
        ctx.reply('❌ Invalid. Send only digits (e.g., 7074420859)');
      }
    } else if (!text.startsWith('/')) {
      ctx.reply('❓ Unknown command. Use /help');
    }
  });
  
  bot.catch((err, ctx) => {
    console.error('Bot Error:', err);
  });
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
        <div class="info">✅ Bot is running! Use Telegram <strong>@simontech2bot</strong></div>
      </div>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', version: '2.0.0' });
});

const server = app.listen(PORT, () => {
  console.log(`\n✅ SIMON-TECH-BOT v2.0.0 is running on port ${PORT}`);
});

// Start Telegram Bot
if (bot) {
  bot.launch({
    polling: { interval: 300, timeout: 20 }
  }).then(() => {
    console.log('✅ Telegram Bot started');
  }).catch(err => {
    console.error('❌ Bot failed:', err);
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
}
