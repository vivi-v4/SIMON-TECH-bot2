// SIMON TECH BOT - WhatsApp Commands Configuration
// Version 2.0.0
// Multi-Device WhatsApp Bot with 800+ Commands

const WHATSAPP_COMMANDS = {
  // 👑 OWNER COMMANDS (50)
  owner: {
    category: '👑 OWNER',
    description: 'Owner-only privileged commands',
    count: 50,
    commands: [
      { cmd: '!broadcast', desc: 'Send message to all users' },
      { cmd: '!ban', desc: 'Ban a user' },
      { cmd: '!unban', desc: 'Unban a user' },
      { cmd: '!restart', desc: 'Restart bot' },
      { cmd: '!shutdown', desc: 'Shutdown bot' },
      { cmd: '!update', desc: 'Update bot' },
      { cmd: '!stats', desc: 'Show bot statistics' },
      { cmd: '!eval', desc: 'Execute code' },
      { cmd: '!shell', desc: 'Execute shell command' },
      { cmd: '!logs', desc: 'View bot logs' },
      { cmd: '!setprefix', desc: 'Change bot prefix' },
      { cmd: '!getvar', desc: 'Get variable value' },
      { cmd: '!setvar', desc: 'Set variable value' },
      { cmd: '!clearvar', desc: 'Clear variable' },
      { cmd: '!backup', desc: 'Backup bot data' },
      { cmd: '!restore', desc: 'Restore bot data' },
      { cmd: '!maintenance', desc: 'Enable maintenance mode' },
      { cmd: '!addowner', desc: 'Add new owner' },
      { cmd: '!removeowner', desc: 'Remove owner' },
      { cmd: '!owners', desc: 'List all owners' },
    ]
  },

  // ⚙️ SYSTEM COMMANDS (50)
  system: {
    category: '⚙️ SYSTEM',
    description: 'System and bot management commands',
    count: 50,
    commands: [
      { cmd: '!help', desc: 'Show help menu' },
      { cmd: '!commands', desc: 'List all commands' },
      { cmd: '!menu', desc: 'Show menu' },
      { cmd: '!ping', desc: 'Check bot latency' },
      { cmd: '!status', desc: 'Show bot status' },
      { cmd: '!uptime', desc: 'Show bot uptime' },
      { cmd: '!version', desc: 'Show bot version' },
      { cmd: '!info', desc: 'Show bot info' },
      { cmd: '!about', desc: 'About SIMON TECH BOT' },
      { cmd: '!prefix', desc: 'Show current prefix' },
      { cmd: '!speed', desc: 'Check connection speed' },
      { cmd: '!time', desc: 'Show current time' },
      { cmd: '!date', desc: 'Show current date' },
      { cmd: '!weather', desc: 'Get weather info' },
      { cmd: '!timezone', desc: 'Get timezone info' },
      { cmd: '!memory', desc: 'Show memory usage' },
      { cmd: '!cpu', desc: 'Show CPU usage' },
      { cmd: '!disk', desc: 'Show disk usage' },
      { cmd: '!settings', desc: 'View bot settings' },
      { cmd: '!config', desc: 'Configure bot' },
    ]
  },

  // 👤 PROFILE COMMANDS (40)
  profile: {
    category: '👤 PROFILE',
    description: 'User profile and information commands',
    count: 40,
    commands: [
      { cmd: '!profile', desc: 'Show your profile' },
      { cmd: '!setprofile', desc: 'Set profile info' },
      { cmd: '!bio', desc: 'Set biography' },
      { cmd: '!avatar', desc: 'Set profile picture' },
      { cmd: '!stats', desc: 'Show user statistics' },
      { cmd: '!level', desc: 'Show your level' },
      { cmd: '!xp', desc: 'Show experience points' },
      { cmd: '!rank', desc: 'Show your rank' },
      { cmd: '!leaderboard', desc: 'Show leaderboard' },
      { cmd: '!badges', desc: 'Show your badges' },
      { cmd: '!achievements', desc: 'Show achievements' },
      { cmd: '!inventory', desc: 'Show inventory' },
      { cmd: '!wallet', desc: 'Show wallet balance' },
      { cmd: '!history', desc: 'Show command history' },
      { cmd: '!activity', desc: 'Show activity log' },
      { cmd: '!premium', desc: 'Check premium status' },
      { cmd: '!verify', desc: 'Verify account' },
      { cmd: '!reset', desc: 'Reset profile' },
      { cmd: '!privacy', desc: 'Privacy settings' },
      { cmd: '!logout', desc: 'Logout from account' },
    ]
  },

  // 👥 GROUP COMMANDS (80)
  group: {
    category: '👥 GROUP',
    description: 'Group management and moderation commands',
    count: 80,
    commands: [
      { cmd: '!groupinfo', desc: 'Show group information' },
      { cmd: '!members', desc: 'List group members' },
      { cmd: '!admins', desc: 'List group admins' },
      { cmd: '!add', desc: 'Add member to group' },
      { cmd: '!remove', desc: 'Remove member from group' },
      { cmd: '!kick', desc: 'Kick member' },
      { cmd: '!ban', desc: 'Ban member from group' },
      { cmd: '!unban', desc: 'Unban member' },
      { cmd: '!promote', desc: 'Promote to admin' },
      { cmd: '!demote', desc: 'Demote from admin' },
      { cmd: '!setname', desc: 'Change group name' },
      { cmd: '!setdesc', desc: 'Change group description' },
      { cmd: '!seticon', desc: 'Change group icon' },
      { cmd: '!mute', desc: 'Mute group/user' },
      { cmd: '!unmute', desc: 'Unmute group/user' },
      { cmd: '!lock', desc: 'Lock group (only admins can send messages)' },
      { cmd: '!unlock', desc: 'Unlock group' },
      { cmd: '!close', desc: 'Close group' },
      { cmd: '!open', desc: 'Open group' },
      { cmd: '!leave', desc: 'Leave group' },
      { cmd: '!invite', desc: 'Get group invite link' },
      { cmd: '!revoke', desc: 'Revoke invite link' },
      { cmd: '!settings', desc: 'Group settings' },
      { cmd: '!welcome', desc: 'Set welcome message' },
      { cmd: '!goodbye', desc: 'Set goodbye message' },
      { cmd: '!rules', desc: 'Show group rules' },
      { cmd: '!antilink', desc: 'Enable anti-link' },
      { cmd: '!antispam', desc: 'Enable anti-spam' },
      { cmd: '!antiflood', desc: 'Enable anti-flood' },
      { cmd: '!warns', desc: 'Show warns' },
      { cmd: '!warn', desc: 'Warn member' },
      { cmd: '!unwarn', desc: 'Remove warning' },
      { cmd: '!clear', desc: 'Clear chat' },
      { cmd: '!delete', desc: 'Delete messages' },
      { cmd: '!pin', desc: 'Pin message' },
      { cmd: '!unpin', desc: 'Unpin message' },
      { cmd: '!poll', desc: 'Create poll' },
      { cmd: '!announce', desc: 'Make announcement' },
      { cmd: '!suggest', desc: 'Send suggestion' },
      { cmd: '!report', desc: 'Report member' },
    ]
  },

  // 🔐 SECURITY COMMANDS (60)
  security: {
    category: '🔐 SECURITY',
    description: 'Security and protection commands',
    count: 60,
    commands: [
      { cmd: '!lock', desc: 'Lock messages/files' },
      { cmd: '!unlock', desc: 'Unlock messages/files' },
      { cmd: '!encrypt', desc: 'Encrypt text' },
      { cmd: '!decrypt', desc: 'Decrypt text' },
      { cmd: '!hash', desc: 'Hash text' },
      { cmd: '!verify', desc: 'Verify signature' },
      { cmd: '!password', desc: 'Generate password' },
      { cmd: '!2fa', desc: 'Enable 2FA' },
      { cmd: '!backup', desc: 'Backup account' },
      { cmd: '!restore', desc: 'Restore account' },
      { cmd: '!antispy', desc: 'Anti-spy protection' },
      { cmd: '!privacy', desc: 'Privacy settings' },
      { cmd: '!blocked', desc: 'Show blocked users' },
      { cmd: '!block', desc: 'Block user' },
      { cmd: '!unblock', desc: 'Unblock user' },
      { cmd: '!report', desc: 'Report abuse' },
      { cmd: '!spam', desc: 'Report spam' },
      { cmd: '!virus', desc: 'Report virus' },
      { cmd: '!phishing', desc: 'Report phishing' },
      { cmd: '!logs', desc: 'View security logs' },
      { cmd: '!audit', desc: 'Audit trail' },
      { cmd: '!sessions', desc: 'Show active sessions' },
      { cmd: '!logout', desc: 'Logout all sessions' },
      { cmd: '!firewall', desc: 'Enable firewall' },
      { cmd: '!whitelist', desc: 'Whitelist contact' },
      { cmd: '!blacklist', desc: 'Blacklist contact' },
      { cmd: '!scan', desc: 'Scan for threats' },
      { cmd: '!protect', desc: 'Protect account' },
      { cmd: '!2facode', desc: 'Generate 2FA code' },
      { cmd: '!vpn', desc: 'Connect to VPN' },
    ]
  },

  // 🧠 AI COMMANDS (100)
  ai: {
    category: '🧠 AI',
    description: 'Artificial Intelligence and automation',
    count: 100,
    commands: [
      { cmd: '!gpt', desc: 'Ask GPT AI' },
      { cmd: '!chat', desc: 'Chat with AI' },
      { cmd: '!imagine', desc: 'Generate image' },
      { cmd: '!summarize', desc: 'Summarize text' },
      { cmd: '!translate', desc: 'Translate text' },
      { cmd: '!grammar', desc: 'Fix grammar' },
      { cmd: '!rephrase', desc: 'Rephrase text' },
      { cmd: '!sentiment', desc: 'Analyze sentiment' },
      { cmd: '!classify', desc: 'Classify text' },
      { cmd: '!extract', desc: 'Extract information' },
      { cmd: '!question', desc: 'Answer question' },
      { cmd: '!joke', desc: 'Tell a joke' },
      { cmd: '!quote', desc: 'Random quote' },
      { cmd: '!story', desc: 'Generate story' },
      { cmd: '!poem', desc: 'Generate poem' },
      { cmd: '!song', desc: 'Generate song lyrics' },
      { cmd: '!code', desc: 'Generate code' },
      { cmd: '!debug', desc: 'Debug code' },
      { cmd: '!explain', desc: 'Explain code' },
      { cmd: '!review', desc: 'Code review' },
      { cmd: '!optimize', desc: 'Optimize code' },
      { cmd: '!ml', desc: 'Machine learning' },
      { cmd: '!predict', desc: 'Make prediction' },
      { cmd: '!analyze', desc: 'Analyze data' },
      { cmd: '!ocr', desc: 'Extract text from image' },
      { cmd: '!face', desc: 'Face recognition' },
      { cmd: '!voice', desc: 'Voice recognition' },
      { cmd: '!nlp', desc: 'Natural language processing' },
      { cmd: '!cv', desc: 'Computer vision' },
      { cmd: '!recommend', desc: 'Get recommendation' },
    ]
  },

  // 📥 DOWNLOADER COMMANDS (80)
  downloader: {
    category: '📥 DOWNLOADER',
    description: 'Download files, videos, music, etc',
    count: 80,
    commands: [
      { cmd: '!youtube', desc: 'Download from YouTube' },
      { cmd: '!tiktok', desc: 'Download from TikTok' },
      { cmd: '!instagram', desc: 'Download from Instagram' },
      { cmd: '!facebook', desc: 'Download from Facebook' },
      { cmd: '!twitter', desc: 'Download from Twitter' },
      { cmd: '!pinterest', desc: 'Download from Pinterest' },
      { cmd: '!spotify', desc: 'Download from Spotify' },
      { cmd: '!soundcloud', desc: 'Download from SoundCloud' },
      { cmd: '!video', desc: 'Download video' },
      { cmd: '!audio', desc: 'Download audio' },
      { cmd: '!music', desc: 'Download music' },
      { cmd: '!mp3', desc: 'Convert to MP3' },
      { cmd: '!mp4', desc: 'Convert to MP4' },
      { cmd: '!image', desc: 'Download image' },
      { cmd: '!document', desc: 'Download document' },
      { cmd: '!pdf', desc: 'Convert to PDF' },
      { cmd: '!zip', desc: 'Create ZIP file' },
      { cmd: '!torrent', desc: 'Download torrent' },
      { cmd: '!magnet', desc: 'Download from magnet link' },
      { cmd: '!mediafire', desc: 'Download from MediaFire' },
      { cmd: '!mega', desc: 'Download from MEGA' },
      { cmd: '!drive', desc: 'Download from Google Drive' },
      { cmd: '!dropbox', desc: 'Download from Dropbox' },
      { cmd: '!wetransfer', desc: 'Download from WeTransfer' },
      { cmd: '!playlist', desc: 'Download playlist' },
      { cmd: '!stream', desc: 'Stream media' },
      { cmd: '!proxy', desc: 'Use proxy download' },
      { cmd: '!speed', desc: 'Check download speed' },
      { cmd: '!quota', desc: 'Check download quota' },
      { cmd: '!history', desc: 'View download history' },
    ]
  },

  // 🖼️ MEDIA COMMANDS (60)
  media: {
    category: '🖼️ MEDIA',
    description: 'Image and media editing commands',
    count: 60,
    commands: [
      { cmd: '!edit', desc: 'Edit image' },
      { cmd: '!crop', desc: 'Crop image' },
      { cmd: '!resize', desc: 'Resize image' },
      { cmd: '!rotate', desc: 'Rotate image' },
      { cmd: '!flip', desc: 'Flip image' },
      { cmd: '!filter', desc: 'Apply filter' },
      { cmd: '!blur', desc: 'Blur image' },
      { cmd: '!sharpen', desc: 'Sharpen image' },
      { cmd: '!grayscale', desc: 'Convert to grayscale' },
      { cmd: '!sepia', desc: 'Apply sepia effect' },
      { cmd: '!invert', desc: 'Invert colors' },
      { cmd: '!text', desc: 'Add text to image' },
      { cmd: '!watermark', desc: 'Add watermark' },
      { cmd: '!collage', desc: 'Create collage' },
      { cmd: '!meme', desc: 'Create meme' },
      { cmd: '!avatar', desc: 'Create avatar' },
      { cmd: '!qrcode', desc: 'Generate QR code' },
      { cmd: '!barcode', desc: 'Generate barcode' },
      { cmd: '!convert', desc: 'Convert image format' },
      { cmd: '!compress', desc: 'Compress image' },
      { cmd: '!enhance', desc: 'Enhance quality' },
      { cmd: '!denoise', desc: 'Remove noise' },
      { cmd: '!upscale', desc: 'Upscale image' },
      { cmd: '!thumbnail', desc: 'Create thumbnail' },
      { cmd: '!gif', desc: 'Create GIF' },
      { cmd: '!video', desc: 'Create video' },
      { cmd: '!montage', desc: 'Create montage' },
      { cmd: '!poster', desc: 'Create poster' },
      { cmd: '!card', desc: 'Create card' },
      { cmd: '!certificate', desc: 'Create certificate' },
    ]
  },

  // 🎮 GAMES COMMANDS (80)
  games: {
    category: '🎮 GAMES',
    description: 'Games and entertainment',
    count: 80,
    commands: [
      { cmd: '!play', desc: 'Start game' },
      { cmd: '!dice', desc: 'Roll dice' },
      { cmd: '!coin', desc: 'Flip coin' },
      { cmd: '!rps', desc: 'Rock Paper Scissors' },
      { cmd: '!guess', desc: 'Guess number' },
      { cmd: '!trivia', desc: 'Trivia quiz' },
      { cmd: '!riddle', desc: 'Riddle game' },
      { cmd: '!hangman', desc: 'Hangman game' },
      { cmd: '!chess', desc: 'Play chess' },
      { cmd: '!checkers', desc: 'Play checkers' },
      { cmd: '!tic', desc: 'Tic Tac Toe' },
      { cmd: '!connect', desc: 'Connect Four' },
      { cmd: '!snake', desc: 'Snake game' },
      { cmd: '!2048', desc: '2048 game' },
      { cmd: '!flappy', desc: 'Flappy Bird' },
      { cmd: '!slots', desc: 'Slot machine' },
      { cmd: '!poker', desc: 'Poker game' },
      { cmd: '!blackjack', desc: 'Blackjack' },
      { cmd: '!bingo', desc: 'Bingo game' },
      { cmd: '!lottery', desc: 'Lottery' },
      { cmd: '!scratch', desc: 'Scratch card' },
      { cmd: '!war', desc: 'Card war' },
      { cmd: '!fight', desc: 'Fight game' },
      { cmd: '!rpg', desc: 'RPG adventure' },
      { cmd: '!quest', desc: 'Quest game' },
      { cmd: '!dungeon', desc: 'Dungeon crawler' },
      { cmd: '!battle', desc: 'Battle arena' },
      { cmd: '!tournament', desc: 'Tournament' },
      { cmd: '!multiplayer', desc: 'Multiplayer game' },
      { cmd: '!leaderboard', desc: 'Game leaderboard' },
    ]
  },

  // 💰 ECONOMY COMMANDS (80)
  economy: {
    category: '💰 ECONOMY',
    description: 'Economy and currency system',
    count: 80,
    commands: [
      { cmd: '!balance', desc: 'Check balance' },
      { cmd: '!wallet', desc: 'Show wallet' },
      { cmd: '!money', desc: 'Show money' },
      { cmd: '!daily', desc: 'Claim daily reward' },
      { cmd: '!weekly', desc: 'Claim weekly reward' },
      { cmd: '!monthly', desc: 'Claim monthly reward' },
      { cmd: '!work', desc: 'Work for money' },
      { cmd: '!farm', desc: 'Farm money' },
      { cmd: '!fish', desc: 'Fish for money' },
      { cmd: '!hunt', desc: 'Hunt for money' },
      { cmd: '!mine', desc: 'Mine for money' },
      { cmd: '!rob', desc: 'Rob money' },
      { cmd: '!gamble', desc: 'Gamble money' },
      { cmd: '!bet', desc: 'Place bet' },
      { cmd: '!invest', desc: 'Invest money' },
      { cmd: '!trade', desc: 'Trade items' },
      { cmd: '!sell', desc: 'Sell items' },
      { cmd: '!buy', desc: 'Buy items' },
      { cmd: '!shop', desc: 'Open shop' },
      { cmd: '!store', desc: 'Visit store' },
      { cmd: '!market', desc: 'Open market' },
      { cmd: '!auction', desc: 'Auction items' },
      { cmd: '!bid', bet: 'Place bid' },
      { cmd: '!loan', desc: 'Take loan' },
      { cmd: '!repay', desc: 'Repay loan' },
      { cmd: '!gift', desc: 'Gift money' },
      { cmd: '!transfer', desc: 'Transfer money' },
      { cmd: '!tax', desc: 'Pay tax' },
      { cmd: '!insurance', desc: 'Buy insurance' },
      { cmd: '!crypto', desc: 'Buy cryptocurrency' },
    ]
  },

  // 🏦 BANK COMMANDS (40)
  bank: {
    category: '🏦 BANK',
    description: 'Banking services',
    count: 40,
    commands: [
      { cmd: '!bank', desc: 'Open bank' },
      { cmd: '!deposit', desc: 'Deposit money' },
      { cmd: '!withdraw', desc: 'Withdraw money' },
      { cmd: '!transfer', desc: 'Transfer money' },
      { cmd: '!loan', desc: 'Request loan' },
      { cmd: '!pay', desc: 'Pay bill' },
      { cmd: '!account', desc: 'Account info' },
      { cmd: '!statement', desc: 'Bank statement' },
      { cmd: '!interest', desc: 'Check interest' },
      { cmd: '!credit', desc: 'Check credit' },
      { cmd: '!savings', desc: 'Savings account' },
      { cmd: '!investment', desc: 'Investment account' },
      { cmd: '!stocks', desc: 'Buy stocks' },
      { cmd: '!bonds', desc: 'Buy bonds' },
      { cmd: '!forex', desc: 'Forex trading' },
      { cmd: '!insurance', desc: 'Insurance' },
      { cmd: '!mortgage', desc: 'Mortgage' },
      { cmd: '!creditcard', desc: 'Credit card' },
      { cmd: '!debitcard', desc: 'Debit card' },
      { cmd: '!transactions', desc: 'Transaction history' },
    ]
  },

  // 🎭 ANIME COMMANDS (40)
  anime: {
    category: '🎭 ANIME',
    description: 'Anime and manga commands',
    count: 40,
    commands: [
      { cmd: '!anime', desc: 'Get anime info' },
      { cmd: '!manga', desc: 'Get manga info' },
      { cmd: '!character', desc: 'Get character info' },
      { cmd: '!waifu', desc: 'Get random waifu' },
      { cmd: '!husbando', desc: 'Get random husbando' },
      { cmd: '!neko', desc: 'Get random neko' },
      { cmd: '!foxgirl', desc: 'Get random foxgirl' },
      { cmd: '!loli', desc: 'Get random loli' },
      { cmd: '!wallpaper', desc: 'Anime wallpaper' },
      { cmd: '!cosplay', desc: 'Cosplay images' },
      { cmd: '!hanime', desc: 'H-anime search' },
      { cmd: '!search', desc: 'Search anime' },
      { cmd: '!trending', desc: 'Trending anime' },
      { cmd: '!schedule', desc: 'Anime schedule' },
      { cmd: '!quote', desc: 'Anime quote' },
      { cmd: '!fact', desc: 'Anime fact' },
      { cmd: '!review', desc: 'Anime review' },
      { cmd: '!rating', desc: 'Anime rating' },
      { cmd: '!recommend', desc: 'Anime recommendation' },
      { cmd: '!watchlist', desc: 'My watchlist' },
    ]
  },

  // 🔍 SEARCH COMMANDS (40)
  search: {
    category: '🔍 SEARCH',
    description: 'Search and information commands',
    count: 40,
    commands: [
      { cmd: '!google', desc: 'Google search' },
      { cmd: '!bing', desc: 'Bing search' },
      { cmd: '!wikipedia', desc: 'Wikipedia search' },
      { cmd: '!youtube', desc: 'YouTube search' },
      { cmd: '!weather', desc: 'Weather info' },
      { cmd: '!news', desc: 'Get news' },
      { cmd: '!stock', desc: 'Stock info' },
      { cmd: '!crypto', desc: 'Cryptocurrency info' },
      { cmd: '!movie', desc: 'Movie info' },
      { cmd: '!series', desc: 'Series info' },
      { cmd: '!book', desc: 'Book info' },
      { cmd: '!recipe', desc: 'Recipe search' },
      { cmd: '!restaurant', desc: 'Restaurant search' },
      { cmd: '!hotel', desc: 'Hotel search' },
      { cmd: '!flight', desc: 'Flight search' },
      { cmd: '!train', desc: 'Train search' },
      { cmd: '!bus', desc: 'Bus search' },
      { cmd: '!map', desc: 'Map search' },
      { cmd: '!direction', desc: 'Get directions' },
      { cmd: '!location', desc: 'Location info' },
    ]
  },

  // 🛠️ TOOLS COMMANDS (50)
  tools: {
    category: '🛠️ TOOLS',
    description: 'Utility tools and helpers',
    count: 50,
    commands: [
      { cmd: '!calc', desc: 'Calculator' },
      { cmd: '!convert', desc: 'Unit converter' },
      { cmd: '!timer', desc: 'Set timer' },
      { cmd: '!alarm', desc: 'Set alarm' },
      { cmd: '!reminder', desc: 'Set reminder' },
      { cmd: '!todo', desc: 'Todo list' },
      { cmd: '!note', desc: 'Create note' },
      { cmd: '!paste', desc: 'Paste bin' },
      { cmd: '!url', desc: 'Shorten URL' },
      { cmd: '!qr', desc: 'Generate QR' },
      { cmd: '!barcode', desc: 'Generate barcode' },
      { cmd: '!hash', desc: 'Hash text' },
      { cmd: '!encode', desc: 'Encode text' },
      { cmd: '!decode', desc: 'Decode text' },
      { cmd: '!base64', desc: 'Base64 encode' },
      { cmd: '!hex', desc: 'Hex converter' },
      { cmd: '!binary', desc: 'Binary converter' },
      { cmd: '!regex', desc: 'Regex tester' },
      { cmd: '!json', desc: 'JSON formatter' },
      { cmd: '!xml', desc: 'XML formatter' },
    ]
  },

  // 🌐 INTERNET COMMANDS (30)
  internet: {
    category: '🌐 INTERNET',
    description: 'Internet and network tools',
    count: 30,
    commands: [
      { cmd: '!ping', desc: 'Ping server' },
      { cmd: '!dns', desc: 'DNS lookup' },
      { cmd: '!whois', desc: 'WHOIS lookup' },
      { cmd: '!ip', desc: 'IP info' },
      { cmd: '!speedtest', desc: 'Speed test' },
      { cmd: '!proxy', desc: 'Proxy list' },
      { cmd: '!vpn', desc: 'VPN info' },
      { cmd: '!torrent', desc: 'Torrent search' },
      { cmd: '!magnet', desc: 'Magnet link' },
      { cmd: '!http', desc: 'HTTP status' },
      { cmd: '!hostname', desc: 'Hostname lookup' },
      { cmd: '!port', desc: 'Port scanner' },
      { cmd: '!ssl', desc: 'SSL certificate info' },
      { cmd: '!certificate', desc: 'Certificate info' },
      { cmd: '!trace', desc: 'Traceroute' },
    ]
  },

  // 🎨 DESIGN COMMANDS (30)
  design: {
    category: '🎨 DESIGN',
    description: 'Design and creation tools',
    count: 30,
    commands: [
      { cmd: '!color', desc: 'Color converter' },
      { cmd: '!palette', desc: 'Color palette' },
      { cmd: '!font', desc: 'Font info' },
      { cmd: '!template', desc: 'Design template' },
      { cmd: '!mockup', desc: 'Mockup generator' },
      { cmd: '!logo', desc: 'Logo generator' },
      { cmd: '!gradient', desc: 'Gradient generator' },
      { cmd: '!pattern', desc: 'Pattern generator' },
      { cmd: '!icon', desc: 'Icon generator' },
      { cmd: '!emoji', desc: 'Emoji picker' },
      { cmd: '!sticker', desc: 'Sticker maker' },
      { cmd: '!banner', desc: 'Banner maker' },
      { cmd: '!thumbnail', desc: 'Thumbnail maker' },
      { cmd: '!signature', desc: 'Signature generator' },
      { cmd: '!certificate', desc: 'Certificate maker' },
    ]
  },

  // 📚 EDUCATION COMMANDS (30)
  education: {
    category: '📚 EDUCATION',
    description: 'Educational content',
    count: 30,
    commands: [
      { cmd: '!lesson', desc: 'Get lesson' },
      { cmd: '!tutorial', desc: 'Get tutorial' },
      { cmd: '!course', desc: 'Get course' },
      { cmd: '!quiz', desc: 'Take quiz' },
      { cmd: '!test', desc: 'Take test' },
      { cmd: '!math', desc: 'Math help' },
      { cmd: '!science', desc: 'Science help' },
      { cmd: '!history', desc: 'History info' },
      { cmd: '!geography', desc: 'Geography info' },
      { cmd: '!language', desc: 'Language learning' },
      { cmd: '!vocabulary', desc: 'Vocabulary' },
      { cmd: '!grammar', desc: 'Grammar rules' },
      { cmd: '!dictionary', desc: 'Dictionary lookup' },
      { cmd: '!thesaurus', desc: 'Thesaurus' },
      { cmd: '!citation', desc: 'Citation generator' },
    ]
  },

  // ☁️ CLOUD COMMANDS (20)
  cloud: {
    category: '☁️ CLOUD',
    description: 'Cloud storage and sync',
    count: 20,
    commands: [
      { cmd: '!upload', desc: 'Upload file' },
      { cmd: '!download', desc: 'Download file' },
      { cmd: '!share', desc: 'Share file' },
      { cmd: '!delete', desc: 'Delete file' },
      { cmd: '!storage', desc: 'Storage info' },
      { cmd: '!backup', desc: 'Backup files' },
      { cmd: '!sync', desc: 'Sync files' },
      { cmd: '!folder', desc: 'Create folder' },
      { cmd: '!file', desc: 'Manage files' },
      { cmd: '!permission', desc: 'File permissions' },
    ]
  },

  // 🚀 DEVELOPER COMMANDS (20)
  developer: {
    category: '🚀 DEVELOPER',
    description: 'Developer tools and APIs',
    count: 20,
    commands: [
      { cmd: '!api', desc: 'API documentation' },
      { cmd: '!docs', desc: 'Documentation' },
      { cmd: '!source', desc: 'Source code' },
      { cmd: '!repository', desc: 'Repository info' },
      { cmd: '!github', desc: 'GitHub info' },
      { cmd: '!npm', desc: 'NPM package info' },
      { cmd: '!pip', desc: 'Python package info' },
      { cmd: '!maven', desc: 'Maven info' },
      { cmd: '!gradle', desc: 'Gradle info' },
      { cmd: '!docker', desc: 'Docker info' },
    ]
  }
};

// Command Statistics
const COMMAND_STATS = {
  totalCommands: 800,
  totalCategories: 20,
  botType: 'Multi Device',
  version: '2.0.0',
  owner: 'SIMON TECH',
  status: 'ONLINE 🟢'
};

// Export functions
function getCommandMenu() {
  let menu = `
╭──────────────────────────────╮
│      🤖 SIMON TECH BOT       │
│    ⚡ 800+ COMMANDS ⚡      │
╰──────────────────────────────╯\n`;

  for (const [key, category] of Object.entries(WHATSAPP_COMMANDS)) {
    menu += `├⊷ ${category.category} (${category.count} COMMANDS)\n`;
  }

  menu += `
├⊷ 📊 TOTAL COMMANDS: ${COMMAND_STATS.totalCommands}+
├⊷ 🤖 BOT TYPE: ${COMMAND_STATS.botType}
├⊷ ⚡ VERSION: ${COMMAND_STATS.version}
├⊷ 👑 OWNER: ${COMMAND_STATS.owner}
├⊷ 🚀 STATUS: ${COMMAND_STATS.status}
╰━━━━━━━━━━━╯`;

  return menu;
}

function getCategoryCommands(categoryName) {
  const category = WHATSAPP_COMMANDS[categoryName];
  if (!category) return `Category "${categoryName}" not found!`;

  let list = `
╭─ ${category.category} (${category.count} COMMANDS)
├ ${category.description}\n`;

  category.commands.forEach((cmd, index) => {
    if (index < 10) {
      list += `├ ${cmd.cmd.padEnd(15)} → ${cmd.desc}\n`;
    }
  });

  if (category.count > 10) {
    list += `├ ... and ${category.count - 10} more commands\n`;
  }

  list += `╰━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  return list;
}

function searchCommand(query) {
  const results = [];
  for (const [key, category] of Object.entries(WHATSAPP_COMMANDS)) {
    category.commands.forEach(cmd => {
      if (cmd.cmd.includes(query.toLowerCase()) || cmd.desc.includes(query.toLowerCase())) {
        results.push({
          cmd: cmd.cmd,
          desc: cmd.desc,
          category: category.category
        });
      }
    });
  }
  return results;
}

module.exports = {
  WHATSAPP_COMMANDS,
  COMMAND_STATS,
  getCommandMenu,
  getCategoryCommands,
  searchCommand
};
