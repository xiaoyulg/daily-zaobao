// 每日枣报后端：浏览量、留言、管理后台。静态资源由 ASSETS binding 提供。

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: Object.assign(
      { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      headers || {}
    )
  });
}

async function sha256(text) {
  var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(function (b) {
    return b.toString(16).padStart(2, '0');
  }).join('');
}

function getCookie(req, name) {
  var raw = req.headers.get('Cookie') || '';
  var parts = raw.split(';');
  for (var i = 0; i < parts.length; i++) {
    var seg = parts[i].trim();
    var eq = seg.indexOf('=');
    if (eq > 0 && seg.slice(0, eq) === name) return seg.slice(eq + 1);
  }
  return null;
}

function beijingStamp() {
  var d = new Date(Date.now() + 8 * 3600 * 1000);
  return d.toISOString().slice(0, 16).replace('T', ' ');
}

function validDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s || '');
}

async function handleViews(req, env, url) {
  var kv = env.ZAOBAO_KV;
  if (!kv) return json({ count: 0, degraded: true });
  var date = (url.searchParams.get('date') || '').slice(0, 10);
  if (!validDate(date)) return json({ error: 'bad date' }, 400);

  var vid = getCookie(req, 'zb_vid');
  var setCookie = '';
  if (!vid) {
    vid = crypto.randomUUID();
    setCookie = 'zb_vid=' + vid + '; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax';
  }

  var seenKey = 'view:' + date + ':' + vid;
  var seen = await kv.get(seenKey);
  var count = parseInt(await kv.get('viewcount:' + date) || '0', 10) || 0;
  if (!seen) {
    count += 1;
    await kv.put(seenKey, '1', { expirationTtl: 172800 });
    await kv.put('viewcount:' + date, String(count));
  }
  return json({ count: count }, 200, setCookie ? { 'Set-Cookie': setCookie } : {});
}

async function handleComments(req, env, url) {
  var kv = env.ZAOBAO_KV;
  if (!kv) return json({ list: [], degraded: true });
  var date = (url.searchParams.get('date') || (req.method === 'POST' ? null : '') || '').slice(0, 10);
  if (!validDate(date)) {
    try {
      var b0 = await req.json();
      date = String(b0.date || '').slice(0, 10);
    } catch (e) {}
  }
  if (!validDate(date)) return json({ error: 'bad date' }, 400);

  var key = 'comments:' + date;
  if (req.method === 'GET') {
    var raw = await kv.get(key) || '[]';
    var list = [];
    try { list = JSON.parse(raw); } catch (e) {}
    return json({ list: Array.isArray(list) ? list : [] });
  }
  if (req.method === 'POST') {
    var body = await req.json().catch(function () { return {}; });
    var name = String(body.name || '').trim().slice(0, 20) || '匿名读者';
    var text = String(body.text || '').trim().slice(0, 500);
    if (!text) return json({ error: 'empty' }, 400);
    var raw2 = await kv.get(key) || '[]';
    var cur = [];
    try { cur = JSON.parse(raw2); } catch (e) {}
    if (!Array.isArray(cur)) cur = [];
    cur.push({ id: crypto.randomUUID(), name: name, text: text, time: beijingStamp() });
    if (cur.length > 300) cur = cur.slice(-300);
    await kv.put(key, JSON.stringify(cur));
    return json({ ok: true, list: cur });
  }
  return json({ error: 'method not allowed' }, 405);
}

async function adminAuthed(req, kv) {
  var expected = await kv.get('admin:token');
  if (!expected) return false;
  var t = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
  return t === expected;
}

async function listPrefix(kv, prefix) {
  var out = [];
  var cursor = null;
  do {
    var res = await kv.list({ prefix: prefix, cursor: cursor || undefined });
    for (var i = 0; i < res.keys.length; i++) out.push(res.keys[i].name);
    cursor = res.list_complete ? null : res.cursor;
  } while (cursor);
  return out;
}

async function handleAdmin(req, env, url) {
  var kv = env.ZAOBAO_KV;
  if (!kv) return json({ error: 'storage unavailable' }, 503);
  var path = url.pathname;

  if (path === '/api/admin/status' && req.method === 'GET') {
    return json({ setup: !!(await kv.get('admin:salt')) });
  }

  if (path === '/api/admin/setup' && req.method === 'POST') {
    if (await kv.get('admin:salt')) return json({ error: 'already setup' }, 409);
    var b1 = await req.json().catch(function () { return {}; });
    var pw = String(b1.password || '');
    if (pw.length < 4) return json({ error: 'too short' }, 400);
    var salt = crypto.randomUUID();
    await kv.put('admin:salt', salt);
    await kv.put('admin:hash', await sha256(salt + pw));
    return json({ ok: true });
  }

  if (path === '/api/admin/login' && req.method === 'POST') {
    var salt2 = await kv.get('admin:salt');
    var hash = await kv.get('admin:hash');
    if (!salt2 || !hash) return json({ error: 'not setup' }, 400);
    var b2 = await req.json().catch(function () { return {}; });
    if (await sha256(salt2 + String(b2.password || '')) !== hash) {
      return json({ error: 'wrong password' }, 401);
    }
    var token = crypto.randomUUID();
    await kv.put('admin:token', token, { expirationTtl: 43200 });
    return json({ token: token });
  }

  if (!(await adminAuthed(req, kv))) return json({ error: 'unauthorized' }, 401);

  if (path === '/api/admin/data' && req.method === 'GET') {
    var viewKeys = await listPrefix(kv, 'viewcount:');
    var views = [];
    for (var i = 0; i < viewKeys.length; i++) {
      views.push({ date: viewKeys[i].slice(10), count: parseInt(await kv.get(viewKeys[i]) || '0', 10) });
    }
    views.sort(function (a, b) { return b.date.localeCompare(a.date); });

    var cKeys = await listPrefix(kv, 'comments:');
    var comments = [];
    for (var j = 0; j < cKeys.length; j++) {
      var arr = [];
      try { arr = JSON.parse(await kv.get(cKeys[j]) || '[]'); } catch (e) {}
      if (arr.length) comments.push({ date: cKeys[j].slice(9), list: arr });
    }
    comments.sort(function (a, b) { return b.date.localeCompare(a.date); });
    return json({ views: views, comments: comments });
  }

  if (path === '/api/admin/delete' && req.method === 'POST') {
    var b3 = await req.json().catch(function () { return {}; });
    var d3 = String(b3.date || '').slice(0, 10);
    var id = String(b3.id || '');
    if (!validDate(d3) || !id) return json({ error: 'bad params' }, 400);
    var k3 = 'comments:' + d3;
    var cur3 = [];
    try { cur3 = JSON.parse(await kv.get(k3) || '[]'); } catch (e) {}
    cur3 = cur3.filter(function (c) { return c.id !== id; });
    await kv.put(k3, JSON.stringify(cur3));
    return json({ ok: true, list: cur3 });
  }

  return json({ error: 'not found' }, 404);
}

export default {
  async fetch(request, env, ctx) {
    var url = new URL(request.url);
    var path = url.pathname;

    if (path === '/api/health') return json({ ok: true, kv: !!env.ZAOBAO_KV });

    if (path === '/api/views' && request.method === 'GET') {
      return handleViews(request, env, url).catch(function (e) {
        return json({ error: String(e && e.message || e) }, 500);
      });
    }
    if (path === '/api/comments' && (request.method === 'GET' || request.method === 'POST')) {
      return handleComments(request, env, url).catch(function (e) {
        return json({ error: String(e && e.message || e) }, 500);
      });
    }
    if (path.indexOf('/api/admin/') === 0) {
      return handleAdmin(request, env, url).catch(function (e) {
        return json({ error: String(e && e.message || e) }, 500);
      });
    }
    if (path.indexOf('/api/') === 0) return json({ error: 'not found' }, 404);

    return env.ASSETS.fetch(request);
  }
};
