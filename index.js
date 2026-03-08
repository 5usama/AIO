const express = require('express');
const cheerio = require('cheerio');
const CryptoJS = require('crypto-js');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ======================================================
// OWNER & DEVELOPER INFORMATION
// ======================================================
const OWNER_NAME = "Mudasir Hussain";
const DEVELOPER_NAME = "Mudasir Hussain";
const CREATOR_NAME = "Mudasir Hussain";
const WEBSITE_NAME = "AIO Video Downloader";
const VERSION = "2.0.0";
const CURRENT_YEAR = new Date().getFullYear();

// ======================================================
// AIO DOWNLOADER CORE FUNCTIONS
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
      return null;
    }
  },

  generateHash: function (url, token) {
    try {
      const key = CryptoJS.enc.Hex.parse(token);
      const iv = CryptoJS.enc.Hex.parse('afc4e290725a3bf0ac4d3ff826c43c10');
      const encrypted = CryptoJS.AES.encrypt(url, key, { iv, padding: CryptoJS.pad.ZeroPadding });
      return encrypted.toString();
    } catch (error) {
      return null;
    }
  },

  download: async function (url) {
    try {
      const conf = await RcDL.AmbilToken();
      if (!conf) return { error: "Failed to get token", result: {} };

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
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "Cookie": `crs_RCDL_AIO=blah; ${cookie}`,
          "Origin": "https://allinonedownloader.com",
          "Referer": "https://allinonedownloader.com/",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36",
          "X-Requested-With": "XMLHttpRequest"
        },
        body: data
      });

      if (!req.ok) return { error: "Request failed", result: {} };
      const json = await req.json();

      let platform = "unknown";
      if (url.includes('tiktok.com')) platform = 'tiktok';
      else if (url.includes('youtube.com') || url.includes('youtu.be')) platform = 'youtube';
      else if (url.includes('facebook.com') || url.includes('fb.com')) platform = 'facebook';
      else if (url.includes('instagram.com')) platform = 'instagram';

      return {
        success: true,
        input_url: url,
        platform: platform,
        source: json.source,
        result: {
          title: json.title || "Untitled",
          duration: json.duration || "Unknown",
          thumbnail: json.thumbnail || null,
          downloadUrls: json.links || []
        },
        error: null
      };
    } catch (error) {
      return { error: error.message, result: {} };
    }
  }
};

// ======================================================
// HTML TEMPLATE (Embedded in JS)
// ======================================================
const HTML_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AIO Video Downloader</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', sans-serif; }
        body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; }
        .container { width: 100%; max-width: 800px; }
        .header { text-align: center; color: white; margin-bottom: 30px; }
        .header h1 { font-size: 2.5rem; margin-bottom: 10px; }
        .owner-info { background: rgba(255,255,255,0.2); padding: 10px 20px; border-radius: 50px; display: inline-block; }
        .main-card { background: white; border-radius: 20px; padding: 30px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .url-section { margin: 20px 0; }
        .url-input-group { display: flex; gap: 10px; }
        .url-input-group input { flex: 1; padding: 15px; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 16px; }
        .url-input-group button { padding: 15px 30px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; border: none; border-radius: 10px; font-size: 16px; cursor: pointer; }
        .url-input-group button:disabled { opacity: 0.5; }
        .loading { display: none; text-align: center; margin: 20px 0; }
        .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #667eea; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .results { display: none; margin-top: 20px; }
        .video-info { display: flex; gap: 20px; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px; }
        .thumbnail { width: 150px; height: 120px; object-fit: cover; border-radius: 8px; }
        .download-btn { display: block; padding: 12px; margin: 5px 0; background: #667eea; color: white; text-decoration: none; border-radius: 5px; text-align: center; }
        .error-message { display: none; background: #f8d7da; color: #721c24; padding: 15px; border-radius: 10px; margin: 20px 0; text-align: center; }
        .footer { text-align: center; margin-top: 30px; color: rgba(255,255,255,0.8); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎥 AIO Video Downloader</h1>
            <div class="owner-info">
                <span>👑 Owner:</span> Mudasir Hussain | 
                <span>💻 Developer:</span> Mudasir Hussain
            </div>
        </div>

        <div class="main-card">
            <div class="url-section">
                <div class="url-input-group">
                    <input type="url" id="urlInput" placeholder="Paste video URL (e.g., https://tiktok.com/@user/video/123456)">
                    <button onclick="downloadVideo()" id="downloadBtn">Download</button>
                </div>
            </div>

            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p style="margin-top: 10px;">Fetching video...</p>
            </div>

            <div class="error-message" id="errorMessage">
                <span id="errorText"></span>
            </div>

            <div class="results" id="results">
                <div class="video-info" id="videoInfo"></div>
                <div id="downloadLinks"></div>
            </div>
        </div>

        <div class="footer">
            <p>© 2025 AIO Video Downloader</p>
        </div>
    </div>

    <script>
        async function downloadVideo() {
            const url = document.getElementById('urlInput').value.trim();
            if (!url) {
                alert('Please enter URL');
                return;
            }

            document.getElementById('loading').style.display = 'block';
            document.getElementById('results').style.display = 'none';
            document.getElementById('errorMessage').style.display = 'none';
            document.getElementById('downloadBtn').disabled = true;

            try {
                const baseUrl = window.location.origin;
                const response = await fetch(\`\${baseUrl}/api/download?url=\${encodeURIComponent(url)}\`);
                const data = await response.json();

                if (data.status && data.result && data.result.downloadUrls) {
                    displayResults(data);
                } else {
                    showError(data.error || 'Download failed');
                }
            } catch (error) {
                showError('Network error: ' + error.message);
            } finally {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('downloadBtn').disabled = false;
            }
        }

        function displayResults(data) {
            const result = data.result;
            
            let videoInfoHTML = \`
                \${result.thumbnail ? \`<img src="\${result.thumbnail}" class="thumbnail">\` : ''}
                <div style="flex:1">
                    <h3>\${result.title || 'Untitled'}</h3>
                    <p>Duration: \${result.duration || 'Unknown'}</p>
                    <p>Platform: \${data.platform || 'Unknown'}</p>
                </div>
            \`;
            
            document.getElementById('videoInfo').innerHTML = videoInfoHTML;
            
            let linksHTML = '<h4>Download Links:</h4>';
            const urls = result.downloadUrls;
            
            if (Array.isArray(urls)) {
                urls.forEach(item => {
                    if (item.url) {
                        linksHTML += \`<a href="\${item.url}" class="download-btn" target="_blank">Download \${item.quality || ''}</a>\`;
                    }
                });
            } else if (typeof urls === 'object') {
                for (const [quality, url] of Object.entries(urls)) {
                    if (url) {
                        linksHTML += \`<a href="\${url}" class="download-btn" target="_blank">Download \${quality}</a>\`;
                    }
                }
            }
            
            document.getElementById('downloadLinks').innerHTML = linksHTML;
            document.getElementById('results').style.display = 'block';
        }

        function showError(msg) {
            document.getElementById('errorText').innerText = msg;
            document.getElementById('errorMessage').style.display = 'block';
        }
    </script>
</body>
</html>
`;

// ======================================================
// API ENDPOINTS
// ======================================================

// Serve HTML
app.get('/', (req, res) => {
  res.send(HTML_TEMPLATE);
});

// Download API
app.get('/api/download', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).json({ status: false, error: "URL required" });
  }
  const data = await RcDL.download(url);
  res.json({ 
    owner: OWNER_NAME,
    developer: DEVELOPER_NAME,
    creator: CREATOR_NAME,
    status: !data.error,
    ...data 
  });
});

// Status API
app.get('/api/status', (req, res) => {
  res.json({ 
    owner: OWNER_NAME,
    status: "online", 
    time: new Date().toISOString() 
  });
});

// ======================================================
// EXPORT FOR VERCEL
// ======================================================
module.exports = app;