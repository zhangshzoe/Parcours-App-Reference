# Parcours · 多语言学习之路

A responsive Chinese learning application for French, English, German and Japanese.

## Included

- Four switchable language modules with a persistent Chinese bilingual mode.
- French, English and German each provide seven selectable routes—A1, A2, A2+, B1, B2, C1 and C2—with 100 lessons per route.
- Japanese provides four routes from zero foundation to JLPT N4, N3, N2 and N1, with 100 lessons per route.
- 2,500 lessons and 7,500 vocabulary cards across eight practical themes.
- Each route has 50 core lessons, 30 transfer lessons, 15 integrated tasks and five next-level readiness checks. Completing a route and its checks supports a progression recommendation; it does not award or guarantee formal proficiency.
- German route labels reference Goethe-Zertifikat; English route labels reference Cambridge English Qualifications. A2+ is an internal transition route rather than an official exam level.
- English knowledge progression also draws on the staged teaching approach associated with New Concept English: foundations, everyday grammar, connected narrative, close reading, argument, register and stylistic precision. All passages, examples and exercises in this app are original.
- Japanese route labels reference the official JLPT competence descriptions. The app adds speaking and writing practice beyond the JLPT test sections; it is not an official preparation course or certification.
- Five-step lessons: listening, reading, vocabulary/grammar, guided speaking, writing.
- Browser speech synthesis selects French, English, German or Japanese voices automatically.
- The original multilingual lesson player records and plays back locally without uploading audio. The separate `/coach` and `/english` routes can send a recording to OpenAI for transcription after explicit consent; the app does not persist raw audio.
- The original lesson player uses guided role-play scripts and writing self-checks. The separate routes add bounded AI-assisted text feedback when the server-side service is configured; this is not a teacher grade or pronunciation score.
- A short listening/reading diagnostic plus optional speaking/writing self-assessment.
- ChatGPT sign-in and user-owned D1 progress, writing drafts, preferences, assessment results, vocabulary, and spaced review scheduling.
- Responsive navigation, accessible form primitives, content correction submissions.
- WebMCP catalog and lesson-launch tools for all four language modules.

## Content

Edit lib/curriculum.ts and the level-specific curriculum modules to maintain the original course material. The levels are editorial lesson tags informed by CEFR and selected exam skill descriptions, not official exam preparation or formal certification. The content is an original spiral curriculum and has not undergone independent teacher review. Unlimited live AI conversation, automatic pronunciation assessment, a teacher authoring console, and native app distribution are not included. The newer `/coach` and `/english` routes are described separately below and in `docs/`.

## Development

Use the Node.js and npm versions provided by the environment.

- npm run dev — local preview on the URL printed by Vinext.
- npm run build — build Cloudflare-compatible output.
- npm start — preview the built Worker; use its printed local URL.
- npm run db:generate — generate schema migrations after db/schema.ts changes.
- node scripts/verify-state.mjs — verify storage, retry safety, validation and isolation against the built Worker in an isolated Miniflare instance. It uses disposable example.test identities and an ephemeral database; no hosted data is touched.

The portable development preview provides a single local sign-in identity. Production sign-in is owned by Sites. API code trusts only the platform-forwarded identity; clients never choose the owner of a record. Site access policy controls who can open the published app.

## Persistence

The schema and migration live under db/ and drizzle/. Apply local migrations with the starter's Wrangler command and .wrangler/state. Publishing applies schema migrations in the hosted database. Never replay or rewrite an applied migration. Lesson completion is idempotent per attempt ID. Personal responses are not stored in browser localStorage.

Content corrections are stored in content_reports for the course maintainer. Recordings and unsaved practice responses are temporary by design. Speech voices depend on the browser/device.

## Visual asset

public/cafe.png is an original generated illustration, created for this app.

## 法德学习教练内测入口

新增 `/coach` 入口沿用现有项目，聚焦法德 A1/A2；原有多语言页面保留。当前范围和真实完成证据见 docs/SPEC.md、docs/PLAN.md、docs/TEST_REPORT.md，AI 配置见 docs/AI_SERVICES.md。未配置时不得将测试夹具视为真实服务。

本地预览先构建，再依顺序应用 drizzle/ 中尚未应用的迁移（当前日志至 0018），使用 --local 和 .wrangler/state；不要重放已应用迁移或添加 --remote。起点检查测试：node scripts/verify-coach-assessments.mjs，使用隔离数据库和拦截的供应商响应。法语单项不限时学习模式的使用说明与验证范围见 docs/EXAM_SOURCES.md、docs/TEST_REPORT.md；迁移 0015 为旧考试记录设置计时模式默认值，不追溯改写旧答题内容。

微课步骤测试：node scripts/verify-coach-lessons.mjs。整课完成和旧文字完成分别保存；测试使用隔离数据库和模拟语音响应，不能代替真实听说验收。

词卡内容及接口检查：node scripts/verify-coach-vocabulary.mjs。法德 A1/A2 各 40 条，详见 docs/VOCABULARY_CONTENT.md；真实语音与人工审核仍待完成。

听力考试检查：node scripts/verify-coach-exam-listening.mjs。四组合各一份听力专项，复用既有精听材料并标记重复暴露；不是新增独立题库。应用自定播放规则不等于官方规则，真实音频尚未验证。

口语考试及考后参考反馈：node scripts/verify-coach-exam-responses.mjs。四组合各 2 个原创口头回应任务，保存原始/确认转写并关联本题答案；写作和口语提交后可请求 AI 文字参考意见，无发音或官方分数。真实服务、真机和人工内容审核仍待验证。

四技能缩短卷检查：node scripts/verify-coach-integrated.mjs。法德 A1/A2 各一份 10 项组合卷，A1 30 分钟、A2 40 分钟（应用自定规则），复用已有题目 ID 和版本。仅用户主动开始；分技能报告区分未测、部分作答、首次和重复记录。真实音频/真机/内容审核仍待完成。


手机安装与离线支持：在 `/coach` 的“我的”查看安装方法；本版只准备公共连接提示，云端 AI、账号和记录保存仍需联网。实现、缓存边界、验证与真机待办见 [PWA.md](docs/PWA.md)。离线与资源验证：`node scripts/verify-coach-pwa.mjs`（先构建）。


学习数据导出：`/coach` →“我的”支持当前语言或全部应用记录（含旧版）JSON 下载。说明与隐私剩余工作见 [PRIVACY.md](docs/PRIVACY.md)。验证：`node scripts/verify-coach-privacy.mjs`（先构建，使用隔离数据）。按范围删除已接入，带确认、回执与旧请求写入保护；另运行 `node scripts/verify-coach-privacy-late.mjs` 验证迟到模拟服务。删除弹窗已完成非破坏性的四尺寸范围与取消检查；真实手机及重新认证仍待验收，详见隐私说明。


按等级学习报告：`/coach` →“我的”可查看当前语言 A1/A2 的实际练习记录；首次/重复题、文字与录音分开，收藏复习明确按语言全部等级统计。口径及限制见 [PROGRESS.md](docs/PROGRESS.md)。验证：`node scripts/verify-coach-progress.mjs`（先构建；隔离数据库，无真实服务请求）。


发音教学：课程概览的“发音观察与跟读”提供法德 A1/A2 共 16 份补充提示；精听提交后可重听对应原句并把提示随句子加入复习。说明与来源限制见 [PRONUNCIATION.md](docs/PRONUNCIATION.md)。运行 node scripts/verify-coach-pronunciation.mjs 验证结构和模拟链路；不是自动发音评分，真实音频与人工审核待完成。

## 英语听说内测入口

`/english` 提供五个虚构的工作及日常交流场景，各有基础与进阶难度。听辨、逐句辅助、短轮次回应、AI 文字追问、重试和分开的复习记录见 [ENGLISH_LISTEN_SPEAK.md](docs/ENGLISH_LISTEN_SPEAK.md)。没有服务端 AI 配置时，录音转写、合成语音和 AI 追问不可用；设备朗读只作为标明的备用方案。服务调用前分别说明录音和已确认文字的用途并要求同意；本应用不长期保存原始录音。`node scripts/verify-english-flow.mjs` 使用隔离数据库及模拟服务验证流程，不能代替真实语音、教师审核、双浏览器或手机真机验收。
