(function () {
  'use strict';

  var app = document.getElementById('app');

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function fmtDate(dateStr) {
    var parts = String(dateStr).split('-');
    if (parts.length !== 3) return String(dateStr);
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    var week = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d.getDay()];
    return parts[0] + ' 年 ' + (+parts[1]) + ' 月 ' + (+parts[2]) + ' 日 · ' + week;
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  var SOURCE_SITES = {
    '新华社': 'http://www.xinhuanet.com/', '新华网': 'http://www.xinhuanet.com/',
    '央视': 'https://news.cctv.com/', '央视新闻': 'https://news.cctv.com/',
    '人民日报': 'http://www.people.com.cn/', '人民网': 'http://www.people.com.cn/',
    '光明日报': 'https://www.gmw.cn/', '中青报': 'https://www.cyol.com/', '中国青年报': 'https://www.cyol.com/',
    '财新': 'https://www.caixin.com/', '新京报': 'https://www.bjnews.com.cn/',
    '南都': 'https://www.oeeee.com/', '南方都市报': 'https://www.oeeee.com/', '南方周末': 'https://www.infzm.com/',
    '澎湃': 'https://www.thepaper.cn/', '澎湃新闻': 'https://www.thepaper.cn/',
    '第一财经': 'https://www.yicai.com/', '一财': 'https://www.yicai.com/',
    'FT': 'https://www.ft.com/', '金融时报': 'https://www.ft.com/',
    'WSJ': 'https://www.wsj.com/', '华尔街日报': 'https://www.wsj.com/',
    'NYT': 'https://www.nytimes.com/', '纽约时报': 'https://www.nytimes.com/',
    '路透': 'https://www.reuters.com/', '路透社': 'https://www.reuters.com/',
    '彭博': 'https://www.bloomberg.com/', '彭博社': 'https://www.bloomberg.com/',
    '上海证券报': 'https://www.cnstock.com/', '证券时报': 'https://www.stcn.com/',
    '财联社': 'https://www.cls.cn/', '央视网': 'https://www.cctv.com/',
    '央视财经': 'https://tv.cctv.com/cctv2/', '新京报贝壳财经': 'https://www.bjnews.com.cn/',
    '工信部': 'https://www.miit.gov.cn/', '国家数据局': 'https://www.nda.gov.cn/',
    '中国地震局': 'https://www.cea.gov.cn/', '中国工商银行': 'https://www.icbc.com.cn/',
    '12306': 'https://www.12306.cn/'
  };

  function sourceURL(name) {
    var s = String(name || '').replace(/[（(][^）)]*[）)]/g, '').trim();
    if (!s) return null;
    if (SOURCE_SITES[s]) return SOURCE_SITES[s];
    for (var k in SOURCE_SITES) {
      if (Object.prototype.hasOwnProperty.call(SOURCE_SITES, k) && s.indexOf(k) >= 0) return SOURCE_SITES[k];
    }
    return 'https://www.baidu.com/s?wd=' + encodeURIComponent(s);
  }

  function renderSources(sources, shareMini) {
    if ((!sources || !sources.length) && !shareMini) return '';
    var inner = '';
    if (sources && sources.length) {
      var parts = sources.map(function (s) {
        if (s && typeof s === 'object') {
          var label = esc(s.name || s.title || s.url || '来源');
          var u = s.url ? String(s.url) : null;
          return u
            ? '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer" title="阅读原文：' + label + '">' + label + '</a>'
            : '<span>' + label + '</span>';
        }
        var url = sourceURL(s);
        var text = esc(s);
        return url
          ? '<a href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" title="查看来源：' + text + '">' + text + '</a>'
          : '<span>' + text + '</span>';
      });
      inner = '<span class="sources-text"><b>来源</b> ' + parts.join(' · ') + '</span>';
    }
    if (shareMini) inner += shareMini;
    return '<div class="sources sources-row">' + inner + '</div>';
  }

  function loadJSON(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status + ' ' + url);
      return r.json();
    });
  }

  function storeGet(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v == null ? fallback : v;
    } catch (e) { return fallback; }
  }

  function storeSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* 隐私模式等场景下静默降级 */ }
  }

  function apiJSON(url, options) {
    return fetch(url, options).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function getViews(date) {
    return apiJSON('api/views?date=' + encodeURIComponent(date))
      .then(function (d) {
        if (typeof d.count === 'number' && !d.degraded) {
          storeSet('zaobao:views:' + date, String(d.count));
          return d.count;
        }
        throw new Error('degraded');
      })
      .catch(function () {
        var n = parseInt(storeGet('zaobao:views:' + date, '0'), 10);
        return isNaN(n) || n < 0 ? 0 : n;
      });
  }

  function getComments(date) {
    return apiJSON('api/comments?date=' + encodeURIComponent(date))
      .then(function (d) {
        if (d.degraded || !Array.isArray(d.list)) throw new Error('degraded');
        storeSet('zaobao:comments:' + date, JSON.stringify(d.list));
        return d.list;
      })
      .catch(function () {
        try {
          var l = JSON.parse(storeGet('zaobao:comments:' + date, '[]'));
          return Array.isArray(l) ? l : [];
        } catch (e) { return []; }
      });
  }

  function postComment(date, name, text) {
    return apiJSON('api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: date, name: name, text: text })
    }).then(function (d) { return Array.isArray(d.list) ? d.list : null; });
  }

  function renderCommentList(list) {
    if (!list.length) {
      return '<p class="comment-empty">还没有留言，来说两句。</p>';
    }
    var html = '<ul class="comment-list">';
    list.slice().reverse().forEach(function (c) {
      html += '<li>';
      html += '<div class="c-head"><span class="c-name">' + esc(c.name || '匿名读者') + '</span>' +
        '<time>' + esc(c.time || '') + '</time></div>';
      html += '<div class="c-text">' + esc(c.text) + '</div>';
      html += '</li>';
    });
    html += '</ul>';
    return html;
  }

  function renderIssue(issue, index, views, comments) {
    var date = issue.date;
    var dates = index.map(function (x) { return x.date || x; });
    var i = dates.indexOf(date);
    var newer = i >= 0 ? dates[i - 1] : null;
    var older = i >= 0 ? dates[i + 1] : null;
    var mainTitle = issue.title || issue.subtitle || ('每日枣报 · ' + date);

    var html = '<article class="issue">';
    html += '<div class="issue-head">';
    html += '<div class="issue-kicker">每 日 枣 报</div>';
    html += '<h1 class="issue-title">' + esc(mainTitle) + '</h1>';
    html += '<div class="issue-meta">';
    html += '<span class="issue-date">' + esc(fmtDate(date)) + '</span>';
    if (issue.issueNo) html += '<span class="issue-no">第 ' + esc(issue.issueNo) + ' 期</span>';
    html += '<span class="issue-views">阅读 <b>' + (views || 0) + '</b> 次</span>';
    html += '</div>';
    html += '<div class="issue-nav">';
    if (newer) html += '<a href="#/' + newer + '">← 更新一期</a>';
    html += '<button type="button" class="nav-jump" data-jump="past">往期 ↓</button>';
    html += '<a href="index.html#/tags">标签网</a>';
    html += '<a href="#/archive">全部归档</a>';
    if (older) html += '<a href="#/' + older + '">更早一期 →</a>';
    html += '</div></div>';

    if (issue.lead) html += '<div class="lead">' + esc(issue.lead) + '</div>';

    var items = issue.items || [];
    items.forEach(function (it, n) {
      var isLast = (n === items.length - 1);
      html += '<section class="item' + (isLast ? ' item-light' : '') + '">';
      html += '<div class="item-head"><span class="item-no">' + pad(n + 1) + '</span>';
      html += '<h2 class="item-title">' + esc(it.title) + '</h2></div>';
      if (it.tags && it.tags.length) {
        html += '<div class="item-meta">';
        it.tags.forEach(function (t) {
          html += '<a class="tag" href="#/tag/' + encodeURIComponent(t) + '" title="查看「' + esc(t) + '」跨期聚合">' + esc(t) + '</a>';
        });
        html += '</div>';
      }
      html += '<div class="item-body">';
      if (it.facts) html += '<p class="facts">' + esc(it.facts) + '</p>';
      if (it.comment) {
        html += '<div class="comment"><span class="comment-label">' + (isLast ? '轻松收尾' : '枣 评 · 吐槽') + '</span>';
        html += '<div>' + esc(it.comment) + '</div>';
        if (it.quote) html += '<div class="quote">' + esc(it.quote) + '</div>';
        html += '</div>';
      }
      var itemShare = window.ZaoShare
        ? ZaoShare.miniBar({ kind: 'item', date: date, no: n + 1, title: it.title || '', quote: it.quote || '' })
        : '';
      html += renderSources(it.sources, itemShare);
      html += '</div></section>';
    });

    var edu = issue.education;
    if (edu && ((edu.items && edu.items.length) || edu.analysis)) {
      html += '<section class="education">';
      html += '<h2>' + esc(edu.title || '教育观察 · 中外要闻') + '</h2>';
      var eduItems = edu.items || [];
      eduItems.forEach(function (it) {
        html += '<div class="edu-item">';
        html += '<div class="edu-head"><span class="edu-region">' + esc(it.region || '资讯') + '</span>';
        html += '<span class="edu-title">' + esc(it.headline || it.title || '') + '</span></div>';
        if (it.facts) html += '<p class="edu-facts">' + esc(it.facts) + '</p>';
        html += renderSources(it.sources);
        html += '</div>';
      });
      if (edu.analysis) {
        html += '<div class="edu-analysis"><span class="comment-label">汇 总 点 评</span>';
        html += '<div>' + esc(edu.analysis) + '</div>';
        if (edu.quote) html += '<div class="quote">' + esc(edu.quote) + '</div>';
        html += '</div>';
      }
      html += '</section>';
    }

    if (issue.goldenQuotes && issue.goldenQuotes.length) {
      html += '<section class="golden"><h2>本期金句</h2><ol>';
      issue.goldenQuotes.forEach(function (q) { html += '<li>' + esc(q) + '</li>'; });
      html += '</ol></section>';
    }

    if (window.ZaoShare) {
      html += '<section class="issue-share">';
      html += ZaoShare.bar({ kind: 'issue', date: date, title: mainTitle, quote: (issue.goldenQuotes && issue.goldenQuotes[0]) || '' });
      html += '</section>';
    }

    html += '<section class="past-issues" id="past-issues">';
    html += '<h2>往期</h2>';
    html += '<ul class="past-list">';
    // 创刊词固定在第一行
    html += '<li class="manifesto-entry"><a href="manifesto.html">';
    html += '<span class="a-title">重逢二十年前的那份美好</span>';
    html += '<span class="a-date">创刊词</span>';
    html += '</a></li>';
    // 其余往期按时间倒序，最多 4 期（连同创刊词共 5 行）；只留标题，标题后附日期
    var past = (index || []).filter(function (x) {
      var d = x.date || x;
      return d && d < date;
    }).slice(0, 4);
    past.forEach(function (it) {
      var d = it.date || it;
      var t = it.subtitle || (it.summary ? String(it.summary).split(/[。！？]/)[0] : '') ||
              (it.title ? String(it.title).replace(/每日枣报\s*·\s*\d{4}-\d{2}-\d{2}/, '').trim() : '') ||
              ('每日枣报 · ' + d);
      html += '<li><a href="#/' + esc(d) + '">';
      html += '<span class="a-title">' + esc(t) + '</span>';
      html += '<span class="a-date">' + esc(d) + '</span>';
      html += '</a></li>';
    });
    html += '</ul></section>';

    html += '<section class="comments" id="comments">';
    html += '<h2>留言</h2>';
    html += '<p class="comments-tip">留言保存在云端，所有设备都能看到。想说点什么，就写在这儿。</p>';
    html += '<form class="comment-form" data-date="' + esc(date) + '">';
    html += '<input type="text" name="name" maxlength="20" placeholder="你的称呼（选填，默认匿名读者）">';
    html += '<textarea name="text" maxlength="500" placeholder="说点什么…" required></textarea>';
    html += '<button type="submit">发表留言</button>';
    html += '</form>';
    html += '<div class="comment-list-wrap">' + renderCommentList(comments) + '</div>';
    html += '</section>';

    html += '</article>';
    return html;
  }

  var allIssuesCache = null;

  function getAllIssues(manifest) {
    var key = manifest.updatedAt || '';
    if (allIssuesCache && allIssuesCache.key === key) return Promise.resolve(allIssuesCache.list);
    try {
      var raw = sessionStorage.getItem('zaobao:all:' + key);
      if (raw) {
        var cached = JSON.parse(raw);
        allIssuesCache = { key: key, list: cached };
        return Promise.resolve(cached);
      }
    } catch (e) {}

    var dates = (manifest.issues || []).map(function (x) { return x.date; });
    var out = [];
    var cursor = 0;
    function next() {
      if (cursor >= dates.length) return Promise.resolve();
      var d = dates[cursor++];
      return loadJSON('posts/' + encodeURIComponent(d) + '.json')
        .then(function (j) { out.push(j); })
        .catch(function () {})
        .then(next);
    }
    var lanes = [];
    for (var i = 0; i < Math.min(6, dates.length); i++) lanes.push(next());
    return Promise.all(lanes).then(function () {
      out.sort(function (a, b) { return String(b.date || '').localeCompare(String(a.date || '')); });
      allIssuesCache = { key: key, list: out };
      try { sessionStorage.setItem('zaobao:all:' + key, JSON.stringify(out)); } catch (e) {}
      return out;
    });
  }

  function buildTagIndex(all) {
    var map = {}, co = {}, coIssue = {};
    (all || []).forEach(function (issue) {
      var issueTags = {};
      (issue.items || []).forEach(function (it) {
        var tags = (it.tags || []).filter(Boolean);
        var rec = {
          date: issue.date, title: it.title || '', facts: it.facts || '',
          comment: it.comment || '', quote: it.quote || '',
          tags: tags, sources: it.sources || []
        };
        tags.forEach(function (t) {
          if (!map[t]) map[t] = [];
          map[t].push(rec);
          issueTags[t] = 1;
        });
        for (var i = 0; i < tags.length; i++) {
          for (var j = i + 1; j < tags.length; j++) {
            if (tags[i] === tags[j]) continue;
            var pair = [tags[i], tags[j]].sort().join('\u0001');
            co[pair] = (co[pair] || 0) + 1;
          }
        }
      });
      // 期级关联：同一期出现过的标签之间建立弱连接，让单期也能串成议题网
      var within = Object.keys(issueTags);
      for (var a = 0; a < within.length; a++) {
        for (var b = a + 1; b < within.length; b++) {
          var p = [within[a], within[b]].sort().join('\u0001');
          coIssue[p] = (coIssue[p] || 0) + 1;
        }
      }
    });
    return { map: map, co: co, coIssue: coIssue };
  }

  // ---------- 标签知识图谱：原生 Canvas 力导向，无外部依赖 ----------
  var GRAPH_PALETTE = ['#9c2b25', '#2f6f8f', '#6b7f34', '#8a5a9c', '#b8772a',
    '#3f7d70', '#a34a6b', '#4f6b9c', '#7a6a4f', '#5b7fa8'];

  function graphColor(group) {
    return GRAPH_PALETTE[((group % GRAPH_PALETTE.length) + GRAPH_PALETTE.length) % GRAPH_PALETTE.length];
  }

  function buildGraphData(idx) {
    var nodes = Object.keys(idx.map).map(function (id) {
      return { id: id, label: id, count: idx.map[id].length,
        x: 0, y: 0, vx: 0, vy: 0, r: 0, group: 0, deg: 0 };
    });
    var byId = {};
    nodes.forEach(function (n, i) { byId[n.id] = n; n.group = i; });
    var links = [], strongKeys = {};
    Object.keys(idx.co).forEach(function (k) {
      var p = k.split('\u0001');
      var a = byId[p[0]], b = byId[p[1]];
      if (!a || !b) return;
      links.push({ a: a, b: b, n: idx.co[k], weak: false });
      strongKeys[k] = 1;
      a.deg += idx.co[k];
      b.deg += idx.co[k];
    });

    // 期级弱关联：每个节点只保留最强的几组，避免退化成完全图
    var weakAll = Object.keys(idx.coIssue || {}).map(function (k) {
      var p = k.split('\u0001');
      return { a: byId[p[0]], b: byId[p[1]], n: idx.coIssue[k] };
    }).filter(function (l) { return l.a && l.b; });
    var perNode = {};
    weakAll.forEach(function (l) {
      if (perNode[l.a.id]) perNode[l.a.id].push(l); else perNode[l.a.id] = [l];
      if (perNode[l.b.id]) perNode[l.b.id].push(l); else perNode[l.b.id] = [l];
    });
    var chosen = {};
    Object.keys(perNode).forEach(function (id) {
      perNode[id].sort(function (x, y) { return y.n - x.n || x.a.id.localeCompare(y.a.id); })
        .slice(0, 3)
        .forEach(function (l) {
          var k = [l.a.id, l.b.id].sort().join('\u0001');
          if (!strongKeys[k]) chosen[k] = l;
        });
    });
    Object.keys(chosen).forEach(function (k) {
      var l = chosen[k];
      links.push({ a: l.a, b: l.b, n: l.n, weak: true });
    });

    // 轻量标签传播：只用强边做社区聚类，弱边不参与，避免大量期级关联把整图染成一色
    for (var round = 0; round < 8; round++) {
      var changed = false;
      nodes.forEach(function (n) {
        var score = {};
        score[n.group] = 0.6;
        links.forEach(function (l) {
          if (l.weak) return;
          var other = l.a === n ? l.b : (l.b === n ? l.a : null);
          if (other) score[other.group] = (score[other.group] || 0) + l.n;
        });
        var best = n.group, bestScore = score[best] || 0;
        Object.keys(score).forEach(function (g) {
          if (score[g] > bestScore) { bestScore = score[g]; best = parseInt(g, 10); }
        });
        if (best !== n.group) { n.group = best; changed = true; }
      });
      if (!changed) break;
    }

    var adj = {};
    nodes.forEach(function (n) { adj[n.id] = {}; });
    links.forEach(function (l) {
      adj[l.a.id][l.b.id] = l.n;
      adj[l.b.id][l.a.id] = l.n;
    });
    return { nodes: nodes, links: links, byId: byId, adj: adj };
  }

  function mountTagGraph(idx) {
    var canvas = document.getElementById('tag-graph');
    if (!canvas || !canvas.getContext) return;
    var stage = document.getElementById('graph-stage');
    var tip = document.getElementById('graph-tip');
    var ctx = canvas.getContext('2d');
    var data = buildGraphData(idx);
    var dpr = window.devicePixelRatio || 1;
    var W = 0, H = 0, scale = 1, tx = 0, ty = 0;
    var alpha = 0, raf = null;
    var hover = null, dragNode = null, panning = false, lastPointer = null;
    var gestureMoved = false, downAt = null;
    var minLink = 1, showWeak = true;
    var maxNodes = 90;

    // 长周期归档后限制节点数，保证移动端仍然流畅
    if (data.nodes.length > maxNodes) {
      var keep = data.nodes.slice().sort(function (a, b) {
        return b.count - a.count || a.id.localeCompare(b.id);
      }).slice(0, maxNodes);
      var keepIds = {};
      keep.forEach(function (n) { keepIds[n.id] = 1; });
      data.nodes = keep;
      data.links = data.links.filter(function (l) { return keepIds[l.a.id] && keepIds[l.b.id]; });
      var kept = {};
      keep.forEach(function (n) { kept[n.id] = {}; });
      data.links.forEach(function (l) { kept[l.a.id][l.b.id] = l.n; kept[l.b.id][l.a.id] = l.n; });
      data.adj = kept;
    }

    function resize() {
      var rect = canvas.getBoundingClientRect();
      W = Math.max(320, rect.width);
      H = Math.max(280, rect.height);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      var R = Math.min(W, H) * 0.34;
      data.nodes.forEach(function (n, i) {
        if (!n.x && !n.y) {
          var ang = (i / Math.max(1, data.nodes.length)) * Math.PI * 2;
          var wobble = 0.72 + 0.28 * Math.abs(Math.sin(i * 7.13));
          n.x = Math.cos(ang) * R * wobble;
          n.y = Math.sin(ang) * R * wobble;
        }
        n.r = 4.5 + Math.sqrt(n.count) * 2.8;
      });
      draw();
    }

    function isNeighbor(a, b) {
      return !!(a && b && data.adj[a.id] && data.adj[a.id][b.id]);
    }

    function draw() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.translate(W / 2 + tx, H / 2 + ty);
      ctx.scale(scale, scale);

      data.links.forEach(function (l) {
        if (l.weak ? !showWeak : l.n < minLink) return;
        var active = hover && (l.a === hover || l.b === hover);
        ctx.strokeStyle = active ? 'rgba(156,43,37,0.66)'
          : (l.weak ? 'rgba(110,105,95,0.10)' : 'rgba(110,105,95,0.20)');
        ctx.lineWidth = active ? 1.8 : (l.weak ? 0.6 : Math.min(3, 0.5 + l.n * 0.6));
        ctx.beginPath();
        ctx.moveTo(l.a.x, l.a.y);
        ctx.lineTo(l.b.x, l.b.y);
        ctx.stroke();
      });

      data.nodes.forEach(function (n) {
        var dim = hover && n !== hover && !isNeighbor(n, hover);
        ctx.globalAlpha = dim ? 0.2 : 1;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = graphColor(n.group);
        ctx.fill();
        ctx.lineWidth = n === hover ? 2.5 : 1.2;
        ctx.strokeStyle = 'rgba(255,255,255,0.92)';
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      ctx.font = '12px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      data.nodes.forEach(function (n) {
        if (hover && n !== hover && !isNeighbor(n, hover) && n.count < 3) return;
        ctx.fillStyle = n === hover ? '#1c1a17' : '#4a463f';
        ctx.fillText(n.label, n.x, n.y + n.r + 11);
      });
      ctx.restore();
    }

    function tick() {
      if (alpha < 0.006 && !dragNode) { raf = null; return; }
      var nodes = data.nodes;
      var k = Math.sqrt((W * H) / Math.max(1, nodes.length)) * 0.5;
      for (var i = 0; i < nodes.length; i++) {
        for (var j = i + 1; j < nodes.length; j++) {
          var dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y;
          var d2 = dx * dx + dy * dy || 1;
          var d = Math.sqrt(d2);
          var f = (k * k) / d2 * alpha;
          var fx = dx / d * f, fy = dy / d * f;
          nodes[i].vx -= fx; nodes[i].vy -= fy;
          nodes[j].vx += fx; nodes[j].vy += fy;
        }
      }
      data.links.forEach(function (l) {
        if (l.weak ? !showWeak : l.n < minLink) return;
        var dx = l.b.x - l.a.x, dy = l.b.y - l.a.y;
        var d = Math.sqrt(dx * dx + dy * dy) || 1;
        var rest = l.weak ? k * 2.6 : k * (1.75 - Math.min(0.85, l.n * 0.2));
        var f = (d - rest) * (l.weak ? 0.006 : 0.04) * alpha;
        var fx = dx / d * f, fy = dy / d * f;
        l.a.vx += fx; l.a.vy += fy;
        l.b.vx -= fx; l.b.vy -= fy;
      });
      nodes.forEach(function (n) {
        if (n === dragNode) { n.vx = n.vy = 0; return; }
        n.vx -= n.x * 0.0022 * alpha;
        n.vy -= n.y * 0.0022 * alpha;
        n.vx *= 0.86; n.vy *= 0.86;
        n.x += Math.max(-14, Math.min(14, n.vx));
        n.y += Math.max(-14, Math.min(14, n.vy));
        // 把节点约束在画布内，避免标签被推到边缘与操作提示重叠
        var limX = Math.max(60, W / 2 - 46);
        var limY = Math.max(52, H / 2 - 62);
        n.x = Math.max(-limX, Math.min(limX, n.x));
        n.y = Math.max(-limY, Math.min(limY, n.y));
      });
      alpha *= 0.983;
      draw();
      raf = requestAnimationFrame(tick);
    }

    function reheat(v) {
      alpha = Math.max(alpha, v || 0.3);
      if (raf === null) raf = requestAnimationFrame(tick);
    }

    function point(ev) {
      var r = canvas.getBoundingClientRect();
      var src = ev.touches && ev.touches.length ? ev.touches[0] : ev;
      return {
        x: (src.clientX - r.left - W / 2 - tx) / scale,
        y: (src.clientY - r.top - H / 2 - ty) / scale,
        sx: src.clientX - r.left,
        sy: src.clientY - r.top
      };
    }

    function hit(p) {
      for (var i = data.nodes.length - 1; i >= 0; i--) {
        var n = data.nodes[i];
        var dx = p.x - n.x, dy = p.y - n.y;
        if (dx * dx + dy * dy <= (n.r + 7) * (n.r + 7)) return n;
      }
      return null;
    }

    // 线段与矩形相交的重叠长度（Liang-Barsky 裁剪），0 表示不相交
    function segRectOverlap(x1, y1, x2, y2, rx, ry, rw, rh) {
      var dx = x2 - x1, dy = y2 - y1;
      var p = [-dx, dx, -dy, dy];
      var q = [x1 - rx, rx + rw - x1, y1 - ry, ry + rh - y1];
      var t0 = 0, t1 = 1;
      for (var i = 0; i < 4; i++) {
        if (p[i] === 0) {
          if (q[i] < 0) return 0;
        } else {
          var r = q[i] / p[i];
          if (p[i] < 0) {
            if (r > t1) return 0;
            if (r > t0) t0 = r;
          } else {
            if (r < t0) return 0;
            if (r < t1) t1 = r;
          }
        }
      }
      return t1 > t0 ? Math.sqrt(dx * dx + dy * dy) * (t1 - t0) : 0;
    }

    // 围绕节点试 8 个方位，选遮挡可见连线最少的位置；结果只依赖节点，悬停时不会跳动
    function pickTipPos(n) {
      var tw = tip.offsetWidth || 200;
      var th = tip.offsetHeight || 84;
      var nx = W / 2 + tx + n.x * scale;
      var ny = H / 2 + ty + n.y * scale;
      var segs = [];
      data.links.forEach(function (l) {
        if (l.weak ? !showWeak : l.n < minLink) return;
        var involves = (l.a === n || l.b === n);
        segs.push({
          x1: W / 2 + tx + l.a.x * scale, y1: H / 2 + ty + l.a.y * scale,
          x2: W / 2 + tx + l.b.x * scale, y2: H / 2 + ty + l.b.y * scale,
          w: involves ? 1 : 0.25
        });
      });
      var dirs = [[1, 0], [-1, 0], [0, -1], [0, 1],
        [0.72, -0.72], [0.72, 0.72], [-0.72, -0.72], [-0.72, 0.72]];
      var gap = 14, relR = n.r * scale + gap;
      var best = null;
      dirs.forEach(function (d, idx) {
        var dx = d[0] > 0 ? relR * d[0] : (d[0] < 0 ? -tw - relR * -d[0] : -tw / 2);
        var dy = d[1] > 0 ? relR * d[1] : (d[1] < 0 ? -th - relR * -d[1] : -th / 2);
        var left = Math.max(6, Math.min(W - tw - 6, nx + dx));
        var top = Math.max(6, Math.min(H - th - 6, ny + dy));
        var cost = idx * 1.5; // 遮挡相近时偏好右侧，符合阅读习惯
        segs.forEach(function (s) {
          cost += segRectOverlap(s.x1, s.y1, s.x2, s.y2, left, top, tw, th) * s.w;
        });
        if (!best || cost < best.cost) best = { cost: cost, left: left, top: top };
      });
      return best;
    }

    function showTip(n, p) {
      if (!tip) return;
      if (!n) { tip.hidden = true; return; }
      var near = Object.keys(data.adj[n.id] || {}).sort(function (a, b) {
        return data.adj[n.id][b] - data.adj[n.id][a];
      }).slice(0, 3).map(function (t) { return esc(t); }).join('、');
      tip.innerHTML = '<b>' + esc(n.label) + '</b><span>出现 ' + n.count + ' 次 · 关联 ' +
        Object.keys(data.adj[n.id] || {}).length + ' 个标签</span>' +
        (near ? '<em>强关联：' + near + '</em>' : '');
      tip.hidden = false;
      var pos = pickTipPos(n);
      tip.style.left = pos.left + 'px';
      tip.style.top = pos.top + 'px';
    }

    function onMove(ev) {
      var p = point(ev);
      if (downAt && (Math.abs(p.sx - downAt.x) > 5 || Math.abs(p.sy - downAt.y) > 5)) {
        gestureMoved = true;
      }
      if (dragNode) {
        dragNode.x = p.x; dragNode.y = p.y;
        dragNode.vx = dragNode.vy = 0;
        reheat(0.12); draw();
        return;
      }
      if (panning && lastPointer) {
        tx += p.sx - lastPointer.x;
        ty += p.sy - lastPointer.y;
        lastPointer = { x: p.sx, y: p.sy };
        draw();
        return;
      }
      var n = hit(p);
      if (n !== hover) {
        hover = n;
        canvas.style.cursor = n ? 'pointer' : 'grab';
        draw();
      }
      showTip(n, p);
    }

    function startGesture(ev) {
      var p = point(ev);
      downAt = { x: p.sx, y: p.sy };
      gestureMoved = false;
      dragNode = hit(p);
      if (!dragNode) { panning = true; lastPointer = { x: p.sx, y: p.sy }; }
    }

    function endGesture() {
      dragNode = null; panning = false; lastPointer = null; downAt = null;
      canvas.style.cursor = hover ? 'pointer' : 'grab';
      reheat(0.16);
    }

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', function () {
      hover = null; showTip(null); draw();
    });
    canvas.addEventListener('mousedown', startGesture);
    window.addEventListener('mouseup', endGesture);
    canvas.addEventListener('click', function (ev) {
      if (gestureMoved) return;
      var n = hit(point(ev));
      if (n) location.hash = '#/tag/' + encodeURIComponent(n.id);
    });
    canvas.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      var p = point(ev);
      var next = Math.max(0.55, Math.min(2.4, scale * (ev.deltaY > 0 ? 0.9 : 1.1)));
      tx = p.sx - W / 2 - (p.x * next);
      ty = p.sy - H / 2 - (p.y * next);
      scale = next;
      draw();
    }, { passive: false });
    canvas.addEventListener('touchstart', function (ev) {
      startGesture(ev);
      ev.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchmove', function (ev) {
      onMove(ev);
      ev.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchend', function () {
      if (hover && !gestureMoved) location.hash = '#/tag/' + encodeURIComponent(hover.id);
      hover = null; showTip(null);
      endGesture(); draw();
    });

    var controls = document.getElementById('graph-controls');
    if (controls) {
      controls.addEventListener('change', function (ev) {
        if (ev.target && ev.target.id === 'graph-minlink') {
          minLink = parseInt(ev.target.value, 10) || 1;
          reheat(0.45);
        } else if (ev.target && ev.target.id === 'graph-weak') {
          showWeak = !!ev.target.checked;
          reheat(0.45);
        }
      });
      controls.addEventListener('click', function (ev) {
        var btn = ev.target && ev.target.closest ? ev.target.closest('[data-graph-action]') : null;
        if (!btn || btn.getAttribute('data-graph-action') !== 'reset') return;
        scale = 1; tx = 0; ty = 0; minLink = 1; showWeak = true;
        var sel = document.getElementById('graph-minlink');
        if (sel) sel.value = '1';
        var wk = document.getElementById('graph-weak');
        if (wk) wk.checked = true;
        data.nodes.forEach(function (n) { n.vx = n.vy = 0; });
        reheat(0.8);
      });
    }

    if (window.ResizeObserver && stage) {
      new ResizeObserver(resize).observe(stage);
    } else {
      window.addEventListener('resize', resize);
    }
    resize();
    reheat(1);
  }

  function renderTagNet(all, idx) {
    idx = idx || buildTagIndex(all);
    var tags = Object.keys(idx.map).sort(function (a, b) {
      return idx.map[b].length - idx.map[a].length || a.localeCompare(b);
    });
    var itemCount = (all || []).reduce(function (n, x) { return n + (x.items || []).length; }, 0);
    var html = '<div class="archive-head"><h1>标签网</h1><p>共 ' + tags.length + ' 个标签 · ' +
      itemCount + ' 条新闻 · ' + Object.keys(idx.co).length + ' 组条内共现 · ' +
      Object.keys(idx.coIssue || {}).length + ' 组期级关联</p></div>';

    html += '<section class="graph-card">' +
      '<div class="graph-head"><div><h2>知识图谱</h2>' +
      '<p>节点是标签；粗线＝同一条新闻里共现，细线＝同一期里共同出现；同色代表强关联主题簇。鼠标悬停看邻域，点击节点看跨期聚合。</p></div>' +
      '<div class="graph-tools" id="graph-controls">' +
      '<label class="graph-check"><input type="checkbox" id="graph-weak" checked> 期级关联</label>' +
      '<label>最少共现 <select id="graph-minlink" aria-label="最少共现次数">' +
      '<option value="1">1 次</option><option value="2">2 次</option><option value="3">3 次</option>' +
      '</select></label><button type="button" data-graph-action="reset">重置视图</button></div></div>' +
      '<div class="graph-stage" id="graph-stage">' +
      '<canvas id="tag-graph" role="img" aria-label="标签共现关系图谱，可点击节点查看该标签的跨期聚合">' +
      '你的浏览器不支持 Canvas，请查看下方的共现列表。</canvas>' +
      '<div class="graph-tip" id="graph-tip" hidden></div>' +
      '<div class="graph-hint">拖动节点 · 空白处平移 · 滚轮缩放 · 点击标签查看跨期聚合</div>' +
      '</div></section>';

    html += '<details class="tag-cloud-details" open><summary>按频次浏览（' + tags.length + '）</summary><section class="tag-cloud">';
    tags.forEach(function (t) {
      html += '<a class="tag-cloud-item" href="#/tag/' + encodeURIComponent(t) + '">' +
        esc(t) + '<sup>' + idx.map[t].length + '</sup></a>';
    });
    html += '</section></details>';

    var pairs = Object.keys(idx.co).map(function (k) {
      var p = k.split('\u0001');
      return { a: p[0], b: p[1], n: idx.co[k] };
    }).sort(function (x, y) { return y.n - x.n; }).slice(0, 12);
    if (pairs.length) {
      html += '<section class="tag-links"><h2>最强共现 · TOP 12</h2><ul>';
      pairs.forEach(function (p) {
        html += '<li><a href="#/tag/' + encodeURIComponent(p.a) + '">' + esc(p.a) + '</a><span> × </span>' +
          '<a href="#/tag/' + encodeURIComponent(p.b) + '">' + esc(p.b) + '</a><b>' + p.n + ' 条</b></li>';
      });
      html += '</ul></section>';
    }
    return html;
  }

  function renderTagPage(tag, all) {
    var idx = buildTagIndex(all);
    var list = (idx.map[tag] || []).slice();
    var dates = {};
    list.forEach(function (r) { dates[r.date] = 1; });
    var html = '<div class="archive-head"><h1>标签 · ' + esc(tag) + '</h1><p>' + list.length +
      ' 条新闻 · 横跨 ' + Object.keys(dates).length + ' 期</p></div>';
    html += '<p class="tag-back"><a href="index.html#/tags">← 返回标签网</a></p>';
    if (!list.length) return html + '<div class="empty">这个标签下暂时没有新闻。</div>';
    list.forEach(function (r) {
      html += '<section class="tag-result">';
      html += '<div class="tr-meta"><a href="#/' + esc(r.date) + '">' + esc(r.date) + '</a>';
      r.tags.forEach(function (t) {
        html += '<a class="tag" href="#/tag/' + encodeURIComponent(t) + '">' + esc(t) + '</a>';
      });
      html += '</div>';
      html += '<h2><a href="#/' + esc(r.date) + '">' + esc(r.title) + '</a></h2>';
      if (r.facts) html += '<p class="facts">' + esc(r.facts) + '</p>';
      if (r.comment) html += '<div class="comment"><div>' + esc(r.comment) + '</div></div>';
      if (r.quote) html += '<div class="quote">' + esc(r.quote) + '</div>';
      html += renderSources(r.sources);
      html += '</section>';
    });
    return html;
  }

  function renderArchive(manifest) {
    var issues = manifest.issues || [];
    var html = '<div class="archive-head"><h1>往期归档</h1><p>共 ' + issues.length + ' 期 · 按时间倒序</p></div>';
    if (!issues.length) return emptyState();
    html += '<ul class="archive-list">';
    issues.forEach(function (it) {
      html += '<li><a href="#/' + esc(it.date) + '">';
      html += '<span class="a-date">' + esc(it.date) + '</span>';
      html += '<span><span class="a-title">' + esc(it.title || '每日枣报') + '</span>';
      if (it.summary) html += '<span class="a-summary">' + esc(it.summary) + '</span>';
      html += '</span></a></li>';
    });
    html += '</ul>';
    return html;
  }

  function emptyState() {
    return '<div class="empty"><h2>首期还在准备中</h2><p>每天早上 8 点更新，稍后再来看看。</p></div>';
  }

  function showError(err) {
    app.innerHTML = '<div class="empty"><h2>加载失败</h2><p>' + esc(err.message || err) + '</p>' +
      '<p class="muted">请确认 posts/index.json 已随站点一起发布。</p></div>';
  }

  function route(manifest) {
    var hash = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    var index = manifest.issues || [];

    if (hash === 'archive') {
      document.title = '往期归档 · 每日枣报';
      app.innerHTML = renderArchive(manifest);
      return;
    }

    if (hash === 'tags' || hash.indexOf('tag/') === 0) {
      app.innerHTML = '<div class="loading">正在整理标签网…</div>';
      getAllIssues(manifest).then(function (all) {
        if (hash === 'tags') {
          document.title = '标签网 · 每日枣报';
          var tagIdx = buildTagIndex(all);
          app.innerHTML = renderTagNet(all, tagIdx);
          mountTagGraph(tagIdx);
        } else {
          var tag = hash.slice(4);
          document.title = '标签 ' + tag + ' · 每日枣报';
          app.innerHTML = renderTagPage(tag, all);
        }
      }).catch(showError);
      return;
    }

    var date = hash;
    if (!date) {
      if (!index.length) {
        document.title = '每日枣报';
        app.innerHTML = emptyState();
        return;
      }
      date = index[0].date;
      history.replaceState(null, '', '#/' + date);
    }

    loadJSON('posts/' + encodeURIComponent(date) + '.json')
      .then(function (issue) {
        return Promise.all([getViews(date), getComments(date)]).then(function (res) {
          document.title = (issue.title || issue.subtitle || ('每日枣报 · ' + date)) + ' · 每日枣报';
          app.innerHTML = renderIssue(issue, index, res[0], res[1]);
        });
      })
      .catch(function (e) {
        showError(e);
      });
  }

  document.addEventListener('click', function (e) {
    var target = e.target && e.target.closest ? e.target.closest('[data-jump="past"]') : null;
    if (!target) return;
    var section = document.getElementById('past-issues');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form.classList || !form.classList.contains('comment-form')) return;
    e.preventDefault();
    var date = form.getAttribute('data-date');
    var name = (form.elements.name.value || '').trim().slice(0, 20) || '匿名读者';
    var text = (form.elements.text.value || '').trim().slice(0, 500);
    if (!text) return;
    var btn = form.querySelector('button[type="submit"]');
    if (btn) { btn.disabled = true; btn.textContent = '发表中…'; }
    postComment(date, name, text)
      .then(function (list) {
        form.elements.text.value = '';
        var wrap = document.querySelector('.comment-list-wrap');
        if (wrap && list) wrap.innerHTML = renderCommentList(list);
      })
      .catch(function () {
        var now = new Date();
        var stamp = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
          ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
        var key = 'zaobao:comments:' + date;
        var local = [];
        try { local = JSON.parse(storeGet(key, '[]')) || []; } catch (err) { local = []; }
        local.push({ name: name, text: text, time: stamp });
        storeSet(key, JSON.stringify(local.slice(-200)));
        form.elements.text.value = '';
        var wrap = document.querySelector('.comment-list-wrap');
        if (wrap) wrap.innerHTML = renderCommentList(local);
      })
      .then(function () {
        if (btn) { btn.disabled = false; btn.textContent = '发表留言'; }
      });
  });

  loadJSON('posts/index.json')
    .then(function (manifest) {
      route(manifest);
      window.addEventListener('hashchange', function () { route(manifest); });
    })
    .catch(function (e) {
      showError(e);
    });
})();
