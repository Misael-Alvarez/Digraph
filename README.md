# AION Architecture Studio

A cloud architecture diagram editor for developers. Draw on a canvas, or write
the architecture as YAML and watch it draw itself — the two stay in sync.

## Getting started

```bash
npm install
npm run dev
```

The editor is at http://localhost:3000. Nothing else is required: diagrams live
in the browser (IndexedDB) until the backend lands.

To enable the AI features, copy `.env.example` to `.env.local` and set
`ANTHROPIC_API_KEY`. Without it everything else works and the AI panel says it
is unavailable.

## What it does

- **189 cloud services** across AWS, Azure, GCP and generic infrastructure, with
  the official icons.
- **Switch cloud in one click.** Every service is mapped to its equivalent role
  in the other providers, so an AWS diagram becomes a GCP one and anything with
  no equivalent is reported rather than silently changed.
- **Diagram as code.** A YAML DSL compiles to a diagram and back, losslessly,
  positions included. Edit either side; whichever has focus wins.
- **Generate with AI.** Describe a system and get a diagram, or ask what the one
  on screen is missing. A generated diagram is one undo step away from gone.
- **Export** to SVG, PNG, Markdown and Mermaid. Exported files are entirely
  self-contained — icons and logos are inlined, so they render anywhere.
- **Share a link.** The diagram travels compressed inside the URL, so a link
  works with no account and no server holding your data. `/api/embed` renders it
  to SVG server-side for embedding, and the README snippet is a Mermaid block,
  which GitHub renders natively.

## Keyboard

|                |                                                        |
| -------------- | ------------------------------------------------------ |
| `⌘K`           | Command palette: services and commands                 |
| `⌘J`           | AI assistant                                           |
| `⌘/`           | Split code view                                        |
| `V B U G I C`  | Select, boundary, sub-boundary, group, item, connector |
| `Space` + drag | Pan · `⌘` + wheel zooms at the cursor                  |
| `⌘1` / `⌘0`    | Fit to view / reset zoom                               |
| `?`            | Every shortcut                                         |

## The DSL

```yaml
version: 1
cloud: aws
boundaries:
  vpc: { label: Production VPC }
nodes:
  cdn: cloudfront
  api: { service: apigateway, label: Public API, in: vpc }
  fn: { service: lambda, in: vpc }
edges:
  - cdn -> api: HTTPS
  - api -> fn: invoke
layout:
  cdn: [80, 80]
```

`cloud` resolves unprefixed service names, so retargeting a whole diagram is a
one-line change. `layout` is written by the canvas and pins manual positions;
leave it out and the layered auto-layout decides.

## Architecture

```
src/lib/domain/   Zod schemas — the single source of truth for every type
src/lib/engine/   Pure geometry, routing, layout. No browser APIs, so it can
                  render on a server for embeds.
src/lib/dsl/      YAML and Mermaid, in and out
src/lib/ai/       Prompts, output schema, rate limiting
src/lib/share/    Link codec and share/embed URLs
src/lib/store/    DiagramRepository — the only I/O boundary in the app
src/lib/editor/   Reducer, viewport maths, export
src/components/   The editor: canvas, floating chrome, code panel
src/app/api/      Route handlers: AI (the only place the API key exists) and
                  the server-rendered embed
```

Two rules hold the shape:

**The UI never touches I/O.** Everything goes through `DiagramRepository`, which
is async today over IndexedDB and will be the same interface over an API.

**The engine never touches the browser.** That is what lets `/api/embed` render
an image with the same code the canvas draws with — no headless browser, and no
way for an embed to drift from what the author saw.

## Commands

```bash
npm run dev          # development server
npm run build        # production build
npm test             # unit tests
npm run test:e2e     # end-to-end tests (needs the dev server running)
npm run typecheck    # tsc --noEmit
npm run lint
npm run format
```
