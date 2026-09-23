# Parcours · 多语言学习之路

A responsive Chinese learning application for French, English and German.

## Included

- Three switchable language modules with a persistent Chinese bilingual mode.
- French, English and German each provide seven selectable routes—A1, A2, A2+, B1, B2, C1 and C2—with 50 lessons per route.
- 1,050 lessons and 3,150 vocabulary cards across eight practical themes.
- German route labels reference Goethe-Zertifikat; English route labels reference Cambridge English Qualifications. A2+ is an internal transition route rather than an official exam level.
- English knowledge progression also draws on the staged teaching approach associated with New Concept English: foundations, everyday grammar, connected narrative, close reading, argument, register and stylistic precision. All passages, examples and exercises in this app are original.
- Five-step lessons: listening, reading, vocabulary/grammar, guided speaking, writing.
- Browser speech synthesis selects French, English or German voices automatically.
- Microphone recording and local playback; recordings are not uploaded.
- Guided role-play scripts and transparent writing self-checks, not AI grading.
- A short listening/reading diagnostic plus optional speaking/writing self-assessment.
- ChatGPT sign-in and user-owned D1 progress, writing drafts, preferences, assessment results, vocabulary, and spaced review scheduling.
- Responsive navigation, accessible form primitives, content correction submissions.
- WebMCP catalog and lesson-launch tools for all three language modules.

## Content

Edit lib/curriculum.ts and the level-specific curriculum modules to maintain the course material. The levels are editorial lesson tags informed by CEFR and selected exam skill descriptions, not official exam preparation or formal certification. The content is an original spiral curriculum and has not undergone independent teacher review. Full AI conversation, automatic pronunciation assessment, a teacher authoring console, and native app distribution are not included.

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
