#!/usr/bin/env python3
"""《每日枣报》规则统一写入工具。

任何客户端（手机 / 桌面 / 云端任务 / 对话中的 AI）要修改生成规则，都通过本脚本
把新规则全文写到 GitHub 仓库 rules/ 目录。写完 GitHub Actions 会自动校验格式、
刷新 manifest.json、并通知 Cloudflare 刷新缓存，所有端在十余秒内读到同一版本。

用法：
  python3 push_rule_update.py <新规则全文路径> --note "本次变更说明"

令牌只从环境变量 ZAOBAO_GH_TOKEN 或本地 ~/.config/zaobao/gh_token 读取，
绝不写进脚本或仓库。令牌需 public_repo 权限（能写普通文件即可）。
"""
import sys, os, json, base64, urllib.request, urllib.error, argparse, re

REPO = "xiaoyulg/daily-zaobao"
BRANCH = "main"
API = "https://api.github.com/repos/%s/contents" % REPO
MIN_BYTES = 40000
HEADER = "# 《每日枣报》生产提示词"


def get_token():
    t = os.environ.get("ZAOBAO_GH_TOKEN", "").strip()
    if t:
        return t
    p = os.path.expanduser("~/.config/zaobao/gh_token")
    if os.path.exists(p):
        return open(p, encoding="utf-8").read().strip()
    raise SystemExit("缺少 GitHub 令牌：设置环境变量 ZAOBAO_GH_TOKEN 或写入 " + p)


HEADERS = {
    "Authorization": "token " + get_token(),
    "Accept": "application/vnd.github+json",
    "User-Agent": "zaobao-rules-writer",
}


def get(path):
    req = urllib.request.Request(API + "/" + path, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def put(path, data, message):
    old = get(path)
    payload = {
        "message": message,
        "content": base64.b64encode(data).decode(),
        "branch": BRANCH,
    }
    if old and old.get("sha"):
        payload["sha"] = old["sha"]
    req = urllib.request.Request(
        API + "/" + path,
        data=json.dumps(payload).encode("utf-8"),
        headers=HEADERS,
        method="PUT",
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)["commit"]["sha"][:8]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("rule_file", help="新规则全文的本地路径")
    ap.add_argument("--note", default="", help="变更说明，进入提交信息")
    args = ap.parse_args()

    raw = open(args.rule_file, "rb").read()
    text = raw.decode("utf-8")
    first = text.splitlines()[0] if text.splitlines() else ""
    if not first.startswith(HEADER):
        raise SystemExit("规则首行格式不符：" + first)
    if len(raw) < MIN_BYTES:
        raise SystemExit("规则文件过小：%d 字节（需 ≥ %d）" % (len(raw), MIN_BYTES))

    m = re.search(r"V\d+(?:\.\d+)?", first)
    version = m.group(0) if m else "V4.1"
    filename = "zaobao-prompt-%s.md" % version

    sha = put(
        "rules/" + filename,
        raw,
        "%s规则 %s：%s" % (
            "更新" if get("rules/" + filename) else "新建",
            version,
            args.note or "统一写入工具提交",
        ),
    )

    # manifest 不在这里写：GitHub Actions 检测到规则文件变化后自动校验并重写，
    # 避免两处并发写同一文件产生冲突。
    print("规则文件提交:", sha)
    print("版本        :", version)
    print("字节数      :", len(raw))
    print("路径        : rules/" + filename)
    print("随后 GitHub Actions 会自动校验格式、刷新 manifest、通知 Cloudflare 缓存。")


if __name__ == "__main__":
    main()
