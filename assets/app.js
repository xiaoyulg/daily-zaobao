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

  function bumpViews(date) {
    var key = 'zaobao:views:' + date;
    var n = parseInt(storeGet(key, '0'), 10);
    if (isNaN(n) || n < 0) n = 0;
    n += 1;
    storeSet(key, String(n));
    return n;
  }

  function getComments(date) {
    var raw = storeGet('zaobao:comments:' + date, '[]');
    try {
      var list = JSON.parse(raw);
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }

  function saveComments(date, list) {
    storeSet('zaobao:comments:' + date, JSON.stringify(list.slice(-200)));
  }

  function renderCommentList(date) {
    var list = getComments(date);
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

  function renderIssue(issue, index, views) {
    var date = issue.date;
    var i = index.indexOf(date);
    var newer = i >= 0 ? index[i - 1] : null;
    var older = i >= 0 ? index[i + 1] : null;
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
    html += '<a href="#/archive">往期归档</a>';
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
        it.tags.forEach(function (t) { html += '<span class="tag">' + esc(t) + '</span>'; });
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
      if (it.sources && it.sources.length) {
        html += '<div class="sources"><b>来源</b> ' + esc(it.sources.join(' · ')) + '</div>';
      }
      html += '</div></section>';
    });

    if (issue.goldenQuotes && issue.goldenQuotes.length) {
      html += '<section class="golden"><h2>本期金句</h2><ol>';
      issue.goldenQuotes.forEach(function (q) { html += '<li>' + esc(q) + '</li>'; });
      html += '</ol></section>';
    }

    html += '<section class="comments" id="comments">';
    html += '<h2>留言</h2>';
    html += '<p class="comments-tip">留言保存在本机浏览器，换设备看不到。想说点什么，就写在这儿。</p>';
    html += '<form class="comment-form" data-date="' + esc(date) + '">';
    html += '<input type="text" name="name" maxlength="20" placeholder="你的称呼（选填，默认匿名读者）">';
    html += '<textarea name="text" maxlength="500" placeholder="说点什么…" required></textarea>';
    html += '<button type="submit">发表留言</button>';
    html += '</form>';
    html += '<div class="comment-list-wrap">' + renderCommentList(date) + '</div>';
    html += '</section>';

    html += '</article>';
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
        var views = bumpViews(date);
        document.title = (issue.title || issue.subtitle || ('每日枣报 · ' + date)) + ' · 每日枣报';
        app.innerHTML = renderIssue(issue, index.map(function (x) { return x.date; }), views);
      })
      .catch(function (e) {
        showError(e);
      });
  }

  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form.classList || !form.classList.contains('comment-form')) return;
    e.preventDefault();
    var date = form.getAttribute('data-date');
    var name = (form.elements.name.value || '').trim().slice(0, 20) || '匿名读者';
    var text = (form.elements.text.value || '').trim().slice(0, 500);
    if (!text) return;
    var now = new Date();
    var stamp = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) +
      ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());
    var list = getComments(date);
    list.push({ name: name, text: text, time: stamp });
    saveComments(date, list);
    form.elements.text.value = '';
    var wrap = document.querySelector('.comment-list-wrap');
    if (wrap) wrap.innerHTML = renderCommentList(date);
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
