// Service Worker to handle dynamic routing
const CACHE_NAME = 'qlink4u-v1';
const SUPABASE_URL = 'https://vnmdlqgibiemwgfduzvv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZubWRscWdpYmllbXdnZmR1enZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NDczMjYsImV4cCI6MjA3NjQyMzMyNn0.wxkjuFMQ6T2oSSDtFrSt5BMay1TRqmVzSeFVosvHRKk';

// Known system routes that should not be treated as aliases
const SYSTEM_ROUTES = [
  '/',
  '/dashboard',
  '/dashboard.html',
  '/profile',
  '/profile.html',
  '/settings',
  '/settings.html',
  '/analytics',
  '/auth',
  '/login',
  '/register',
  '/demo.html',
  '/masking-demo.html',
  '/github.html',
  '/youtube.html',
  '/go.html'
];

// File extensions that should be served normally
const FILE_EXTENSIONS = ['.html', '.js', '.css', '.json', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'];

// Debug logging
console.log('Service Worker: SYSTEM_ROUTES =', SYSTEM_ROUTES);

self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only handle GET requests to our domain
  if (event.request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }
  
  const pathname = url.pathname;
  console.log('Service Worker: Processing request for', pathname);
  
  // Skip system routes
  if (SYSTEM_ROUTES.includes(pathname)) {
    console.log('Service Worker: Skipping system route', pathname);
    return;
  }
  
  // Skip files with extensions
  if (FILE_EXTENSIONS.some(ext => pathname.includes(ext))) {
    console.log('Service Worker: Skipping file with extension', pathname);
    return;
  }
  
  // Skip paths that start with special prefixes
  if (pathname.startsWith('/_') ||
      pathname.startsWith('/src') ||
      pathname.startsWith('/node_modules') ||
      pathname.startsWith('/assets') ||
      pathname.startsWith('/@') ||
      pathname.includes('__')) {
    console.log('Service Worker: Skipping special path', pathname);
    return;
  }
  
  // Skip analytics routes (dynamic)
  if (pathname.startsWith('/analytics/')) {
    console.log('Service Worker: Skipping analytics route', pathname);
    return;
  }
  
  // Extract alias from pathname
  const alias = pathname.substring(1); // Remove leading slash
  
  // If it looks like an alias (single segment, no special chars), handle it
  if (alias && 
      alias.length > 0 && 
      !alias.includes('/') && 
      !alias.includes('.') &&
      alias.length <= 50 && // Reasonable alias length limit
      /^[a-zA-Z0-9_-]+$/.test(alias)) { // Only alphanumeric, underscore, dash
    console.log('Service Worker: Handling alias', alias);
    event.respondWith(handleAliasRequest(alias));
  } else {
    console.log('Service Worker: Not handling request', pathname);
  }
});

async function handleAliasRequest(alias) {
  try {
    // Check if alias exists in database
    const response = await fetch(`${SUPABASE_URL}/rest/v1/links_2025_10_23_12_04?alias=eq.${alias}&is_active=eq.true&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return create404Response();
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      return create404Response();
    }

    const link = data[0];

    // Check if link has expired
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return createErrorResponse('Link đã hết hạn');
    }

    // Check click limit
    if (link.max_clicks && link.current_clicks >= link.max_clicks) {
      return createErrorResponse('Link đã đạt giới hạn số lần truy cập');
    }

    // If password protected, show password form
    if (link.password_hash) {
      return createPasswordResponse(alias);
    }

    // Record click
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/clicks_2025_10_23_12_04`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          link_id: link.id,
          ip_address: '127.0.0.1',
          user_agent: 'ServiceWorker',
          device_type: 'unknown',
          browser: 'unknown',
          os: 'unknown'
        })
      });
    } catch (error) {
      console.error('Error recording click:', error);
    }

    // Handle redirect based on link type
    if (link.link_type === 'masking') {
      return createMaskingResponse(link.destination_url, alias);
    } else {
      return createRedirectResponse(link.destination_url);
    }

  } catch (error) {
    console.error('Error handling alias request:', error);
    return createErrorResponse('Đã xảy ra lỗi khi xử lý link');
  }
}

function createRedirectResponse(destinationUrl) {
  return Response.redirect(destinationUrl, 301);
}

function createMaskingResponse(destinationUrl, alias) {
  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QLink4u.com/${alias}</title>
        <style>
            body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; font-family: Arial, sans-serif; }
            iframe { width: 100%; height: 100%; border: none; }
            .loading { display: flex; align-items: center; justify-content: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; flex-direction: column; }
            .spinner { border: 3px solid rgba(255, 255, 255, 0.3); border-top: 3px solid white; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin-bottom: 1rem; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            .error-message { display: none; align-items: center; justify-content: center; height: 100vh; background: #f5f5f5; color: #666; text-align: center; flex-direction: column; }
            .btn { display: inline-block; padding: 0.5rem 1rem; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 1rem; }
        </style>
    </head>
    <body>
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <div>Đang tải nội dung...</div>
        </div>
        
        <div class="error-message" id="error">
            <div>
                <h2>Không thể tải nội dung</h2>
                <p>Trang web có thể chặn việc hiển thị trong iframe.</p>
                <a href="${destinationUrl}" target="_blank" class="btn">Mở trực tiếp</a>
                <a href="/" class="btn">Quay về trang chủ</a>
            </div>
        </div>
        
        <iframe 
            src="${destinationUrl}" 
            onload="document.getElementById('loading').style.display='none'"
            onerror="document.getElementById('loading').style.display='none'; document.getElementById('error').style.display='flex'"
        ></iframe>

        <script>
            setTimeout(() => {
                const loading = document.getElementById('loading');
                if (loading.style.display !== 'none') {
                    loading.style.display = 'none';
                    document.getElementById('error').style.display = 'flex';
                }
            }, 5000);
        </script>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

function createPasswordResponse(alias) {
  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QLink4u.com/${alias} - Bảo vệ</title>
        <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
            .container { text-align: center; padding: 2rem; background: rgba(255, 255, 255, 0.1); border-radius: 10px; backdrop-filter: blur(10px); max-width: 400px; }
            .password-input { padding: 0.5rem; border: none; border-radius: 5px; margin-right: 0.5rem; background: rgba(255, 255, 255, 0.9); color: #333; width: 200px; }
            .btn { display: inline-block; padding: 0.5rem 1rem; background: rgba(255, 255, 255, 0.2); color: white; text-decoration: none; border-radius: 5px; margin: 0.5rem; border: 1px solid rgba(255, 255, 255, 0.3); cursor: pointer; }
            .btn:hover { background: rgba(255, 255, 255, 0.3); }
            .error { color: #ff6b6b; margin-top: 1rem; }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>🔒 Link được bảo vệ</h2>
            <p>Link <strong>qlink4u.com/${alias}</strong> yêu cầu mật khẩu để truy cập</p>
            <div>
                <input type="password" id="password" class="password-input" placeholder="Nhập mật khẩu">
                <button onclick="submitPassword()" class="btn">Truy cập</button>
            </div>
            <div id="error" class="error" style="display: none;"></div>
            <div>
                <a href="/" class="btn">Quay về trang chủ</a>
            </div>
        </div>

        <script>
            function submitPassword() {
                const password = document.getElementById('password').value;
                if (!password) {
                    showError('Vui lòng nhập mật khẩu');
                    return;
                }
                
                // Redirect with password parameter
                window.location.href = '/${alias}?password=' + encodeURIComponent(password);
            }
            
            function showError(message) {
                const errorDiv = document.getElementById('error');
                errorDiv.textContent = message;
                errorDiv.style.display = 'block';
            }
            
            document.getElementById('password').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    submitPassword();
                }
            });
        </script>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

function createErrorResponse(message) {
  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QLink4u.com - Lỗi</title>
        <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%); color: white; }
            .container { text-align: center; padding: 2rem; background: rgba(255, 255, 255, 0.1); border-radius: 10px; backdrop-filter: blur(10px); }
            .btn { display: inline-block; padding: 0.5rem 1rem; background: rgba(255, 255, 255, 0.2); color: white; text-decoration: none; border-radius: 5px; margin-top: 1rem; border: 1px solid rgba(255, 255, 255, 0.3); }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>⚠️ Lỗi</h2>
            <p>${message}</p>
            <a href="/" class="btn">Quay về trang chủ</a>
        </div>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

function create404Response() {
  const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QLink4u.com - Không tìm thấy</title>
        <style>
            body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
            .container { text-align: center; padding: 2rem; background: rgba(255, 255, 255, 0.1); border-radius: 10px; backdrop-filter: blur(10px); }
            .btn { display: inline-block; padding: 0.5rem 1rem; background: rgba(255, 255, 255, 0.2); color: white; text-decoration: none; border-radius: 5px; margin: 0.5rem; border: 1px solid rgba(255, 255, 255, 0.3); }
        </style>
    </head>
    <body>
        <div class="container">
            <h2>🔍 Link không tồn tại</h2>
            <p>Link này không tồn tại hoặc đã bị vô hiệu hóa.</p>
            <div>
                <a href="/" class="btn">Tạo link mới</a>
                <a href="/dashboard" class="btn">Dashboard</a>
            </div>
        </div>
    </body>
    </html>
  `;

  return new Response(html, {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}