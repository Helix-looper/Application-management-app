// @ts-check
const http = require('http');
const os = require('os');

const PORT = 3001;

// State in sync bridge
let sessionPin = Math.floor(1000 + Math.random() * 9000).toString();
let authToken = 'jp_' + Math.random().toString(36).substring(2, 12);
let desktopData = {
  version: 1,
  companies: [],
  applications: [],
  interviews: [],
  notes: [],
  status_history: [],
  reminders: [],
};
let lastSync = {
  timestamp: null,
  device: null,
  importedCount: 0,
  exportedCount: 0,
};

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(body);
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const url = req.url || '';

  // Status & discovery endpoint
  if (req.method === 'GET' && url.startsWith('/api/status')) {
    return sendJson(res, 200, {
      ok: true,
      service: 'JobPilot Desktop Sync Bridge',
      version: '1.0.0',
      ip: getLocalIp(),
      port: PORT,
      pin: sessionPin,
      lastSync,
    });
  }

  // Regenerate PIN
  if (req.method === 'POST' && url === '/api/refresh-pin') {
    sessionPin = Math.floor(1000 + Math.random() * 9000).toString();
    authToken = 'jp_' + Math.random().toString(36).substring(2, 12);
    return sendJson(res, 200, { ok: true, pin: sessionPin });
  }

  // Pair from Mobile
  if (req.method === 'POST' && url === '/api/pair') {
    try {
      const body = await parseJsonBody(req);
      if (body.pin === sessionPin) {
        return sendJson(res, 200, {
          ok: true,
          token: authToken,
          message: 'Paired successfully with JobPilot Desktop',
        });
      } else {
        return sendJson(res, 401, { ok: false, error: 'Invalid pairing PIN' });
      }
    } catch {
      return sendJson(res, 400, { ok: false, error: 'Malformed request body' });
    }
  }

  // Desktop pushes its IndexedDB state to the sync bridge
  if (req.method === 'POST' && url === '/api/desktop-data') {
    try {
      const body = await parseJsonBody(req);
      desktopData = {
        version: 1,
        companies: body.companies || [],
        applications: body.applications || [],
        interviews: body.interviews || [],
        notes: body.notes || [],
        status_history: body.status_history || [],
        reminders: body.reminders || [],
      };
      return sendJson(res, 200, {
        ok: true,
        applicationsCount: desktopData.applications.length,
        companiesCount: desktopData.companies.length,
      });
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: 'Invalid data payload' });
    }
  }

  // Read desktop data
  if (req.method === 'GET' && url === '/api/desktop-data') {
    return sendJson(res, 200, { ok: true, data: desktopData });
  }

  // Mobile Sync Endpoint (bidirectional)
  if (req.method === 'POST' && url === '/api/sync') {
    try {
      const auth = req.headers['authorization'];
      const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null;
      if (token !== authToken) {
        return sendJson(res, 403, { ok: false, error: 'Unauthorized. Please pair with the current PIN.' });
      }

      const mobilePayload = await parseJsonBody(req);
      const mobileApps = mobilePayload.applications || [];
      const mobileCompanies = mobilePayload.companies || [];

      // Merge mobile applications into desktop data buffer (if mobile has newer or unseen)
      const existingAppIds = new Set(desktopData.applications.map(a => a.id));
      let newFromMobile = 0;
      for (const mApp of mobileApps) {
        if (!existingAppIds.has(mApp.id)) {
          desktopData.applications.push(mApp);
          existingAppIds.add(mApp.id);
          newFromMobile++;
        }
      }

      // Merge companies
      const existingCompanyIds = new Set(desktopData.companies.map(c => c.id));
      for (const mCo of mobileCompanies) {
        if (!existingCompanyIds.has(mCo.id)) {
          desktopData.companies.push(mCo);
          existingCompanyIds.add(mCo.id);
        }
      }

      lastSync = {
        timestamp: new Date().toISOString(),
        device: mobilePayload.device || 'Android Device',
        importedCount: newFromMobile,
        exportedCount: desktopData.applications.length,
      };

      // Return complete merged dataset back to mobile
      return sendJson(res, 200, {
        ok: true,
        data: desktopData,
        syncedAt: lastSync.timestamp,
        newFromMobile,
      });
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: 'Sync processing failed: ' + String(e) });
    }
  }

  // 404 Fallback
  return sendJson(res, 404, { ok: false, error: 'Endpoint not found' });
});

server.listen(PORT, '0.0.0.0', () => {
  const ip = getLocalIp();
  console.log(`\n======================================================`);
  console.log(`  JobPilot Local Wi-Fi Sync Bridge is RUNNING`);
  console.log(`  Local Network URL : http://${ip}:${PORT}`);
  console.log(`  Pairing PIN       : ${sessionPin}`);
  console.log(`======================================================\n`);
});
