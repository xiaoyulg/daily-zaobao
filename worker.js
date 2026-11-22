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

// ============ 搜索引擎收录：服务端渲染的可索引静态页 ============
// 首页是 hash 路由 SPA，爬虫只能拿到空壳。这里为每一期生成一份带全文的静态 HTML，
// 放在 /p/YYYY-MM-DD，配 canonical / og / JSON-LD，供 Google、百度抓取。

function srcLink(s) {
  if (s && typeof s === 'object') {
    var name = esc(s.name || s.title || s.url || '来源');
    return s.url ? '<a href="' + esc(s.url) + '" rel="noopener noreferrer">' + name + '</a>' : name;
  }
  var nm = esc(String(s || '来源'));
  return '<a href="https://www.baidu.com/s?wd=' + encodeURIComponent(String(s || '')) + '" rel="noopener noreferrer">' + nm + '</a>';
}

function articleHTML(issue, date, origin) {
  var title = issue.subtitle || issue.title || ('每日枣报 · ' + date);
  var fullTitle = title + ' · 每日枣报';
  var desc = issue.lead || (issue.goldenQuotes && issue.goldenQuotes[0]) || ('每日枣报 ' + date + ' 十条要闻与枣评');
  var canonical = origin + '/p/' + date;
  var image = origin + '/assets/cover.png';

  var items = issue.items || [];
  var body = '';
  items.forEach(function (it, i) {
    body += '<article class="news-item"><h2>' + pad2(i + 1) + ' ' + esc(it.title || '') + '</h2>';
    if (it.facts) body += '<p class="facts">' + esc(it.facts) + '</p>';
    if (it.comment) body += '<p class="comment">' + esc(it.comment) + '</p>';
    if (it.quote) body += '<blockquote>' + esc(it.quote) + '</blockquote>';
    if (it.sources && it.sources.length) {
      body += '<p class="sources">来源：' + it.sources.map(srcLink).join(' · ') + '</p>';
    }
    body += '</article>';
  });
  if (issue.goldenQuotes && issue.goldenQuotes.length) {
    body += '<section class="golden"><h2>本期金句</h2><ol>';
    issue.goldenQuotes.forEach(function (q) { body += '<li>' + esc(q) + '</li>'; });
    body += '</ol></section>';
  }
  var quoteArr = (issue.goldenQuotes || []).slice(0, 5);
  var ld = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description: desc,
    datePublished: date,
    dateModified: date,
    image: image,
    author: { '@type': 'Organization', name: '每日枣报' },
    publisher: { '@type': 'Organization', name: '每日枣报', logo: { '@type': 'ImageObject', url: image } },
    mainEntityOfPage: canonical
  };

  return '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>' + esc(fullTitle) + '</title>' +
    '<meta name="description" content="' + esc(desc) + '">' +
    '<link rel="canonical" href="' + esc(canonical) + '">' +
    '<meta property="og:type" content="article">' +
    '<meta property="og:site_name" content="每日枣报">' +
    '<meta property="og:title" content="' + esc(fullTitle) + '">' +
    '<meta property="og:description" content="' + esc(desc) + '">' +
    '<meta property="og:image" content="' + esc(image) + '">' +
    '<meta property="og:url" content="' + esc(canonical) + '">' +
    '<meta name="twitter:card" content="summary_large_image">' +
    '<meta name="twitter:title" content="' + esc(fullTitle) + '">' +
    '<meta name="twitter:description" content="' + esc(desc) + '">' +
    '<meta name="twitter:image" content="' + esc(image) + '">' +
    '<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large">' +
    '<link rel="icon" type="image/svg+xml" href="/assets/zao.svg">' +
    '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' +
    '<style>' +
    '*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;background:#faf7f2;color:#2a2520;line-height:1.8}' +
    '.wrap{max-width:720px;margin:0 auto;padding:0 20px}' +
    'header{background:linear-gradient(135deg,#7a1a16,#b33028);color:#fff;padding:34px 20px 30px}' +
    'header .wrap{padding:0}.brand{font-size:13px;letter-spacing:2px;opacity:.85;text-decoration:none;color:#fff}' +
    'h1{font-family:Georgia,"Songti SC","SimSun",serif;font-size:28px;line-height:1.4;margin:14px 0 8px;font-weight:600}' +
    '.date{font-size:13px;opacity:.8;letter-spacing:1px}' +
    'main{padding:26px 20px 60px}.lead{font-size:16px;color:#5a5046;margin:0 0 26px}' +
    '.news-item{padding:20px 0;border-bottom:1px solid #e8e0d5}.news-item h2{font-size:19px;line-height:1.5;margin:0 0 12px;color:#7a1a16}' +
    '.facts{font-size:15px;color:#3a342d;margin:0 0 10px}.comment{font-size:15px;color:#5a5046;margin:0 0 10px;padding-left:12px;border-left:3px solid #d9a9a4}' +
    'blockquote{margin:0 0 10px;padding:12px 16px;background:#fff;border-radius:8px;font-family:Georgia,"Songti SC",serif;font-size:17px;color:#8f201b}' +
    '.sources{font-size:12px;color:#8a8075}.sources a{color:#b33028;text-decoration:none}' +
    '.golden{margin-top:30px;padding:20px;background:#fff;border-radius:12px}.golden h2{font-size:17px;color:#7a1a16;margin:0 0 10px}.golden ol{padding-left:22px;margin:0;color:#4a423a}.golden li{margin:6px 0}' +
    '.back{display:inline-block;margin-top:30px;background:#b33028;color:#fff;text-decoration:none;padding:11px 24px;border-radius:999px;font-size:14px}' +
    'footer{text-align:center;color:#9a9085;font-size:12px;padding:24px 20px 40px}' +
    '@media(max-width:480px){h1{font-size:23px}.news-item h2{font-size:17px}}' +
    '</style></head><body>' +
    '<header><div class="wrap"><a class="brand" href="' + esc(origin + '/') + '">枣 ZAOBAO DAILY · 每日枣报</a>' +
    '<h1>' + esc(title) + '</h1><div class="date">' + esc(date) + ' · 每天十条要闻，附枣评</div></div></header>' +
    '<main class="wrap">' + (issue.lead ? '<p class="lead">' + esc(issue.lead) + '</p>' : '') + body +
    '<a class="back" href="' + esc(origin + '/#/' + date) + '">在枣报 site 查看互动版与留言 →</a></main>' +
    '<footer>每日枣报 · 独立 · 克制 · 有态度</footer></body></html>';
}

function pad2(n) { return n < 10 ? '0' + n : '' + n; }

async function handleArticle(env, url) {
  var date = (url.pathname.replace(/^\/p\//, '').replace(/\.html$/, '') || '').slice(0, 10);
  if (!validDate(date)) return new Response('bad date', { status: 400 });
  var assetReq = new Request(new URL('/posts/' + date + '.json', url.origin).toString());
  var res = await env.ASSETS.fetch(assetReq);
  if (!res.ok) return new Response('not found', { status: 404 });
  var issue;
  try { issue = await res.json(); } catch (e) { return new Response('bad json', { status: 500 }); }
  return new Response(articleHTML(issue, date, url.origin), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=600' }
  });
}

async function handleSitemap(env, url) {
  var assetReq = new Request(new URL('/posts/index.json', url.origin).toString());
  var res = await env.ASSETS.fetch(assetReq);
  var issues = [];
  if (res.ok) {
    try { issues = (await res.json()).issues || []; } catch (e) {}
  }
  var origin = url.origin;
  var urls = [{ loc: origin + '/', pri: '1.0' }];
  issues.forEach(function (x) {
    if (validDate(x.date)) urls.push({ loc: origin + '/p/' + x.date, pri: '0.9' });
  });
  urls.push({ loc: origin + '/manifesto.html', pri: '0.5' });
  var xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
  urls.forEach(function (u) {
    xml += '<url><loc>' + esc(u.loc) + '</loc><priority>' + u.pri + '</priority></url>';
  });
  xml += '</urlset>';
  return new Response(xml, {
    status: 200,
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
  });
}

function handleRobots(url) {
  var txt = 'User-agent: *\nAllow: /\nSitemap: ' + url.origin + '/sitemap.xml\n';
  return new Response(txt, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' }
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

// 红心点赞：每人每期一次，KV 计数 + cookie 去重，可切换（再点取消）
async function handleLikes(req, env, url) {
  var kv = env.ZAOBAO_KV;
  if (!kv) return json({ count: 0, liked: false, degraded: true });
  var date = (url.searchParams.get('date') || '').slice(0, 10);
  if (!validDate(date)) return json({ error: 'bad date' }, 400);

  var vid = getCookie(req, 'zb_vid');
  var setCookie = '';
  if (!vid) {
    vid = crypto.randomUUID();
    setCookie = 'zb_vid=' + vid + '; Path=/; Max-Age=31536000; HttpOnly; SameSite=Lax';
  }

  var likedKey = 'like:' + date + ':' + vid;
  var countKey = 'likecount:' + date;
  var count = parseInt(await kv.get(countKey) || '0', 10) || 0;
  var liked = !!(await kv.get(likedKey));

  if (req.method === 'POST') {
    var body = await req.json().catch(function () { return {}; });
    var want = body && (body.like === true || body.like === 'true');
    if (want && !liked) {
      liked = true;
      count += 1;
      await kv.put(likedKey, '1', { expirationTtl: 31536000 });
      await kv.put(countKey, String(count));
    } else if (!want && liked) {
      liked = false;
      count = count > 0 ? count - 1 : 0;
      await kv.delete(likedKey);
      await kv.put(countKey, String(count));
    }
  }

  return json({ count: count, liked: liked }, 200, setCookie ? { 'Set-Cookie': setCookie } : {});
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

// ============ 邮件订阅：邮箱存 KV，供每日 9:00 投递任务读取 ============
var SUB_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
var SUB_LIST_KEY = '292930e38c35c1833331977875421058'; // 仅用于读取订阅列表的内部密钥

async function handleSubscribe(req, env, url) {
  var kv = env.ZAOBAO_KV;
  if (!kv) return json({ ok: false, error: '存储暂不可用' }, 503);
  var ip = req.headers.get('CF-Connecting-IP') || req.headers.get('X-Forwarded-For') || 'unknown';
  var path = url.pathname;

  // 内部：读取全部订阅者（需密钥），供定时投递任务使用
  if (path === '/api/subscribers' && req.method === 'GET') {
    var key = req.headers.get('X-Sub-Key') || url.searchParams.get('key') || '';
    if (key !== SUB_LIST_KEY) return json({ error: 'unauthorized' }, 401);
    var keys = await listPrefix(kv, 'sub:');
    var list = [];
    for (var k = 0; k < keys.length; k++) {
      var raw = await kv.get(keys[k]);
      if (!raw) continue;
      try {
        var rec = JSON.parse(raw);
        if (rec && rec.email) list.push({ email: rec.email, ts: rec.ts || '' });
      } catch (e) {}
    }
    list.sort(function (a, b) { return (a.ts || '').localeCompare(b.ts || ''); });
    return json({ ok: true, count: list.length, subscribers: list });
  }

  // 查询某个邮箱是否已订阅
  if (req.method === 'GET') {
    var email0 = String(url.searchParams.get('email') || '').trim().toLowerCase();
    if (!SUB_EMAIL_RE.test(email0)) return json({ ok: true, subscribed: false });
    return json({ ok: true, subscribed: !!(await kv.get('sub:' + email0)) });
  }

  if (req.method === 'POST') {
    // 轻量限流：每 IP 每天最多 8 次订阅/退订操作，防止恶意刷 KV
    var day = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10);
    var rateKey = 'subrate:' + ip + ':' + day;
    var used = parseInt(await kv.get(rateKey) || '0', 10) || 0;
    if (used >= 8) return json({ ok: false, error: '操作太频繁，请明天再试' }, 429);

    var body = await req.json().catch(function () { return {}; });
    var email = String(body.email || '').trim().toLowerCase();
    if (!SUB_EMAIL_RE.test(email) || email.length > 120) {
      return json({ ok: false, error: '请填写有效的邮箱地址' }, 400);
    }
    var unsub = body.action === 'unsub' || body.unsubscribe === true;
    if (unsub) {
      await kv.delete('sub:' + email);
      await kv.put(rateKey, String(used + 1), { expirationTtl: 86401 });
      return json({ ok: true, subscribed: false, message: '已退订，以后不会再收到枣报。' });
    }
    var existed = !!(await kv.get('sub:' + email));
    await kv.put('sub:' + email, JSON.stringify({ email: email, ts: beijingStamp() }));
    await kv.put(rateKey, String(used + 1), { expirationTtl: 86401 });
    return json({
      ok: true, subscribed: true,
      message: existed ? '你已订阅，每天上午 9:00 见。' : '订阅成功！每天上午 9:00 见。'
    });
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

    var likeKeys = await listPrefix(kv, 'likecount:');
    var likes = [];
    for (var m = 0; m < likeKeys.length; m++) {
      likes.push({ date: likeKeys[m].slice(10), count: parseInt(await kv.get(likeKeys[m]) || '0', 10) });
    }
    likes.sort(function (a, b) { return b.date.localeCompare(a.date); });

    var cKeys = await listPrefix(kv, 'comments:');
    var comments = [];
    for (var j = 0; j < cKeys.length; j++) {
      var arr = [];
      try { arr = JSON.parse(await kv.get(cKeys[j]) || '[]'); } catch (e) {}
      if (arr.length) comments.push({ date: cKeys[j].slice(9), list: arr });
    }
    comments.sort(function (a, b) { return b.date.localeCompare(a.date); });

    var subKeys = await listPrefix(kv, 'sub:');
    var subscribers = [];
    for (var s = 0; s < subKeys.length; s++) {
      var sraw = await kv.get(subKeys[s]);
      if (!sraw) continue;
      try {
        var sobj = JSON.parse(sraw);
        if (sobj && sobj.email) subscribers.push({ email: sobj.email, ts: sobj.ts || '' });
      } catch (e) {}
    }
    subscribers.sort(function (a, b) { return (b.ts || '').localeCompare(a.ts || ''); });
    return json({ views: views, likes: likes, comments: comments, subscribers: subscribers });
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

    // 搜索引擎收录：静态可索引文章页、站点地图、robots
    if (path === '/p' || path.indexOf('/p/') === 0) {
      return handleArticle(env, url).catch(function (e) {
        return new Response(String(e && e.message || e), { status: 500 });
      });
    }
    if (path === '/sitemap.xml') return handleSitemap(env, url);
    if (path === '/robots.txt') return handleRobots(url);

    // Google Search Console 域名所有权验证：直接返回，避免静态资源对 .html 后缀做 307 跳转
    if (path === '/google7f159c18a03528a5.html') {
      return new Response('google-site-verification: google7f159c18a03528a5.html', {
        headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=86400' }
      });
    }

    if (path === '/api/health') return json({ ok: true, kv: !!env.ZAOBAO_KV });

    // 邮件订阅
    if ((path === '/api/subscribe' && (request.method === 'GET' || request.method === 'POST')) ||
        (path === '/api/subscribers' && request.method === 'GET')) {
      return handleSubscribe(request, env, url).catch(function (e) {
        return json({ ok: false, error: String(e && e.message || e) }, 500);
      });
    }

    if (path === '/api/likes' && (request.method === 'GET' || request.method === 'POST')) {
      return handleLikes(request, env, url).catch(function (e) {
        return json({ error: String(e && e.message || e) }, 500);
      });
    }

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
