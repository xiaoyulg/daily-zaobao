# 每日枣报 · 生成规则维护协议

这份文件是**所有客户端修改生成规则的唯一操作说明**。手机、桌面、云端定时任务、任何 AI 对话，要改规则都按这里做，规则就能保持一致。

## 一句话原则

> **规则只有一份，在 GitHub：`rules/zaobao-prompt-V4.1.md`。改它 = 改规则。除此之外没有第二份"有效规则"。**

- 对话里说"把规则改成 X"**不算改规则**——除非下面这一步真的执行了。
- 本地 `zaobao-rules/` 下的文件只是缓存副本，**只读**，在那里改不算数。

## 怎么改（任选其一，结果相同）

### 方式 A：GitHub 网页 / App（手机最方便）

1. 打开 `https://github.com/xiaoyulg/daily-zaobao/edit/main/rules/zaobao-prompt-V4.1.md`
2. 修改，拉到页面底部，选 **Commit directly to the main branch**
3. 提交即生效。

### 方式 B：用脚本（桌面 / AI 对话）

把新规则全文存成文件，然后：

```
python3 push_rule_update.py <新规则全文路径> --note "本次改了什么"
```

脚本从环境变量 `ZAOBAO_GH_TOKEN` 或本机 `~/.config/zaobao/gh_token` 读令牌，校验首行和字节数后写入 GitHub。

### 方式 C：直接调 GitHub API（任何能发 HTTP 请求的环境）

PUT `https://api.github.com/repos/xiaoyulg/daily-zaobao/contents/rules/zaobao-prompt-V4.1.md`，带 `Authorization: token <TOKEN>`、当前文件 sha、base64 编码的新全文。

## 提交之后会自动发生什么（无需人工干预）

1. GitHub Actions 校验规则首行与字节数（< 40000 字节拒绝）；
2. 自动重写 `rules/manifest.json`：版本号、SHA256、字节数、更新时间、变更记录；
3. 自动 POST Cloudflare `/api/rules/refresh` 刷新缓存；
4. 所有端下次读取 `https://zaobao.sdgzu.edu.kg/api/rules/current` 就是新版本。

通常十余秒内全端一致。

## 各端怎么读规则（唯一入口）

```
https://zaobao.sdgzu.edu.kg/api/rules/current
```

返回 JSON：`version` / `sha256` / `bytes` / `content`（规则全文）/ `updatedAt`。轻量探测版本用 `/api/rules/version`。任何一方发现手里规则版本或 SHA 与 API 不一致，以 API 为准重新取。

## 版本升级

新版本用新文件名 `rules/zaobao-prompt-V4.2.md`（依此类推），不要覆盖旧文件。manifest 会自动指向最新版本。云端任务每次运行都会检查 `rules/` 目录是否有更高版本并自动切换。
