# 25 · CLI Runtime 附件边界方案

> 状态日期：2026-06-20
> 结论：CLI Runtime 第一版继续硬拒绝附件。真正打开附件前，必须先补 capability、权限、大小限制、转换、证据链和回滚。

## 为什么先拒绝

CLI Runtime 是本机进程能力，附件不是普通 prompt 字符串。直接传附件会带来这些问题：

- runtime 是否有权限读本地文件。
- 是否会泄露真实路径、token、env 或项目隐私。
- PDF、Office、图片、音频等 MIME 需要不同转换方式。
- 大文件会污染上下文和日志。
- timeline 必须记录附件以什么形式交给了哪个 runtime。
- ACP runtime 的附件协议不统一。

## 第一版规则

选择 CLI Runtime 后：

- `attachments.length > 0`：拒绝。
- `storedAttachments.length > 0`：拒绝。
- image、PDF、Office、音频、未知二进制：拒绝。
- 本地文件 path 直传给 runtime：拒绝。

用户提示保持清楚：

```text
CLI Runtime 暂不支持附件传递。请先移除附件后重试，或切回 API 模型发送带附件消息。
```

## P1 可打开的最小能力

只考虑文本化 inline 附件，并且必须全部满足：

- runtime catalog 明确声明 `attachments: inline_text`。
- 附件已由 craft 转成纯文本或 Markdown。
- 单附件和总内容有硬上限。
- secret scan 通过或用户明确确认。
- timeline 记录附件名、MIME、原始大小、inline 大小、hash、runtimeId。
- inline 内容用 `<fleet_attachment>` 边界包裹，不能伪装成用户原始输入。

第一版不做图片 vision、PDF/Office 原文件上传、runtime 私有文件上传协议、本地路径直传、后台自动读目录。

## 实现落点

- shared DTO：给 runtime catalog 增加附件 capability。
- server resolver：从硬拒绝升级为 capability-gated inline_text。
- SessionManager：只接收 resolver 产出的文本片段，不直接读文件。
- renderer input：根据 capability 决定是否禁用发送。
- timeline：记录 attachment evidence。
- tests：覆盖无能力拒绝、超限拒绝、转换失败拒绝、inline_text 成功。
