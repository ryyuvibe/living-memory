# Living Memory — M0

An interactive demo of one argument: today's AI memory is a filing cabinet of
flat facts you have to maintain; a better memory is a **living model** that holds
its impression with confidence, corrects itself in the flow, and forgets what's
stale on its own.

**M0 ships the living model alone** — the right-hand panel. The "memory today"
filing-cabinet contrast (M1) is intentionally not built yet.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

No API key needed — interactions are parsed by a deterministic local parser.

### Optional: live LLM parsing

```bash
cp .env.local.example .env.local   # add your ANTHROPIC_API_KEY
```

With a key set, `parseInteraction` routes through the validated `parse_reaction`
prompt (ported from `taste_engine.py`). The key never reaches the browser — all
calls happen in `src/app/api/parse/route.ts`. If the call fails, it falls back to
the local parser so the demo never breaks.

## What to try

1. Press **Next interaction** a few times to feed the seed lines.
2. Watch beliefs form with confidence + provenance ("acid-forward · fairly sure
   (3 signals)").
3. Keep going — the spice belief **flips and announces itself**:
   "you used to avoid spice → updated, you've reached for chili 3× lately."
4. **Adjust / downgrade / forget** any belief inline.
5. **Pin** a belief, then press **Let time pass** — unpinned, unreinforced
   beliefs decay; pinned ones hold.

## The model (the whole trick is structured JSON)

Per belief: `{ feature, lean, confidence, signals, lastSeen, pinned }`.

- **Soft updates** (`src/lib/model.ts`, ported from `taste_engine.py`): each
  signal nudges `lean` by `0.15 × confidence`, revealed behavior weighted harder
  than stated critique.
- **Evidence-grounded confidence**: a saturating function of signal *count* and
  *consistency* (pos vs neg) — never introspection.
- **Designed forgetting**: confidence and lean decay with `lastSeen` age.
- **Contradiction-flip**: when new signals push `lean` across zero, the belief
  marks itself "updated" with a before → after.
```
