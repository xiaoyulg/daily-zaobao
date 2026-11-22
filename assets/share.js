(function () {
  'use strict';

  var ICON = {
    wechat: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8.7 3C4.9 3 1.8 5.7 1.8 9.1c0 2 .9 3.8 2.4 5l-.6 1.9 2.1-1.1c.8.2 1.7.4 2.6.4h.5c-.1-.4-.1-.9-.1-1.4 0-3.6 3.2-6.5 7.2-6.5h.4C15.9 4.8 12.7 3 8.7 3zm-2.9 5.2a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5.8 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/><path d="M22.2 14.2c0-3-2.9-5.4-6.4-5.4s-6.4 2.4-6.4 5.4 2.9 5.4 6.4 5.4c.7 0 1.4-.1 2-.3l2 1-.6-1.8c1.8-1 3-2.7 3-4.3zm-8.6-1.6a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8zm4 0a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8z"/></svg>',
    moments: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="3.5"/><circle cx="12" cy="13.5" r="3.4"/><path d="M8 7l1.1-2h5.8L16 7"/></svg>',
    weibo: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8.2c-4.5 0-8.2 2.8-8.2 6.1 0 3.4 3.7 6.1 8.2 6.1s8.2-2.7 8.2-6.1c0-3.3-3.7-6.1-8.2-6.1zm0 9.4c-2.9 0-5.3-1.5-5.3-3.4 0-1.8 2.4-3.3 5.3-3.3s5.3 1.5 5.3 3.3c0 1.9-2.4 3.4-5.3 3.4z"/><path d="M17.8 3.2c2.6.5 4.3 2.3 4.3 4.5 0 1.2-.5 2.3-1.4 3.1l-1.3-1.4c.6-.5.9-1.1.9-1.8 0-1.3-1.1-2.4-2.7-2.8l.2-1.6zM4.6 6.9C5.9 5.7 7.7 5 9.6 5l.1 1.7c-1.4.1-2.6.6-3.5 1.4L4.6 6.9z"/><circle cx="12" cy="14.2" r="1.7"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L5.9 22H2.8l7.3-8.4L2 2h6.5l4.4 5.8L18.9 2zm-1.1 18h1.7L7.3 3.9H5.5L17.8 20z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.4h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.4 2H3.6C2.7 2 2 2.7 2 3.6v16.8c0 .9.7 1.6 1.6 1.6h16.8c.9 0 1.6-.7 1.6-1.6V3.6c0-.9-.7-1.6-1.6-1.6zM8 18.5H5V9.4h3v9.1zM6.5 8.1a1.7 1.7 0 1 1 0-3.5 1.7 1.7 0 0 1 0 3.5zm12 10.4h-3v-4.5c0-1.1 0-2.5-1.5-2.5s-1.8 1.2-1.8 2.4v4.6H9.2V9.4h2.9v1.2h.1c.4-.8 1.4-1.6 2.9-1.6 3.1 0 3.7 2 3.7 4.6v5z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M9.5 14.5l5-5"/><path d="M11.5 6.8l1.2-1.2a3.8 3.8 0 0 1 5.4 5.4l-1.2 1.2"/><path d="M12.5 17.2l-1.2 1.2a3.8 3.8 0 0 1-5.4-5.4l1.2-1.2"/></svg>',
    system: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.3 10.8l7.4-4.3M8.3 13.2l7.4 4.3"/></svg>'
  };

  var PLAT = {
    weibo: function (u, t) { return 'https://service.weibo.com/share/share.php?url=' + encodeURIComponent(u) + '&title=' + encodeURIComponent(t); },
    x: function (u, t) { return 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent(t); },
    facebook: function (u) { return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(u); },
    linkedin: function (u) { return 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(u); }
  };

  var BTNS = [
    { act: 'wechat', label: '微信', icon: ICON.wechat, cls: 'sh-wechat' },
    { act: 'moments', label: '朋友圈', icon: ICON.moments, cls: 'sh-moments' },
    { act: 'weibo', label: '微博', icon: ICON.weibo, cls: 'sh-weibo' },
    { act: 'x', label: 'X', icon: ICON.x, cls: 'sh-x' },
    { act: 'facebook', label: 'Facebook', icon: ICON.facebook, cls: 'sh-facebook' },
    { act: 'linkedin', label: 'LinkedIn', icon: ICON.linkedin, cls: 'sh-linkedin' },
    { act: 'copy', label: '复制链接', icon: ICON.copy, cls: 'sh-copy' },
    { act: 'system', label: '更多分享', icon: ICON.system, cls: 'sh-system' }
  ];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function bar(data) {
    var p = encodeURIComponent(JSON.stringify(data));
    var cap = data.kind === 'issue' ? '分享这一期' : '分享这一条';
    var html = '<div class="share-box"><div class="share-cap">' + esc(cap) + '</div><div class="share-row" data-share="' + p + '">';
    BTNS.forEach(function (b) {
      html += '<button type="button" class="sh-ico ' + b.cls + '" data-act="' + b.act +
        '" title="' + esc(b.label) + '" aria-label="' + esc(b.label) + '">' + b.icon + '</button>';
    });
    return html + '</div></div>';
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
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2000);
  }

  function showGuide(html) {
    var ov = document.createElement('div');
    ov.className = 'share-overlay';
    ov.innerHTML = '<div class="wx-guide">' + html +
      '<button type="button" class="sh-close" data-close>知道了</button></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov || (e.target.closest && e.target.closest('[data-close]'))) {
        if (ov.parentNode) ov.parentNode.removeChild(ov);
      }
    });
  }

  function showWechatGuide(kind) {
    var tip = kind === 'moments' ? '选择「分享到朋友圈」' : '选择「发送给朋友」';
    showGuide('<div class="wx-guide-arrow">↗</div><p>点击右上角 <b>···</b><br>' + tip + '</p>');
  }

  function showBrowserGuide(label) {
    showGuide('<div class="wx-guide-arrow">↗</div><p>微信内无法打开 <b>' + esc(label) +
      '</b><br>请点右上角 <b>···</b><br>选择「在浏览器打开」后再分享</p>');
  }

  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('.share-row [data-act]') : null;
    if (!btn) return;
    var row = btn.closest('[data-share]');
    if (!row) return;
    var data;
    try { data = JSON.parse(decodeURIComponent(row.getAttribute('data-share'))); } catch (err) { return; }

    var url = location.href;
    var title = data.kind === 'issue'
      ? ('每日枣报 · ' + data.date + '｜' + data.title)
      : ('每日枣报｜' + data.title);
    var act = btn.getAttribute('data-act');

    if (act === 'wechat' || act === 'moments') {
      if (inWeChat()) {
        showWechatGuide(act);
      } else if (navigator.share) {
        navigator.share({ title: title, url: url }).catch(function () {});
      } else {
        copy(url).then(function () {
          toast(act === 'moments' ? '链接已复制，打开微信发到朋友圈' : '链接已复制，打开微信发送给好友');
        });
      }
      return;
    }

    if (act === 'copy') {
      copy(url).then(function () { toast('链接已复制'); });
      return;
    }

    if (act === 'system') {
      if (navigator.share) {
        navigator.share({ title: title, url: url }).catch(function () {});
      } else {
        copy(url).then(function () { toast('链接已复制，可粘贴分享'); });
      }
      return;
    }

    if (PLAT[act]) {
      if (inWeChat()) {
        var label = BTNS.filter(function (b) { return b.act === act; })[0];
        showBrowserGuide(label ? label.label : '该平台');
        return;
      }
      var target = PLAT[act](url, title);
      var w = window.open(target, '_blank', 'noopener,width=680,height=560');
      if (!w) location.href = target;
    }
  });

  window.ZaoShare = { bar: bar };
})();
