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

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function shareHTML(o) {
  var site = '每日枣报';
  var desc = o.desc || '每天十条要闻，附枣评。独立、克制、有态度。';
  var body = '';
  if (o.lead) body += '<p class="lead">' + esc(o.lead) + '</p>';
  if (o.quote) body += '<blockquote>' + esc(o.quote) + '</blockquote>';
  if (o.extra) body += '<p class="extra">' + esc(o.extra) + '</p>';
  body += '<a class="cta" href="' + esc(o.back) + '">阅读全文 →</a>';
  return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>' + esc(o.title) + ' · ' + site + '</title>' +
    '<meta name="description" content="' + esc(desc) + '">' +
    '<meta property="og:type" content="article">' +
    '<meta property="og:site_name" content="' + site + '">' +
    '<meta property="og:title" content="' + esc(o.title) + ' · ' + site + '">' +
    '<meta property="og:description" content="' + esc(desc) + '">' +
    '<meta property="og:image" content="' + esc(o.image) + '">' +
    '<meta property="og:url" content="' + esc(o.canonical) + '">' +
    '<meta name="twitter:card" content="summary_large_image">' +
    '<meta name="twitter:title" content="' + esc(o.title) + ' · ' + site + '">' +
    '<meta name="twitter:description" content="' + esc(desc) + '">' +
    '<meta name="twitter:image" content="' + esc(o.image) + '">' +
    '<link rel="icon" type="image/svg+xml" href="/assets/zao.svg">' +
    '<style>' +
    '*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;background:#faf7f2;color:#2a2520}' +
    '.hero{background:linear-gradient(135deg,#7a1a16,#b33028);color:#fff;padding:38px 24px 34px;text-align:center}' +
    '.mark{display:inline-flex;align-items:center;gap:8px;font-size:13px;letter-spacing:2px;opacity:.85;margin-bottom:18px}' +
    '.mark i{width:22px;height:22px;border-radius:50%;background:#fff;color:#b33028;font-style:normal;display:inline-flex;align-items:center;justify-content:center;font-family:serif;font-weight:700}' +
    'h1{font-family:Georgia,"Songti SC","SimSun",serif;font-size:30px;line-height:1.35;margin:0 auto;max-width:680px;font-weight:600}' +
    '.date{margin-top:14px;font-size:13px;opacity:.8;letter-spacing:1px}' +
    'main{max-width:680px;margin:0 auto;padding:30px 24px 60px}' +
    '.lead{font-size:17px;line-height:1.8;color:#4a423a;margin:0 0 18px}' +
    'blockquote{margin:0 0 20px;padding:18px 20px;background:#fff;border-left:4px solid #b33028;border-radius:0 10px 10px 0;font-family:Georgia,"Songti SC",serif;font-size:22px;line-height:1.6;color:#8f201b;box-shadow:0 2px 12px rgba(120,40,30,.06)}' +
    '.extra{font-size:15px;line-height:1.85;color:#4a423a;margin:0 0 28px}' +
    '.cta{display:inline-block;background:#b33028;color:#fff;text-decoration:none;padding:12px 28px;border-radius:999px;font-size:15px}' +
    '.cta:hover{background:#8f201b}' +
    '@media(max-width:480px){h1{font-size:25px}blockquote{font-size:20px}}' +
    '</style></head><body>' +
    '<div class="hero"><div class="mark"><i>枣</i> ZAOBAO DAILY</div>' +
    '<h1>' + esc(o.title) + '</h1><div class="date">' + esc(o.date) + (o.no ? ' · 第 ' + o.no + ' 条' : '') + '</div></div>' +
    '<main>' + body + '</main></body></html>';
}

async function handleShare(req, env, url) {
  var date = (url.searchParams.get('date') || '').slice(0, 10);
  var no = parseInt(url.searchParams.get('no') || '0', 10) || 0;
  if (!validDate(date)) return new Response('bad date', { status: 400 });

  var assetReq = new Request(new URL('/posts/' + date + '.json', url.origin).toString());
  var res = await env.ASSETS.fetch(assetReq);
  if (!res.ok) return new Response('not found', { status: 404 });
  var issue;
  try { issue = await res.json(); } catch (e) { return new Response('bad json', { status: 500 }); }

  var item = no > 0 && issue.items && issue.items[no - 1] ? issue.items[no - 1] : null;
  var origin = url.origin;
  var image = origin + '/assets/cover.png';
  var back = origin + '/#/' + date;
  var title, desc, extra = '';
  if (item) {
    title = item.title || ('每日枣报 · ' + date);
    desc = item.quote || (item.facts || '').slice(0, 110) || ('每日枣报 · ' + date);
    if (item.facts) extra = item.facts;
    back = origin + '/#/' + date;
  } else {
    title = issue.subtitle || ('每日枣报 · ' + date);
    desc = issue.lead || (issue.goldenQuotes && issue.goldenQuotes[0]) || ('每日枣报 · ' + date);
  }
  var canonical = origin + '/s?date=' + date + (no ? '&no=' + no : '');
  var html = shareHTML({
    title: title, desc: desc, quote: item ? (item.quote || '') : (issue.goldenQuotes && issue.goldenQuotes[0]) || '',
    lead: item ? '' : (issue.lead || ''), extra: extra, date: date, no: no,
    image: image, canonical: canonical, back: back
  });
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=300' }
  });
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

    if (path === '/s') {
      return handleShare(request, env, url).catch(function (e) {
        return new Response(String(e && e.message || e), { status: 500 });
      });
    }

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
