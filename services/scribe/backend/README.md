# EvidenceScribe

> Others generate notes. We generate notes a doctor can verify in seconds.

EvidenceScribe is an ambient clinical scribe built for a hackathon, with safety as the design goal. It takes a recorded
doctor-patient consultation and does the following:

- Transcribes it with word timestamps.
- Extracts typed clinical **assertions**: polarity, experiencer, temporality, action, dose fields and the verbatim quote.
- Writes a SOAP note in which **every sentence cites assertions and audio spans**.
- Has an independent verifier check that note.
- Gives the doctor a review screen: click a sentence and exactly that stretch of audio plays.
- After the doctor signs off, produces a plain-language **patient takeaway** (English, Hindi or Hinglish), released
  only on doctor approval.

**It is a documentation assistant. The doctor reviews and signs. It is not a diagnostic tool. Use only synthetic
or role-played audio.**

Everything is in one file, `app.py`: the FastAPI backend, the pipeline, the embedded demo data, the eval harness and
a vanilla-JS single-page frontend. There is no build step, no CDN, and it works offline.

## Quick start

```bash
pip install -r requirements.txt
python app.py serve          # open http://127.0.0.1:8000, tick consent, "Load demo consult"
python app.py selftest       # offline checks, PASS/FAIL per test, non-zero exit on failure
```

Other commands: `python app.py smoke` (the full API flow through TestClient), `python app.py eval` (baseline vs
pipeline trap table), and `python app.py make-demo-audio` (regenerates the demo audio, with real speech if pyttsx3,
espeak and ffmpeg are installed).

## Demo mode vs live mode

| | Demo mode (default, no keys) | Live mode |
|---|---|---|
| Audio | `data/demo/consult.wav`, generated on first run with `wave`. Tones mark who speaks when, with silence between turns. Labelled as placeholder audio. Clicking a sentence also speaks the cited words with the browser's `speechSynthesis`. | Your upload or browser recording, converted to 16 kHz mono with ffmpeg. The timeline is never cut. |
| ASR | Embedded scripted transcript with synthetic word timings. It also contains two planted Whisper-style hallucinations over silence, so the guards have something real to drop. | `openai_compatible` (`/audio/transcriptions`, `verbose_json`, word granularity) or `faster_whisper` |
| LLM stages | Hand-authored **fixtures** per stage. The UI permanently shows **"DEMO FIXTURE - not live model output"**. | `anthropic` (forced tool use) or `openai_compatible` (JSON mode plus up to 2 repair retries that feed back the validation error), temperature 0 |
| Deterministic code | Runs for real: guards, drug repair, quote check, dose ranges, chart checks, number lock, gating, hashes. | Same |
| Eval | Pipeline column = "fixture-based, not a measurement". Baseline = "requires live run". | Both columns measured, N runs, variability reported. |

The demo fixtures deliberately contain realistic model errors, so that the safety layer has real work to do:

- The composer writes **"Blood pressure 138/88"** where the patient said "138 over 86". Both the number lock and
  the verifier catch it.
- The composer writes a sentence with no citations. It is rejected, regenerated, then dropped with a warning.
- The composer calls a "mostly dry" cough "productive". The verifier marks it as only partially supported.

For the real hackathon demo, **record your own role-played consult** and run it in live mode.

## Environment variables

All of them are in `.env.example`. Copy it to `.env`, which is loaded automatically; real environment variables win.
Model names and provider URLs **have no defaults**, so you must set them for live mode.

| Variable | Default | Purpose |
|---|---|---|
| `ASR_PROVIDER` | `demo` | `demo` \| `openai_compatible` \| `faster_whisper` |
| `ASR_BASE_URL`, `ASR_API_KEY`, `ASR_MODEL`, `ASR_LANGUAGE` | – | OpenAI-compatible transcription server |
| `FASTER_WHISPER_MODEL`, `FASTER_WHISPER_DEVICE`, `FASTER_WHISPER_COMPUTE_TYPE` | –, `cpu`, `int8` | Local faster-whisper (lazy import, clear error if missing) |
| `LLM_PROVIDER` | `demo` | Generator: `demo` \| `anthropic` \| `openai_compatible` |
| `VERIFIER_PROVIDER` | = `LLM_PROVIDER` | Verifier provider. Prefer a different model family. |
| `GENERATOR_MODEL`, `VERIFIER_MODEL` | – | Model ids, separately configurable |
| `ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`, `ANTHROPIC_VERSION` | –, `https://api.anthropic.com`, `2023-06-01` | Anthropic Messages API |
| `LLM_BASE_URL`, `LLM_API_KEY` | – | OpenAI-compatible generator (`/chat/completions`) |
| `VERIFIER_BASE_URL`, `VERIFIER_API_KEY` | – | OpenAI-compatible verifier |
| `LLM_JSON_MODE` | `json_object` | `response_format.type` for OpenAI-compatible servers |
| `LLM_MAX_TOKENS` | `4096` | |
| `LLM_RETRIES` | `3` | Retries with backoff on network, 429 and 5xx errors (capped at 3) |
| `STAGE_TIMEOUT_S` | `90` | Timeout per provider call (ASR upload gets at least 300 s) |
| `DEMO_REPLAY` | `0` | `1` serves only from the cache or fixtures and never calls the network |
| `UTTERANCE_PAUSE_MS` | `500` | Pause that splits utterances |
| `ROLE_CONF_MIN` | `0.6` | Speaker labels below this become `unknown` and get a flag |
| `REPAIR_THRESHOLD`, `REPAIR_MARGIN` | `0.80`, `0.12` | Drug-name repair: minimum score, and minimum lead over the runner-up |
| `CHANNEL_ROLES` | – | Stereo recordings, e.g. `doctor,patient`: maps channels to roles instead of using the LLM |
| `READABILITY_MIN`, `READABILITY_MAX` | `4.0`, `9.0` | Allowed Flesch-Kincaid grade for the English summary |
| `DATA_DIR` | `./data` | All sessions, cache, demo audio and eval reports |
| `AUDIO_RETENTION_HOURS` | empty (keep) | Delete audio this many hours after sign-off |
| `SHARE_TTL_HOURS`, `SHARE_MAX_ATTEMPTS` | `24`, `5` | Share-link expiry; wrong PINs allowed before the link locks |
| `EVAL_RUNS` | `3` | Live eval repeats per consult |
| `HOST`, `PORT` | `127.0.0.1`, `8000` | Server |

## Architecture

```
 audio ──► [1 ASR] ── words+timestamps ──► hallucination guards (silence energy, repetition, compression)
               │                           drug-name repair (formulary ≥200, phonetic key, margin rule)
               ▼
          [2 ROLES/PHASES] utterances by pause → LLM labels role+phase (or stereo channel map)
               │            small_talk / off_topic excluded from the note, shown greyed
               ▼
          [3 ASSERTIONS] LLM (transcript in delimited DATA block) → code checks:
               │          quote verbatim · span refinement · dose range · frequency normalisation ·
               │          chart allergy conflict · chart contradiction · laterality
               ▼
          [4 COMPOSER]  sees ONLY assertions + visit meta + "PRIOR RECORD (not discussed today)"
               │          code: uncited sentence → reject → regenerate ×2 → drop+warn;
               │          family history → own subsection; hypotheticals → "advised conditionally";
               │          missing exam parts → "Not captured in the conversation"
               ▼
          [5 VERIFY]    deterministic (schema, ids, NUMBER LOCK, allergies)  ┐ VERIFIER role,
               │          precision pass: sentence vs its cited quotes only  │ independent of
               │          omission pass: re-extracts must-capture facts       ┘ the composer
               ▼          → risk score, ordered MUST-CONFIRM list, "possibly omitted"
          [REVIEW UI]  click sentence ⇄ audio range · confirm/edit · add omitted · sign-off gate
               ▼
          [7 SIGN-OFF]  immutable version file (0444): note + provenance + sha256 content hash
               ▼
          [6 PATIENT SUMMARY] confirmed assertions only · template medicine grid · locked tokens ·
                              readability · no-new-content verifier · back-translation · approve gate
               ▼
          FHIR-shaped export · print CSS · PDF · share link (token, 24 h, PBKDF2-hashed PIN, QR)
```

Every stage output is persisted per session under `data/sessions/<random id>/`. Re-runs are idempotent unless you
pass `force=true`. LLM calls are cached on disk under `sha256(prompt_version + model + system + user)`.

## 3-minute hackathon demo script

1. **Problem (30 s).** Ambient scribes save doctors time but produce fluent notes nobody can check quickly. One
   wrong dose or a family history written as the patient's own condition is a real harm.
2. **Dangerous-error example (45 s).** Load the demo consult and go to Review. The top must-confirm card reads
   *"Blood pressure 138/88"*, flagged twice: **NUMBER LOCK** (88 is not in the cited evidence) and verifier
   **unsupported** (the quote says "138 over 86"). Press ▶ on the card to hear the evidence. Also show:
   - The look-alike drug "hydrazine": hydralazine or hydroxyzine? The system flags it and never guesses.
   - Metformin stopped by the patient while the chart says it is active.
   - Sign-off stays **disabled** until each card is confirmed (keyboard: `j`/`k`, `c`).
3. **Click-to-audio (45 s).** Click "Breathless on climbing stairs; no chest pain…". The transcript words light up,
   and the player plays exactly those ranges and stops. Click a transcript word to see which sentences cite it.
   Point at **Possibly omitted**, the independent verifier's catch: the patient's unanswered question about sugar
   levels. Add it with one click, then sign off.
4. **Trap table (30 s).** Open Compare. Ten tagged traps (family history, negation, stopped drug, hypothetical,
   look-alike drug, allergy, unspoken exam, small talk, dose, unanswered question). In demo mode the pipeline column
   is honestly labelled as fixture-based. Run `LLM_PROVIDER=… python app.py eval` live beforehand to show measured
   baseline-vs-pipeline numbers.
5. **Roadmap (30 s).** Patient summary in Hindi with the locked medicine grid, then the roadmap below.

## Roadmap

- Dual-ASR disagreement as an extra uncertainty signal
- Diarization with voice enrollment of the doctor
- Streaming transcription
- Learning from categorized doctor edits
- ABDM/ABHA integration and EHR write-back
- Consent, audit and encryption-at-rest hardening
- Drift monitoring on the trap suite
- Regulatory review before any diagnosis or coding suggestions
- Offline / on-device mode

## Decisions log

- **One file, stdlib HTTP.** Provider calls use `urllib`, so there is no HTTP client dependency at runtime.
  `httpx` is only needed by FastAPI's TestClient for `smoke`.
- **Demo consult.** About 4 minutes: a cough and fever visit for a synthetic patient with type 2 diabetes, in English
  with some Hinglish. The ten traps are tagged with machine-checkable checks; see `DEMO_SCRIPT` and `DEMO_TRAPS` in `app.py`. The spec's example T1 ("my mother had diabetes") is used as-is: the checker requires the mention to stay
  in family-history context.
- **T5 look-alike drug.** ASR text "hydrazine" scores close to both hydralazine and hydroxyzine, so the margin rule
  refuses to repair and raises a confirm card with both candidates plus "keep as heard". A clean repair with a chart
  bonus is covered in selftest.
- **The demo fixtures contain deliberate model errors** (wrong BP digit, an uncited sentence, an overstated
  symptom), so that the deterministic layer and the verifier visibly work. This is stated in the Inspector and here.
- **Placeholder audio.** Tones with silence between turns, rather than silence alone, so the energy-based silence
  detector has real signal to work on. Two hallucinated segments sit over the silences and are dropped by the guards.
- **Number lock.** Single number words are normalized to digits ("five" becomes 5); compound spoken numbers are
  not parsed. Units and formulary drug names in a sentence must also appear in its cited assertions.
- **Doctor edits.** Editing a sentence re-runs the deterministic checks on it. An item's confirmation survives
  re-verification only while its id is unchanged.
- **Patient summary** is built from the **signed** version's cited assertions, which is the definition of
  "doctor-confirmed". If no return signs were stated, the fixed line "Ask your doctor which symptoms should make you
  come back" is used, unless the doctor picks from the pre-approved list. That list is validated server-side.
- **Hindi/Hinglish readability** cannot be scored with Flesch-Kincaid. The gate carries over the English source's
  grade, and says the formula was not computed for the translation.
- **Hindi PDF is disabled.** reportlab needs a bundled Devanagari font. Browser Print works instead.
- **Timeouts are per provider call, not per stage wall-clock.** A hung call surfaces as a stage error in the UI
  (degraded state), never as a crash.
- **Pipeline runs as a FastAPI background task.** The UI polls `/status`.
- **The second consult** (`data/consults/consult_02_gastritis.json`, written on first run) has no fixtures. It is
  evaluated only in live mode and shows "requires live run" in demo mode.
- **Immutable versions** are written with exclusive-create and `chmod 0444`. They carry a sha256 content hash, which
  selftest re-verifies. Signing again creates `v2`.
- **Share PINs** are 4 digits, stored as PBKDF2-SHA256 with a per-link salt, with an attempt limit and expiry.
  Links exist only for approved summaries and are deleted along with their session.

## Honest limitations

- In demo mode every model output is a hand-written fixture. The demo proves the **plumbing and the safety
  checks**, not model quality.
- The trap suite is small (10 traps, 1 consult with fixtures, 1 live-only consult), so passing it does not
  establish clinical accuracy.
- Omission coverage is decided by code matching verifier facts to cited assertions (entity and span overlap). It
  can miss paraphrases.
- The drug formulary (501 names, 215 generics) and the dose-range table are illustrative. They are not a clinical
  reference.
- The FHIR export is demo-level and **not validated against any profile**.
- Readability formulas are rough proxies for comprehension.

## Not verified

These were not run in this environment, so do not assume they work:

- **Live LLM and ASR against real providers.** The Anthropic, OpenAI-compatible LLM and OpenAI-compatible ASR
  adapters are tested only against **local fake servers** (request shape, forced tool use, JSON-mode repair retry,
  multipart word-timestamp parsing). No real API key was used, so a live `eval` has never produced numbers.
- **`faster_whisper` provider.** The package is not installed here.
- **Browser microphone recording** (MediaRecorder). The headless browser test had no microphone.
- **Audible output of `speechSynthesis`.** Read-aloud and the placeholder-audio speech were exercised but not
  listened to.
- **`make-demo-audio` with real speech.** pyttsx3 and espeak are not installed here, so only the tone fallback ran.
- **rapidfuzz path.** Not installed here. The difflib fallback is what was tested.
- **Devanagari in PDF.** Disabled by design. Hindi print was checked only as on-screen rendering in Chromium.
- **TestClient with older Starlette + httpx.** Tested with FastAPI 0.143 / Starlette 1.6.
- **Mobile Safari, Firefox.** Only Chromium was used.

## How it was tested

- `python app.py selftest`: 24 tests, all passing. They cover:
  - repair vs ambiguous flag, and no false repairs over the whole transcript
  - hallucination guards, dose range, allergy conflict, chart contradiction and laterality
  - number lock on an altered dose, side or drug; quote-verbatim check; composer reject-regenerate-drop
  - verification on the demo, readability, translation token lock
  - end-to-end gating, sign-off and immutable versions; patient summary gates and approval
  - hashed PIN, expiry and attempt limit; FHIR bundle shape
  - trap checkers: the fixture passes 10/10, and a deliberately naive note fails as expected
  - stereo channel-to-role mapping; degraded states
  - the three provider adapters against local fake servers; Range audio and OpenAPI
- `python app.py smoke`: 33 steps through TestClient, covering:
  - consent gate, pipeline run, citations and spans, Range audio
  - blocked sign-off, confirmations, add-omitted, signing and hash verification
  - English and Hindi summaries plus approvals, share link with wrong/right PIN, PDF, FHIR
  - inspector, eval, delete, and confirming the share link is gone after delete
- **Browser test** (Playwright + Chromium against `serve`, 32 checks, not shipped):
  - banners and the DEMO label; consent toast
  - clicking a sentence seeks to the cited start, highlights the transcript, and **pauses at the cited end**
  - transcript click shows citing sentences; flag chips
  - sign-off disabled → keyboard `c` confirm → all confirmed → add omitted → signed
  - summary gates, medicine table, approve, share link and PIN, Devanagari rendering
  - Compare tab "Run evaluation"; Inspector
  - no horizontal scroll at 390 px; dark scheme; no console errors

## Not implemented

- Streaming ASR, EHR integration, auth/accounts, Docker, model training, a database server. These are non-goals.
- Speaker diarization for mono uploads beyond what the LLM role labeller infers from the text.
- Fixtures for the second consult, so it cannot be demoed offline.

## Privacy and safety notes

- Logs carry only session ids, stage names, latencies and hashes, never transcript text.
- Each session lives under a random id in `./data`. `DELETE /api/session/{id}` (the "Delete this session's data"
  button) wipes its audio, transcript, outputs, versions and share links. `AUDIO_RETENTION_HOURS` deletes audio
  after sign-off.
- Consent is required before any processing and is recorded in provenance.
- The transcript only ever reaches a model inside a delimited DATA block, with an instruction to ignore instructions
  inside it. Generator calls have no tools beyond the forced output schema, and every output is schema-validated.
- Nothing is presented as medical advice. The patient summary has a fixed footer, is released only after approval,
  and never gains warning signs, diet advice, diagnoses or doses that were not in the confirmed assertions.
- Use synthetic or role-played audio only. This build has no encryption at rest and no access control.

## Windows notes

- Use `py -m pip install -r requirements.txt` and `py app.py serve` (or `python`) in PowerShell/cmd.
- Copy the env file with `copy .env.example .env`. Set variables in PowerShell with `$env:LLM_PROVIDER="demo"`.
- ffmpeg is optional: install it (`winget install ffmpeg`) and make sure it is on PATH for non-WAV uploads and real-speech demo audio.
- `pyttsx3` uses the built-in Windows SAPI5 voices; no espeak needed.
- Windows-specific fixes applied: UTF-8 console output (Hindi no longer crashes cp1252 consoles), retrying atomic file replace when a file is briefly locked, explicit UTF-8 when reading files and decoding ffmpeg output.
- Not verified on a real Windows machine: these changes were only syntax-checked here.

## Languages

Patient summaries support English, Hindi, Hinglish (demo fixtures + live) and Marathi, Bengali, Tamil, Telugu (**live LLM only**, no demo fixture, so no unreviewed translation is shown in demo mode). All use locked numbers/drug names, a back-translation check and the machine-translation banner. Add a language by adding an entry to `LANGS` and a label list to `_EXTRA_LABELS` in `app.py`. PDF export is limited to Latin-script output; use browser Print for the rest. Not verified: the new label sets were written without a native-speaker review, and nothing was run in this session (dependencies could not be installed), so run `selftest` and `smoke` first.
