# 手机安装与离线支持

本地实现状态：2026-10-03。此文描述 `/coach` 的首版 PWA 支持；尚未公开部署，也未完成 iPhone／Android 真机安装或断网测试。

## 用户行为

- “我的”顶部显示安装入口；未登录时也可查看安装说明。
- 支持安装提示的浏览器发出 `beforeinstallprompt` 后，显示“添加到主屏幕”。只由用户点击触发安装；接受提示不直接冒充安装已完成。
- 没有安装事件时提供 iPhone Safari 和 Android 浏览器菜单说明；已处于独立应用窗口或收到安装完成事件时显示已添加。
- 浏览器报告离线时显示网络提示；重新联网提示检查保存状态，不自动刷新、重播请求或上传录音。
- 公共连接提示页提供返回 `/coach` 的入口，说明已确认保存与未提交数据的区别、云端功能需联网、考试截止时间不因断网暂停。
- 离线页只提供连接说明。首版没有离线课程、离线账号、离线答题或后台补交。

## 文件与缓存边界

`public/coach/manifest.webmanifest` 指定 `/coach` 为应用身份、开始地址和范围；提供 192／512 PNG、独立 maskable 图标及 180px Apple 图标。图标由仓库内字体无关 SVG 生成，沿用蓝色 p 与珊瑚色圆点标识；原站 favicon 保留。

`public/coach-sw.js` 注册范围为 `/coach`，但导航逻辑只匹配精确 `/coach` 与 `/coach/` 子路径，不处理 `/coach-other`。根页面 `/` 的功能与元数据保留。

唯一缓存为 `parcours-coach-public-v1`，仅包含以下七个公共资源：

1. `/coach/offline.html`
2. `/coach/offline.css`
3. `/coach/manifest.webmanifest`
4. `/coach/icon-192.png`
5. `/coach/icon-512.png`
6. `/coach/icon-maskable-512.png`
7. `/coach/apple-touch-icon.png`

预缓存请求不携带凭据，拒绝重定向、错误状态、不匹配的类型、private／no-store 或 Set-Cookie 响应；全部资源校验后才写入缓存。公共资源仅精确路径且无查询参数时命中。浏览器清理或回收缓存后，需要再次联网准备。

学习页面导航只请求网络且禁用 HTTP 缓存，不存入 Cache Storage；连接异常或 5xx 时返回公共提示页。认证跳转、401／403／404 保留原响应。所有 API、RSC、POST、外部资源、录音和合成语音均不进入此 Service Worker 的缓存分支；没有后台同步或请求队列。

更新不调用 `skipWaiting`／`clients.claim`，不强制刷新正在录音或答题的页面。激活时只清理本应用公共缓存前缀的旧版本，不删除其他应用缓存。今后修改上述公共资源时须升级缓存版本；新 worker 等旧页面退出后再生效。

Cloudflare 默认 HTML 地址规范化会把 `/coach/offline.html` 改写为 `/coach/offline`，与拒绝重定向的安全预缓存冲突。已在 `vite.config.ts` 中明确 `assets.html_handling: 'none'`；构建资源测试覆盖实际路由。现有公开静态文件只有图片／图标及本次离线页，不依赖旧的 HTML 自动改写。

客户端所有学习请求使用 `cache: 'no-store'`。网络异常提示“操作结果尚未确认”，非 JSON 响应提示检查保存状态；有效接口错误继续显示原原因。客户端不会根据网络异常反推服务端一定未保存。

## 验证证据与限制

- 类型检查、构建通过。
- `node scripts/verify-coach-pwa.mjs`：执行真实 worker 源码的隔离事件测试，覆盖允许列表、凭据、私有资源旁路、离线／5xx 回退、登录／错误状态保留、缓存清理隔离、不强制激活、图标尺寸；另在 Miniflare 中验证构建资源、元数据、旧首页及未登录 API。
- 同一脚本验证客户端网络异常、非 JSON 网关响应、409 版本冲突、空错误体以及 GET／POST 不缓存。
- 本地浏览器观察到“离线提示已准备好”；验证安装说明展开、静态提示预览、返回学习，以及 360／390／430／1440px 下无页面级横向溢出。截图见 `screenshots/pwa-install-*.jpg` 与 `pwa-offline-*.jpg`。
- 截图中的提示页来自主动预览；网络中断与恢复分支由隔离测试验证，不能据此声称已在真实手机断网、安装到主屏幕或独立窗口登录验证通过。
- 尚待：真实 iPhone／Android 安装、冷启动、登录往返、系统网络切换、浏览器缓存回收、更新等待、录音中断与软键盘／安全区检查。大陆网络可访问性未验证。

## 实现依据

2026-10-03 查阅：[MDN 安装条件](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)、[安装提示事件](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event)、[Service Worker 生命周期](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)、[Cloudflare 静态资源配置](https://developers.cloudflare.com/workers/vite-plugin/reference/static-assets/)、[HTML 路由规则](https://developers.cloudflare.com/workers/static-assets/routing/advanced/html-handling/)。浏览器安装方式与能力差异仍需按目标真机验收。
