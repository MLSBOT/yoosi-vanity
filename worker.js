// Cloudflare Worker - Yoosi Vanity admin backend
// Deploy: paste into Cloudflare Workers editor. Set secrets via dashboard.

const ALLOWED_ORIGINS = [
  'https://yoosivanity.dpdns.org',
  'http://localhost',
  'http://127.0.0.1',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.some(o => origin === o || origin.startsWith(o + ':'));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'null',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

function json(body, status = 200, origin = '') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function hmacSign(secret, data) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

async function hmacVerify(secret, data, sig) {
  const expected = await hmacSign(secret, data);
  return constantTimeEqual(expected, sig);
}

function base64UrlEncode(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function makeToken(secret, payload) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const sig = await hmacSign(secret, header + '.' + body);
  const sigUrl = sig.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return header + '.' + body + '.' + sigUrl;
}

async function verifyToken(secret, token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, b, s] = parts;
  const sigInput = h + '.' + b;
  const sigB64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = sigB64.length % 4 === 0 ? '' : '='.repeat(4 - (sigB64.length % 4));
  const sig = sigB64 + pad;
  const ok = await hmacVerify(secret, sigInput, sig);
  if (!ok) return null;
  let payload;
  try {
    payload = JSON.parse(atob(b.replace(/-/g, '+').replace(/_/g, '/')));
  } catch { return null; }
  if (payload.exp && Date.now() / 1000 > payload.exp) return null;
  return payload;
}

async function githubRequest(env, method, path, body) {
  const res = await fetch(`https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'yoosi-vanity-worker',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    const allowed = ALLOWED_ORIGINS.some(o => origin === o || origin.startsWith(o + ':'));
    if (!allowed && origin !== '') {
      return new Response('Forbidden origin', { status: 403 });
    }

    // POST /login
    if (url.pathname === '/login' && request.method === 'POST') {
      let body;
      try { body = await request.json(); } catch { return json({ error: 'Bad JSON' }, 400, origin); }
      const pwd = body.password || '';
      const delay = (ms) => new Promise(r => setTimeout(r, ms));

      // constant-time compare
      const ok = constantTimeEqual(pwd, env.ADMIN_PASSWORD || '');
      if (!ok) {
        await delay(1500);
        return json({ error: 'Credenciales inválidas' }, 401, origin);
      }
      const now = Math.floor(Date.now() / 1000);
      const token = await makeToken(env.JWT_SECRET, { sub: 'admin', iat: now, exp: now + 7200 });
      return json({ token, expiresIn: 7200 }, 200, origin);
    }

    // Auth helper
    async function requireAuth() {
      const auth = request.headers.get('Authorization') || '';
      const m = auth.match(/^Bearer (.+)$/);
      if (!m) return null;
      return await verifyToken(env.JWT_SECRET, m[1]);
    }

    // POST /update-catalog
    if (url.pathname === '/update-catalog' && request.method === 'POST') {
      const payload = await requireAuth();
      if (!payload) return json({ error: 'Token inválido o expirado' }, 401, origin);

      let body;
      try { body = await request.json(); } catch { return json({ error: 'Bad JSON' }, 400, origin); }
      const arr = Array.isArray(body) ? body : (body.products || body.productos || []);
      if (!Array.isArray(arr)) return json({ error: 'Se espera un array de productos' }, 400, origin);
      body = arr;

      // sanitize
      const clean = body.map(p => ({
        id: Number(p.id),
        nombre: String(p.nombre || '').slice(0, 100),
        categoria: String(p.categoria || '').slice(0, 60),
        precio: Number(p.precio) || 0,
        stock: Math.max(0, parseInt(p.stock, 10) || 0),
        descripcion: String(p.descripcion || '').slice(0, 500),
        imagen: String(p.imagen || '').slice(0, 300),
        enlacePago: String(p.enlacePago || '').slice(0, 300),
      }));

      // get current sha
      const getRes = await githubRequest(env, 'GET', 'productos.json');
      let sha = null;
      if (getRes.ok) {
        const data = await getRes.json();
        sha = data.sha;
      }

      const content = btoa(unescape(encodeURIComponent(JSON.stringify(clean, null, 2))));
      const putBody = {
        message: 'chore: update catalog via admin panel',
        content,
        ...(sha ? { sha } : {}),
      };
      const putRes = await githubRequest(env, 'PUT', 'productos.json', putBody);
      if (!putRes.ok) {
        const err = await putRes.text();
        return json({ error: 'Error al guardar en GitHub', detail: err }, 500, origin);
      }
      return json({ ok: true, message: 'Catálogo actualizado. Los cambios aparecerán en 30-60 segundos.' }, 200, origin);
    }

    // POST /upload-image
    if (url.pathname === '/upload-image' && request.method === 'POST') {
      const payload = await requireAuth();
      if (!payload) return json({ error: 'Token inválido o expirado' }, 401, origin);

      let body;
      try { body = await request.json(); } catch { return json({ error: 'Bad JSON' }, 400, origin); }
      const name = (body.filename || 'image.png').replace(/[^a-zA-Z0-9._-]/g, '');
      const content = body.content; // base64
      if (!content) return json({ error: 'Falta contenido' }, 400, origin);

      const path = `assets/img/${name}`;
      const getRes = await githubRequest(env, 'GET', path);
      let sha = null;
      if (getRes.ok) { const d = await getRes.json(); sha = d.sha; }

      const putBody = {
        message: `chore: upload image ${name}`,
        content,
        ...(sha ? { sha } : {}),
      };
      const putRes = await githubRequest(env, 'PUT', path, putBody);
      if (!putRes.ok) {
        const err = await putRes.text();
        return json({ error: 'Error al subir imagen', detail: err }, 500, origin);
      }
      return json({ ok: true, path }, 200, origin);
    }

    return json({ error: 'Not found' }, 404, origin);
  },
};