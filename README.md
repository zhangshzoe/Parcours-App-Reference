# Parcours · 法语进阶之路

A responsive Chinese/French learning application for A1–C2 learners.

## Included

- 7 selectable levels, 8 themes, 350 lessons and 1,050 vocabulary cards.
- Five-step lessons: listening, reading, vocabulary/grammar, guided speaking, writing.
- Browser French speech synthesis with sentence replay and slower playback.
- Microphone recording and local playback; recordings are not uploaded.
- Guided role-play scripts and transparent writing self-checks, not AI grading.
- A short listening/reading diagnostic plus optional speaking/writing self-assessment.
- ChatGPT sign-in and user-owned D1 progress, writing drafts, preferences, assessment results, vocabulary, and spaced review scheduling.
- Responsive navigation, accessible form primitives, content correction submissions.
- WebMCP: get_french_learning_catalog and start_french_lesson.

## Content

Edit lib/curriculum.ts and the level-specific curriculum modules to maintain the course material. The levels are editorial lesson tags, not a formal level certification. The content is an original spiral curriculum and has not undergone independent teacher review. Full AI conversation, automatic pronunciation assessment, a teacher authoring console, and native app distribution are not included.

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
