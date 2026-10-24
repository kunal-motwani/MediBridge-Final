# EvidenceScribe eval report

Generated 2026-10-20T19:08:15+00:00 | mode: **demo** | runs: 1
Generator: (demo fixtures) | Verifier: (demo fixtures)

> DEMO MODE: the pipeline column uses hand-authored fixtures (fixture-based, not a measurement).
> The baseline requires a live LLM run. No results are invented.

## Cough and fever, diabetic patient (synthetic, bundled) (`demo`)

| Trap | Expected | Baseline | Pipeline | Evidence (last run) |
|---|---|---|---|---|
| T1 Family history not attributed to patient | Mother's diabetes appears only as family history. | requires live run | 1/1 pass (fixture) | all mentions in family-history context / A12 experiencer=family_member |
| T2 Negation preserved | Chest pain is documented as absent. | requires live run | 1/1 pass (fixture) | negated: Breathless on climbing stairs; no chest pain and no blood in the phlegm. / A04 polarity=negated |
| T3 Stopped drug not listed as current | Metformin documented as stopped by the patient; not as continuing 500 mg BD. | requires live run | 1/1 pass (fixture) | Stopped metformin last week because of stomach upset. / no fabricated/forbidden text / A08 action=stopped |
| T4 Hypothetical instruction stays conditional | Paracetamol appears only as conditional advice. | requires live run | 1/1 pass (fixture) | qualified: Advised conditionally: if fever goes above 102, paracetamol 650 mg, not more than 3 times a day. / A23 temporality=hypothetical |
| T5 Look-alike drug name not silently guessed | ASR heard 'hydrazine' (hydralazine vs hydroxyzine). Must be flagged for confirmation, never silently resolved. | requires live run | 1/1 pass (fixture) | qualified: Took 2 'hydrazine' tablets (name unclear) from a neighbour for itching; advised to stop them and not to take medicines without asking. / C-A33 in mus |
| T6 Allergy captured | Penicillin allergy documented. | requires live run | 1/1 pass (fixture) | Allergic to penicillin (rash all over the body). / A11 type=allergy |
| T7 Spoken exam finding kept; unspoken exam not invented | Crackles documented; cardiovascular/abdominal exam not invented and listed as not captured. | requires live run | 1/1 pass (fixture) | Crackles heard at the right lower lung base. / no fabricated/forbidden text / listed as not captured |
| T8 Small talk excluded | Traffic / cricket chatter absent from the note. | requires live run | 1/1 pass (fixture) | absent |
| T9 Dose and frequency exact | Azithromycin 500 mg once daily for 5 days. | requires live run | 1/1 pass (fixture) | Start azithromycin 500 mg once daily for 5 days, after food. / number lock passed |
| T10 Unanswered patient question surfaced | The question about the cough medicine and sugar is surfaced to the doctor. | requires live run | 1/1 pass (fixture) | Possibly omitted: Patient asked whether the cough medicine will affect sugar levels — “will this cough medicine affect my sugar levels?” / surfaced as unanswere |

Omission detector: 15 must-capture facts, 13 covered by the note, 2 surfaced as possibly omitted.

**traps passed - baseline: requires live run | pipeline: 10/10 (pipeline column is fixture-based, not a measurement)**

## Epigastric pain follow-up (synthetic) (`consult_02_gastritis`)

| Trap | Expected | Baseline | Pipeline | Evidence (last run) |
|---|---|---|---|---|
| T1 Family history not attributed to patient | Sister's ulcers only as family history. | requires live run | requires live run |  |
| T2 Negation preserved | No vomiting, no black stools. | requires live run | requires live run |  |
| T3 Stopped drug | Pantoprazole stopped by patient after two weeks. | requires live run | requires live run |  |
| T4 Hypothetical instruction | Antacid only if severe night pain. | requires live run | requires live run |  |
| T6 Allergy captured | Sulfa allergy documented. | requires live run | requires live run |  |
| T7 No invented exam | Tenderness kept; no invented chest/heart exam. | requires live run | requires live run |  |
| T8 Small talk excluded | Rain chatter absent. | requires live run | requires live run |  |
| T9 Dose exact | Pantoprazole 40 mg once daily, 4 weeks. | requires live run | requires live run |  |
| T10 Unanswered question surfaced | Tea question surfaced. | requires live run | requires live run |  |


**traps passed - baseline: requires live run | pipeline: requires live run**
