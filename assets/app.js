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

  function renderSources(sources) {
    if (!sources || !sources.length) return '';
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
    return '<div class="sources"><b>来源</b> ' + parts.join(' · ') + '</div>';
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
      html += renderSources(it.sources);
      if (window.ZaoShare) {
        html += ZaoShare.bar({ kind: 'item', date: date, no: n + 1, title: it.title || '', quote: it.quote || '' });
      }
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
    var map = {}, co = {};
    (all || []).forEach(function (issue) {
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
        });
        for (var i = 0; i < tags.length; i++) {
          for (var j = i + 1; j < tags.length; j++) {
            if (tags[i] === tags[j]) continue;
            var pair = [tags[i], tags[j]].sort().join('\u0001');
            co[pair] = (co[pair] || 0) + 1;
          }
        }
      });
    });
    return { map: map, co: co };
  }

  function renderTagNet(all) {
    var idx = buildTagIndex(all);
    var tags = Object.keys(idx.map).sort(function (a, b) {
      return idx.map[b].length - idx.map[a].length || a.localeCompare(b);
    });
    var itemCount = (all || []).reduce(function (n, x) { return n + (x.items || []).length; }, 0);
    var html = '<div class="archive-head"><h1>标签网</h1><p>共 ' + tags.length + ' 个标签 · ' + itemCount + ' 条新闻 · 点击标签看跨期聚合</p></div>';
    html += '<section class="tag-cloud">';
    tags.forEach(function (t) {
      html += '<a class="tag-cloud-item" href="#/tag/' + encodeURIComponent(t) + '">' + esc(t) + '<sup>' + idx.map[t].length + '</sup></a>';
    });
    html += '</section>';
    var pairs = Object.keys(idx.co).map(function (k) {
      var p = k.split('\u0001');
      return { a: p[0], b: p[1], n: idx.co[k] };
    }).sort(function (x, y) { return y.n - x.n; }).slice(0, 12);
    if (pairs.length) {
      html += '<section class="tag-links"><h2>标签共现 · 知识连线</h2><ul>';
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
          app.innerHTML = renderTagNet(all);
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
