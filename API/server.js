// api/server.js

const express = require('express');
const cheerio = require('cheerio');
const CryptoJS = require('crypto-js');
const cors = require('cors');
const path = require('path');

const app = express();

// ======================================================
// OWNER & DEVELOPER INFORMATION
// ======================================================
const OWNER_NAME = "Mudasir Hussain";
const DEVELOPER_NAME = "Mudasir Hussain";
const CREATOR_NAME = "RiiCODE (Modified by Mudasir Hussain)";
const WEBSITE_NAME = "AIO Video Downloader";
const VERSION = "2.0.0";
const CURRENT_YEAR = new Date().getFullYear();

// ======================================================
// MIDDLEWARE
// ======================================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Public folder se static files serve karo
app.use(express.static(path.join(__dirname, '../public')));

// ======================================================
// AIO DOWNLOADER CORE FUNCTIONS (Same as before)
// ======================================================
const RcDL = {
  AmbilToken: async function () {
    try {
      const req = await fetch("https://allinonedownloader.com/");
      if (!req.ok) return null;

      const res = await req.text();
      const $ = cheerio.load(res);
      const token = $("#token").val();
      const url = $("#scc").val();
      const cookie = req.headers.get('set-cookie');

      return { token, url, cookie };
    } catch (error) {
      console.error("Token fetch error:", error);
      return null;
    }
  },

  generateHash: function (url, token) {
    try {
      const key = CryptoJS.enc.Hex.parse(token);
      const iv = CryptoJS.enc.Hex.parse('afc4e290725a3bf0ac4d3ff826c43c10');
      const encrypted = CryptoJS.AES.encrypt(url, key, {
        iv,
        padding: CryptoJS.pad.ZeroPadding
      });
      return encrypted.toString();
    } catch (error) {
      console.error("Hash generation error:", error);
      return null;
    }
  },

  download: async function (url) {
    try {
      const conf = await RcDL.AmbilToken();
      if (!conf) return { error: "Failed to get token from website.", result: {} };

      const { token, url: path, cookie } = conf;
      const hash = RcDL.generateHash(url, token);
      if (!hash) return { error: "Failed to generate hash", result: {} };

      const data = new URLSearchParams();
      data.append('url', url);
      data.append('token', token);
      data.append('urlhash', hash);

      const req = await fetch(`https://allinonedownloader.com${path}`, {
        method: "POST",
        headers: {
          "Accept": "*/*",
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "en-US,en;q=0.9,id-ID;q=0.8,id;q=0.7,as;q=0.6",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "Cookie": `crs_RCDL_AIO=blah; ${cookie}`,
          "Dnt": "1",
          "Origin": "https://allinonedownloader.com",
          "Referer": "https://allinonedownloader.com/",
          "Sec-Ch-Ua": `"Not-A.Brand";v="99", "Chromium";v="124"`,
          "Sec-Ch-Ua-Mobile": "?1",
          "Sec-Ch-Ua-Platform": `"Android"`,
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: data
      });

      if (!req.ok) return { error: "Error occurred while making request", result: {} };

      let json;
      try {
        json = await req.json();
      } catch (e) {
        console.error(e);
        return { error: e.message, result: {} };
      }

      // Platform detect karo URL se
      let platform = "unknown";
      if (url.includes('tiktok.com')) platform = 'tiktok';
      else if (url.includes('youtube.com') || url.includes('youtu.be')) platform = 'youtube';
      else if (url.includes('facebook.com') || url.includes('fb.com')) platform = 'facebook';
      else if (url.includes('instagram.com')) platform = 'instagram';
      else if (url.includes('twitter.com') || url.includes('x.com')) platform = 'twitter';
      else if (url.includes('pinterest.com')) platform = 'pinterest';
      else if (url.includes('vimeo.com')) platform = 'vimeo';

      return {
        success: true,
        input_url: url,
        platform: platform,
        source: json.source,
        result: {
          title: json.title || "Untitled",
          duration: json.duration || "Unknown",
          thumbnail: json.thumbnail || null,
          thumb_width: json.thumb_width || null,
          thumb_height: json.thumb_height || null,
          videoCount: json.videoCount || 0,
          imageCount: json.imageCount || 0,
          downloadUrls: json.links || []
        },
        error: null
      };
    } catch (error) {
      console.error("Download error:", error);
      return { error: error.message, result: {} };
    }
  }
};

// ======================================================
// API ENDPOINTS
// ======================================================

// Home page serve karo (public/index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// API endpoint for downloading
app.get('/api/download', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      owner: OWNER_NAME,
      developer: DEVELOPER_NAME,
      creator: CREATOR_NAME,
      website: WEBSITE_NAME,
      version: VERSION,
      status: false,
      error: "URL parameter is required",
      result: {}
    });
  }

  try {
    const data = await RcDL.download(url);

    if (data.error) {
      return res.status(500).json({
        owner: OWNER_NAME,
        developer: DEVELOPER_NAME,
        creator: CREATOR_NAME,
        website: WEBSITE_NAME,
        version: VERSION,
        status: false,
        error: data.error,
        result: {}
      });
    }

    return res.status(200).json({
      owner: OWNER_NAME,
      developer: DEVELOPER_NAME,
      creator: CREATOR_NAME,
      website: WEBSITE_NAME,
      version: VERSION,
      status: true,
      ...data
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      owner: OWNER_NAME,
      developer: DEVELOPER_NAME,
      creator: CREATOR_NAME,
      website: WEBSITE_NAME,
      version: VERSION,
      status: false,
      error: err.message,
      result: {}
    });
  }
});

// Get supported platforms
app.get('/api/platforms', (req, res) => {
  res.json({
    owner: OWNER_NAME,
    developer: DEVELOPER_NAME,
    creator: CREATOR_NAME,
    website: WEBSITE_NAME,
    version: VERSION,
    platforms: [
      { name: "TikTok", icon: "🎵", supported: true, urlPattern: "tiktok.com" },
      { name: "YouTube", icon: "▶️", supported: true, urlPattern: "youtube.com, youtu.be" },
      { name: "Facebook", icon: "📘", supported: true, urlPattern: "facebook.com, fb.com" },
      { name: "Instagram", icon: "📷", supported: true, urlPattern: "instagram.com" },
      { name: "Twitter/X", icon: "🐦", supported: true, urlPattern: "twitter.com, x.com" },
      { name: "Pinterest", icon: "📌", supported: true, urlPattern: "pinterest.com" },
      { name: "Vimeo", icon: "🎥", supported: true, urlPattern: "vimeo.com" },
      { name: "Dailymotion", icon: "🎬", supported: true, urlPattern: "dailymotion.com" },
      { name: "Tumblr", icon: "💬", supported: true, urlPattern: "tumblr.com" },
      { name: "Imgur", icon: "🖼️", supported: true, urlPattern: "imgur.com" },
      { name: "TED", icon: "🎤", supported: true, urlPattern: "ted.com" },
      { name: "Others", icon: "🌐", supported: true, urlPattern: "other platforms" }
    ]
  });
});

// Server status check
app.get('/api/status', (req, res) => {
  res.json({
    owner: OWNER_NAME,
    developer: DEVELOPER_NAME,
    creator: CREATOR_NAME,
    website: WEBSITE_NAME,
    version: VERSION,
    status: "online",
    server_time: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ======================================================
// IMPORTANT: Vercel ke liye app export karo (app.listen() nahi)
// ======================================================
module.exports = app;
