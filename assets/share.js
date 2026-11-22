(function () {
  'use strict';

  var ICON = {
    wechat: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.7 3C4.9 3 1.8 5.7 1.8 9.1c0 2 .9 3.8 2.4 5l-.6 1.9 2.1-1.1c.8.2 1.7.4 2.6.4h.5c-.1-.4-.1-.9-.1-1.4 0-3.6 3.2-6.5 7.2-6.5h.4C15.9 4.8 12.7 3 8.7 3zm-2.9 5.2a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5.8 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/><path d="M22.2 14.2c0-3-2.9-5.4-6.4-5.4s-6.4 2.4-6.4 5.4 2.9 5.4 6.4 5.4c.7 0 1.4-.1 2-.3l2 1-.6-1.8c1.8-1 3-2.7 3-4.3zm-8.6-1.6a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8zm4 0a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8z"/></svg>',
    moments: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.1"/><circle cx="12" cy="12" r="9" stroke-dasharray="2.2 2.6"/></svg>',
    weibo: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8.2c-4.5 0-8.2 2.8-8.2 6.1 0 3.4 3.7 6.1 8.2 6.1s8.2-2.7 8.2-6.1c0-3.3-3.7-6.1-8.2-6.1zm0 9.4c-2.9 0-5.3-1.5-5.3-3.4 0-1.8 2.4-3.3 5.3-3.3s5.3 1.5 5.3 3.3c0 1.9-2.4 3.4-5.3 3.4z"/><path d="M17.8 3.2c2.6.5 4.3 2.3 4.3 4.5 0 1.2-.5 2.3-1.4 3.1l-1.3-1.4c.6-.5.9-1.1.9-1.8 0-1.3-1.1-2.4-2.7-2.8l.2-1.6zM4.6 6.9C5.9 5.7 7.7 5 9.6 5l.1 1.7c-1.4.1-2.6.6-3.5 1.4L4.6 6.9z"/><circle cx="12" cy="14.2" r="1.7"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L5.9 22H2.8l7.3-8.4L2 2h6.5l4.4 5.8L18.9 2zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 2H3.6C2.7 2 2 2.7 2 3.6v16.8c0 .9.7 1.6 1.6 1.6h16.8c.9 0 1.6-.7 1.6-1.6V3.6c0-.9-.7-1.6-1.6-1.6zM8 18.5H5V9.4h3v9.1zM6.5 8.1a1.7 1.7 0 1 1 0-3.5 1.7 1.7 0 0 1 0 3.5zm12 10.4h-3v-4.5c0-1.1 0-2.5-1.5-2.5s-1.8 1.2-1.8 2.4v4.6H9.2V9.4h2.9v1.2h.1c.4-.8 1.4-1.6 2.9-1.6 3.1 0 3.7 2 3.7 4.6v5z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M9.5 14.5l5-5"/><path d="M11.5 6.8l1.2-1.2a3.8 3.8 0 0 1 5.4 5.4l-1.2 1.2"/><path d="M12.5 17.2l-1.2 1.2a3.8 3.8 0 0 1-5.4-5.4l1.2-1.2"/></svg>',
    system: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.3 10.8l7.4-4.3M8.3 13.2l7.4 4.3"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.9"/><circle cx="12" cy="12" r="1.9"/><circle cx="19" cy="12" r="1.9"/></svg>'
  };

  var PLAT = {
    weibo: function (u, t) { return 'https://service.weibo.com/share/share.php?url=' + encodeURIComponent(u) + '&title=' + encodeURIComponent(t); },
    x: function (u, t) { return 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent(t); },
    facebook: function (u) { return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(u); },
    linkedin: function (u) { return 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(u); }
  };

  var BTNS = [
    { act: 'moments', label: '朋友圈', icon: ICON.moments, cls: 'sh-moments' },
    { act: 'weibo', label: '微博', icon: ICON.weibo, cls: 'sh-weibo' },
    { act: 'x', label: 'X', icon: ICON.x, cls: 'sh-x' },
    { act: 'wechat', label: '微信', icon: ICON.wechat, cls: 'sh-wechat' },
    { act: 'facebook', label: 'Facebook', icon: ICON.facebook, cls: 'sh-facebook' },
    { act: 'linkedin', label: 'LinkedIn', icon: ICON.linkedin, cls: 'sh-linkedin' },
    { act: 'copy', label: '复制链接', icon: ICON.copy, cls: 'sh-copy' },
    { act: 'system', label: '更多分享', icon: ICON.system, cls: 'sh-system' }
  ];
  var MAIN_ACTS = ['moments', 'weibo', 'x']; // 主显：朋友圈、微博、X
  var BTN = {};
  BTNS.forEach(function (b) { BTN[b.act] = b; });

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function landingURL(data) {
    var base = location.origin + '/s?date=' + encodeURIComponent(data.date);
    if (data.kind === 'item' && data.no) base += '&no=' + data.no;
    return base;
  }

  function coverURL() { return location.origin + '/assets/cover.png'; }

  function iconButton(b) {
    return '<button type="button" class="sh-ico ' + b.cls + '" data-act="' + b.act +
      '" title="' + esc(b.label) + '" aria-label="' + esc(b.label) + '">' + b.icon + '</button>';
  }

  // 主显 3 个 + 「其他」下拉（其余平台）
  function buttonsHTML() {
    var html = '';
    MAIN_ACTS.forEach(function (a) { html += iconButton(BTN[a]); });
    var rest = BTNS.filter(function (b) { return MAIN_ACTS.indexOf(b.act) < 0; });
    html += '<span class="sh-more-wrap">' +
      '<button type="button" class="sh-ico sh-more" data-act="more" title="其他分享方式" aria-label="其他分享方式">' + ICON.more + '</button>' +
      '<span class="sh-more-menu">';
    rest.forEach(function (b) { html += iconButton(b); });
    html += '</span></span>';
    return html;
  }

  // 整篇分享：无边框、无文字、居中（样式在 CSS），图标为主显 + 其他
  function bar(data) {
    var p = encodeURIComponent(JSON.stringify(data));
    return '<div class="share-row" data-share="' + p + '">' + buttonsHTML() + '</div>';
  }

  // 紧凑版：嵌入来源行右端，与来源左右互补
  function miniBar(data) {
    var p = encodeURIComponent(JSON.stringify(data));
    return '<span class="share-row share-mini" data-share="' + p + '">' + buttonsHTML() + '</span>';
  }

  function inWeChat() {
    return /MicroMessenger/i.test(navigator.userAgent || '');
  }

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  }

  function toast(msg) {
    var el = document.createElement('div');
    el.className = 'sh-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2200);
  }

  function closeOverlay(ov) {
    if (ov.parentNode) ov.parentNode.removeChild(ov);
  }

  // 微信/朋友圈：展示分享卡片预览 + 明确的分平台操作指引
  function showWxSheet(act, data) {
    var isMoment = act === 'moments';
    var url = landingURL(data);
    var title = data.kind === 'issue'
      ? ('每日枣报 · ' + data.date + '｜' + data.title)
      : ('每日枣报｜' + data.title);
    var summary = data.quote || (data.kind === 'issue' ? '每天十条要闻，附枣评。' : '');
    var badge = isMoment ? '朋友圈' : '微信好友';
    var icon = isMoment ? ICON.moments : ICON.wechat;

    var ov = document.createElement('div');
    ov.className = 'share-overlay';
    var steps;
    if (inWeChat()) {
      steps = isMoment
        ? '<li>点右上角 <b>···</b></li><li>选「分享到朋友圈」</li>'
        : '<li>点右上角 <b>···</b></li><li>选「发送给朋友」</li><li>选择好友后发送</li>';
    } else if (navigator.share) {
      steps = '<li>点下方「系统分享」</li><li>在面板中选择 <b>' + badge + '</b></li>';
    } else {
      steps = isMoment
        ? '<li>点「复制卡片链接」</li><li>打开微信 → 发现 → 朋友圈</li><li>长按相机图标粘贴发布</li>'
        : '<li>点「复制卡片链接」</li><li>打开微信，选择好友</li><li>粘贴发送</li>';
    }

    ov.innerHTML = '<div class="wx-sheet">' +
      '<div class="wx-sheet-hd"><span class="wx-sheet-ico ' + (isMoment ? 'sh-moments' : 'sh-wechat') + '">' + icon + '</span>' +
      '<div><b>分享到' + badge + '</b><small>卡片已备好，按提示发送即可</small></div>' +
      '<button type="button" class="share-x" data-close aria-label="关闭">×</button></div>' +
      '<div class="wx-card"><img src="' + esc(coverURL()) + '" alt="分享封面">' +
      '<div class="wx-card-txt"><b>' + esc(title) + '</b><span>' + esc(summary) + '</span>' +
      '<em>zaobao.sdgzu.edu.kg</em></div></div>' +
      '<div class="wx-steps"><span>操作步骤</span><ol>' + steps + '</ol></div>' +
      '<div class="wx-actions">' +
      (navigator.share && !inWeChat() ? '<button type="button" class="sh-dl" data-sys>系统分享</button>' : '') +
      '<button type="button" class="' + (navigator.share && !inWeChat() ? 'sh-close' : 'sh-dl') + '" data-copylink>复制卡片链接</button>' +
      '</div></div>';
    document.body.appendChild(ov);

    ov.addEventListener('click', function (e) {
      var t = e.target;
      if (t === ov || (t.closest && t.closest('[data-close]'))) return closeOverlay(ov);
      if (t.closest && t.closest('[data-copylink]')) {
        copy(url).then(function () { toast('卡片链接已复制'); });
        return;
      }
      if (t.closest && t.closest('[data-sys]')) {
        navigator.share({ title: title, text: summary, url: url }).catch(function () {});
        return;
      }
    });
  }

  // 微信内点微博/X/FB/LinkedIn：提示用浏览器打开，并给出复制入口
  function showBrowserGuide(label, url) {
    var ov = document.createElement('div');
    ov.className = 'share-overlay';
    ov.innerHTML = '<div class="wx-guide"><div class="wx-guide-arrow">↗</div>' +
      '<p>微信内无法打开 <b>' + esc(label) + '</b><br>请点右上角 <b>···</b> →「在浏览器打开」</p>' +
      '<button type="button" class="sh-dl" data-copylink>复制卡片链接</button>' +
      '<button type="button" class="sh-close" data-close>知道了</button></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      var t = e.target;
      if (t === ov || (t.closest && t.closest('[data-close]'))) return closeOverlay(ov);
      if (t.closest && t.closest('[data-copylink]')) copy(url).then(function () { toast('卡片链接已复制'); });
    });
  }

  function closeMenus(except) {
    var menus = document.querySelectorAll('.sh-more-wrap.open');
    for (var i = 0; i < menus.length; i++) {
      if (menus[i] !== except) menus[i].classList.remove('open');
    }
  }

  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('.share-row [data-act]') : null;
    if (!btn) { closeMenus(null); return; }
    var row = btn.closest('[data-share]');
    if (!row) return;
    var data;
    try { data = JSON.parse(decodeURIComponent(row.getAttribute('data-share'))); } catch (err) { return; }

    var act = btn.getAttribute('data-act');

    // 「其他」下拉：展开 / 收起
    if (act === 'more') {
      var wrap = btn.closest('.sh-more-wrap');
      var isOpen = wrap && wrap.classList.contains('open');
      closeMenus(wrap);
      if (wrap && !isOpen) wrap.classList.add('open');
      return;
    }
    closeMenus(null);

    var url = landingURL(data);
    var title = data.kind === 'issue'
      ? ('每日枣报 · ' + data.date + '｜' + data.title)
      : ('每日枣报｜' + data.title);

    if (act === 'wechat' || act === 'moments') {
      showWxSheet(act, data);
      return;
    }

    if (act === 'copy') {
      copy(url).then(function () { toast('卡片链接已复制'); });
      return;
    }

    if (act === 'system') {
      if (navigator.share) {
        navigator.share({ title: title, url: url }).catch(function () {});
      } else {
        copy(url).then(function () { toast('卡片链接已复制，可粘贴分享'); });
      }
      return;
    }

    if (PLAT[act]) {
      if (inWeChat()) {
        var label = BTNS.filter(function (b) { return b.act === act; })[0];
        showBrowserGuide(label ? label.label : '该平台', url);
        return;
      }
      var target = PLAT[act](url, title);
      var w = window.open(target, '_blank', 'noopener,width=680,height=560');
      if (!w) location.href = target;
    }
  });

  window.ZaoShare = { bar: bar, miniBar: miniBar };
})();
