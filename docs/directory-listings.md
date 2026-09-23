# Directory listing copy — chomptron

Source of truth is `llms.txt`. chomptron is already published to the official
MCP Registry (`io.github.swantron/chomptron`), which Smithery and PulseMCP
both pull from.

## Common fields

- **Name:** chomptron
- **One-liner (≤80 chars):** Turn ingredients on hand into a complete recipe. Free.
- **Category / tags:** Food, cooking, recipes, Gemini, AI
- **Repo:** https://github.com/swantron/chomptron
- **Homepage:** https://chomptron.com
- **MCP endpoint:** https://chomptron.com/mcp (streamable HTTP)
- **Auth:** none
- **Tools (1):** `generate_recipe` — ingredients (+ optional dietary
  restrictions) in, a full recipe (name, servings, timing, ingredients,
  steps) out.
- **Pricing:** free, rate-limited (daily MCP cap, hourly REST cap) to keep it
  free for everyone.
- **License:** MIT (`LICENSE` at repo root).

### Short description (≤160 chars)

> Turn ingredients you have on hand into a complete recipe — name, servings, timing, ingredients, steps. Free, no auth, powered by Gemini.

### Long description

> chomptron generates a full recipe from whatever's in your kitchen. Give it a list of ingredients and, optionally, dietary restrictions (vegan, gluten-free, etc.), and it returns a complete recipe: name, servings, cook time, ingredient list, and steps. No account, no API key, no cost — it's rate-limited instead of paywalled, so it stays free for everyone. Built on Google Gemini.

### Install / connect snippet

```
claude mcp add --transport http chomptron https://chomptron.com/mcp
```

No auth header needed.

---

## Smithery (smithery.ai/new)

- Connect via GitHub (`swantron/chomptron`) or list the remote endpoint
  directly at `https://chomptron.com/mcp`.
- Auth method: **none** — this is the simple case, no bearer-token or OAuth
  prompt needed at install time.
- Tools: 1 (`generate_recipe`).
- License: MIT, already in the repo — nothing to add before submitting.

## Glama (glama.ai)

- Auto-indexes from the GitHub repo URL. Submit
  `https://github.com/swantron/chomptron`.
- Fill in: one-line capability summary (short description above), transport
  = streamable HTTP, tool count = 1, install snippet above.
- No auth to explain — simpler submission than spendtron's.
- The README documents local dev setup (Gemini API key etc.) — that's for
  running your own copy, not for using the hosted service, which needs
  nothing from the caller. Worth a one-line callout in the submission notes
  so it doesn't look like Glama's reviewers need a Gemini key to test it.

## Official MCP Registry

Already published as `io.github.swantron/chomptron`, version 1.0.0. Nothing
further to do here unless the tool or endpoint changes (then bump the
version in `server.json` and republish with `mcp-publisher publish`).

## PulseMCP (pulsemcp.com/submit)

Same situation as spendtron: manual submissions were paused last checked.
PulseMCP crawls the official registry directly, so check
pulsemcp.com/servers for "chomptron" a few days after the registry publish
before filing a manual submission.
