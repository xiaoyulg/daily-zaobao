(function () {
  'use strict';

  var FONT = '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';
  var ACCENT = '#9c2b25';
  var INK = '#1c1a17';
  var BG = '#faf9f6';

  var PLAT = {
    weibo: function (u, t) { return 'https://service.weibo.com/share/share.php?url=' + encodeURIComponent(u) + '&title=' + encodeURIComponent(t); },
    x: function (u, t) { return 'https://twitter.com/intent/tweet?url=' + encodeURIComponent(u) + '&text=' + encodeURIComponent(t); },
    facebook: function (u, t) { return 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(u); },
    linkedin: function (u, t) { return 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(u); }
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function bar(data) {
    var p = encodeURIComponent(JSON.stringify(data));
    var cap = data.kind === 'issue' ? '把这一期分享出去' : '分享这一条';
    return '<div class="share-box">' +
      '<div class="share-cap">' + esc(cap) + '</div>' +
      '<div class="share-row" data-share="' + p + '">' +
        '<button type="button" class="sh-btn sh-primary" data-act="poster">大字海报</button>' +
        '<button type="button" class="sh-btn" data-act="copy">复制链接</button>' +
        '<button type="button" class="sh-btn" data-act="weibo">微博</button>' +
        '<button type="button" class="sh-btn" data-act="x">X</button>' +
        '<button type="button" class="sh-btn" data-act="facebook">Facebook</button>' +
        '<button type="button" class="sh-btn" data-act="linkedin">LinkedIn</button>' +
        '<button type="button" class="sh-btn" data-act="system">更多</button>' +
      '</div></div>';
  }

  function wrap(ctx, text, maxW, size, weight, maxLines) {
    ctx.font = (weight || '700') + ' ' + size + 'px ' + FONT;
    var chars = String(text || '').split('');
    var lines = [], line = '';
    for (var i = 0; i < chars.length; i++) {
      var ch = chars[i];
      if (line && ctx.measureText(line + ch).width > maxW) { lines.push(line); line = ch; }
      else { line += ch; }
    }
    if (line) lines.push(line);
    if (maxLines && lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      var last = lines[maxLines - 1];
      while (last.length && ctx.measureText(last + '…').width > maxW) last = last.slice(0, -1);
      lines[maxLines - 1] = last + '…';
    }
    return lines;
  }

  function makePoster(data) {
    var W = 750, pad = 64;
    var m = document.createElement('canvas').getContext('2d');
    var titleLines = wrap(m, data.title, W - pad * 2, 66, '700', 5);
    var quoteText = data.quote ? '「' + data.quote + '」' : '';
    var quoteLines = quoteText ? wrap(m, quoteText, W - pad * 2 - 30, 42, '600', 5) : [];

    var yTitle = 172;
    var titleH = titleLines.length * 88;
    var yQuote = yTitle + titleH + 34;
    var quoteH = quoteLines.length ? quoteLines.length * 64 + 74 : 0;
    var H = Math.max(1000, Math.ceil(yQuote + quoteH + 170));

    var dpr = 2;
    var cv = document.createElement('canvas');
    cv.width = W * dpr; cv.height = H * dpr;
    var ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);

    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = ACCENT; ctx.fillRect(0, 0, W, 12); ctx.fillRect(0, H - 12, W, 12);

    ctx.fillStyle = ACCENT;
    ctx.beginPath(); ctx.arc(pad + 16, 76, 17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.font = '700 19px ' + FONT; ctx.fillText('枣', pad + 16, 83);
    ctx.textAlign = 'left';
    ctx.fillStyle = ACCENT; ctx.font = '700 31px ' + FONT;
    ctx.fillText('每日枣报', pad + 46, 87);
    ctx.textAlign = 'right'; ctx.fillStyle = '#8a857b'; ctx.font = '400 24px ' + FONT;
    ctx.fillText(String(data.date || '').replace(/-/g, '.'), W - pad, 85);
    ctx.textAlign = 'left';

    ctx.strokeStyle = '#e6e2d9'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pad, 116); ctx.lineTo(W - pad, 116); ctx.stroke();

    ctx.fillStyle = ACCENT; ctx.font = '600 23px ' + FONT;
    if (data.kind === 'item' && data.no) {
      ctx.fillText('第 ' + (data.no < 10 ? '0' + data.no : data.no) + ' 条 · 枣评', pad, yTitle - 44);
    } else {
      ctx.fillText('今 日 要 闻', pad, yTitle - 44);
    }

    ctx.fillStyle = INK; ctx.font = '700 66px ' + FONT;
    var yy = yTitle;
    titleLines.forEach(function (ln) { ctx.fillText(ln, pad, yy); yy += 88; });

    if (quoteLines.length) {
      var by = yQuote - 44;
      ctx.fillStyle = '#f7ece9';
      ctx.fillRect(pad - 10, by, W - (pad - 10) * 2, quoteLines.length * 64 + 76);
      ctx.fillStyle = ACCENT;
      ctx.fillRect(pad - 10, by, 6, quoteLines.length * 64 + 76);
      ctx.fillStyle = ACCENT; ctx.font = '600 42px ' + FONT;
      var qy = yQuote;
      quoteLines.forEach(function (ln) { ctx.fillText(ln, pad + 16, qy); qy += 64; });
    }

    var fy = H - 72;
    ctx.fillStyle = '#8a857b'; ctx.font = '400 24px ' + FONT;
    ctx.fillText('zaobao.sdgzu.edu.kg', pad, fy);
    ctx.textAlign = 'right'; ctx.fillStyle = ACCENT; ctx.font = '600 24px ' + FONT;
    ctx.fillText('让信息抵达 · 让思想发生', W - pad, fy);
    ctx.textAlign = 'left';

    return cv.toDataURL('image/png');
  }

  function toast(msg) {
    var el = document.createElement('div');
    el.className = 'sh-toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1800);
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

  function showPoster(data) {
    var img = makePoster(data);
    var ov = document.createElement('div');
    ov.className = 'share-overlay';
    ov.innerHTML = '<div class="share-modal">' +
      '<div class="share-modal-hd"><b>大字海报</b><button type="button" class="share-x" data-close>✕</button></div>' +
      '<img class="share-poster" src="' + img + '" alt="每日枣报分享海报">' +
      '<p class="share-hint">长按图片保存到相册，即可发微信、朋友圈或任意平台</p>' +
      '<div class="share-modal-ft">' +
        '<a class="sh-dl" href="' + img + '" download="每日枣报-' + esc(data.date || '') + '.png">下载图片</a>' +
        '<button type="button" class="sh-close" data-close>关闭</button>' +
      '</div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('click', function (e) {
      if (e.target === ov || (e.target.closest && e.target.closest('[data-close]'))) {
        if (ov.parentNode) ov.parentNode.removeChild(ov);
      }
    });
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

    if (act === 'poster') { showPoster(data); }
    else if (act === 'copy') { copy(url).then(function () { toast('链接已复制'); }); }
    else if (act === 'system') {
      if (navigator.share) {
        navigator.share({ title: title, url: url }).catch(function () {});
      } else {
        copy(url).then(function () { toast('链接已复制，可粘贴分享'); });
      }
    }
    else if (PLAT[act]) { window.open(PLAT[act](url, title), '_blank', 'noopener,width=680,height=560'); }
  });

  window.ZaoShare = { bar: bar };
})();
