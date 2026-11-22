(function () {
  'use strict';

  // 订阅组件：信封图标 + 弹窗 + 提交到 /api/subscribe。独立于 app.js 的路由逻辑。
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var LS_KEY = 'zaobao:subscribed';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function leadingIcon() {
    return '<svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">' +
      '<path d="M4 6.5h16v11H4z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M4.6 7.2 12 13l7.4-5.8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>';
  }

  function build() {
    if (document.getElementById('subOverlay')) return;
    var wrap = document.createElement('div');
    wrap.id = 'subOverlay';
    wrap.className = 'sub-overlay';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.innerHTML =
      '<div class="sub-backdrop" data-sub-close></div>' +
      '<section class="sub-dialog" role="dialog" aria-modal="true" aria-labelledby="subTitle">' +
        '<button class="sub-close" type="button" data-sub-close aria-label="关闭">&times;</button>' +
        '<div class="sub-emblem" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" width="30" height="30">' +
            '<path d="M3 7h18v11H3z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>' +
            '<path d="M3.7 7.7 12 14l8.3-6.3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
          '</svg>' +
        '</div>' +
        '<h2 id="subTitle">订阅每日枣报</h2>' +
        '<p class="sub-lead">每天上午 9:00，当日枣报直达你的邮箱。<br>十条要闻、犀利枣评、本期金句，一封读完。</p>' +
        '<form class="sub-form" id="subForm" novalidate>' +
          '<label class="sub-field">' +
            '<span class="sub-field-ico">' + leadingIcon() + '</span>' +
            '<input id="subEmail" type="email" inputmode="email" autocomplete="email" ' +
              'placeholder="你的邮箱地址" aria-label="邮箱地址" maxlength="120">' +
          '</label>' +
          '<button class="sub-submit" id="subSubmit" type="submit">确认订阅</button>' +
        '</form>' +
        '<p class="sub-msg" id="subMsg" role="status" aria-live="polite"></p>' +
        '<p class="sub-foot">只用于投递枣报，不发送广告，随时可退订。</p>' +
      '</section>';
    document.body.appendChild(wrap);

    wrap.addEventListener('click', function (e) {
      if (e.target && e.target.hasAttribute && e.target.hasAttribute('data-sub-close')) close();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && isOpen()) close();
    });
    document.getElementById('subForm').addEventListener('submit', submit);
  }

  function isOpen() {
    var el = document.getElementById('subOverlay');
    return !!el && el.classList.contains('open');
  }
  function open() {
    build();
    var el = document.getElementById('subOverlay');
    var input = document.getElementById('subEmail');
    var msg = document.getElementById('subMsg');
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    msg.textContent = '';
    msg.className = 'sub-msg';
    try { input.value = localStorage.getItem(LS_KEY) || ''; } catch (e) {}
    setTimeout(function () { input.focus(); }, 60);
  }
  function close() {
    var el = document.getElementById('subOverlay');
    if (!el) return;
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function setMsg(text, kind) {
    var msg = document.getElementById('subMsg');
    msg.textContent = text;
    msg.className = 'sub-msg' + (kind ? ' sub-msg-' + kind : '');
  }

  function submit(e) {
    e.preventDefault();
    var input = document.getElementById('subEmail');
    var btn = document.getElementById('subSubmit');
    var email = (input.value || '').trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      setMsg('请填写有效的邮箱地址。', 'err');
      input.focus();
      return;
    }
    btn.disabled = true;
    var original = btn.textContent;
    btn.textContent = '提交中…';
    setMsg('');

    fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (res.ok && res.d && res.d.ok) {
          try { localStorage.setItem(LS_KEY, email); } catch (err) {}
          setMsg(res.d.message || '订阅成功！每天上午 9:00 见。', 'ok');
          input.value = '';
        } else {
          setMsg((res.d && res.d.error) || '订阅失败，请稍后再试。', 'err');
        }
      })
      .catch(function () { setMsg('网络异常，请稍后再试。', 'err'); })
      .then(function () {
        btn.disabled = false;
        btn.textContent = original;
      });
  }

  function mount() {
    var brand = document.querySelector('.site-header .brand');
    if (!brand || document.getElementById('subscribeBtn')) return false;
    var btn = document.createElement('button');
    btn.id = 'subscribeBtn';
    btn.className = 'sub-trigger';
    btn.type = 'button';
    btn.setAttribute('aria-label', '订阅每日枣报');
    btn.title = '订阅每日枣报';
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">' +
        '<path d="M3 7h18v11H3z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>' +
        '<path d="M3.7 7.7 12 14l8.3-6.3" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg>' +
      '<span>订阅</span>';
    brand.appendChild(btn);
    // brand 本身是 <a>，必须阻止冒泡与默认跳转，否则点击按钮会触发页面导航
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      open();
    });
    return true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
