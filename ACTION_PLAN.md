# Jauto audit and action plan

**Date:** 2026-09-05  
**Goal:** Build a modern alternative to JFLAP with reliable JFLAP 7.1 file compatibility.  
**Status:** Implementation in progress. Each completed feature is validated and committed separately.

## Assessment

Jauto has a sound modular foundation, but it is not yet a reliable JFLAP-compatible alternative. The immediate priorities are file preservation, simulation correctness, and protection of users' work. Keep the existing separation between core models, JFF handling, simulators, file services, and shared UI while addressing these gaps.

Compatibility must distinguish three guarantees:

1. A document can be imported.
2. Its contents and meaning are preserved when saved.
3. Its execution matches JFLAP's behavior.

Passing a Jauto parse/serialize round trip alone does not establish compatibility with JFLAP.

## Audit baseline

The following checks were completed against the existing installation:

| Check | Result |
| --- | --- |
| Existing automated tests | 80 passed across core, JFF, and simulator packages |
| Type checking | Passed |
| Web production build | Passed |
| Desktop frontend build | Passed |
| Rust `cargo check --locked --offline` | Passed |
| Lint | Passed, but Vue components are ignored by the current configuration |
| Production dependency audit | Three high and one moderate advisory involving transitive PostCSS/nanoid dependencies; runtime exploitability was not established |
| Browser verification | Confirmed that Backspace in the state-name input deletes the selected state |
| Additional correctness probes | Executed against current source using in-memory transpilation, including official JFLAP fixtures |

No source or configuration files were changed during the audit. Native installer execution, macOS behavior, and exhaustive compatibility across the full JFLAP corpus remain unverified. Existing build caches were present; these checks do not establish clean-checkout release reproducibility.

## Prioritized findings

**P1:** Blocker for a dependable compatible release.  
**P2:** Important correctness, reliability, or usability improvement.  
**P3:** Later expansion or optimization after the compatible automata milestone.

| ID | Priority | Finding | Evidence and consequence |
| --- | --- | --- | --- |
| F01 | P1 | Exported state IDs are incompatible with JFLAP | `packages/core/src/ids.ts:4` generates IDs such as `s0`. `packages/jff/src/serializers/states.ts:13` writes them unchanged. JFLAP parses integer IDs, causing multiple invalid IDs to collide. |
| F02 | P1 | Transition values are not XML-escaped | FA/PDA/TM serializers interpolate transition fields directly. Symbols containing `<` or `&` can produce malformed XML or change on reimport. |
| F03 | P1 | Imports silently change or discard information | `packages/jff/src/parser.ts:19` trims meaningful whitespace. Multi-tape values become strings such as `[object Object]`; building blocks are ignored. `packages/file-io/src/open.ts:22` discards parser warnings. |
| F04 | P1 | The editor runs every finite automaton as a DFA | `packages/ui/src/stores/simulation.ts:35` always selects the DFA runner for finite automata. An epsilon edge from an initial state to a final state incorrectly rejects empty input. |
| F05 | P1 | PDA initialization disagrees with JFLAP | `packages/simulator/src/pda-runner.ts:23` starts with an empty stack instead of `Z`. The official PDA example imports without warnings but rejects valid inputs `ab`, `aabb`, and `aaabbb`. |
| F06 | P1 | Valid execution paths are lost | FA/PDA runners do not support relevant multi-character transition strings. PDA execution truncates configurations at 1,000. `packages/simulator/src/tm-runner.ts:61` follows only the first matching transition. These can produce false rejection. |
| F07 | P1 | Ordinary text editing can delete graph elements | `packages/ui/src/components/AutomatonCanvas.vue:103` forwards global keyboard events to graph interaction handling without protecting all editable targets. Confirmed in the browser. |
| F08 | P1 | Unsaved documents lack lifecycle protection | New/Open can replace unsaved work without protection. Reload/close recovery is absent. Home retains the graph internally but provides no Resume action. |
| F09 | P2 | Simulation replay and visualization are misleading | Previous/Next changes highlights without restoring the corresponding status/configuration. Rejection can highlight an edge that never executed. An accepted PDA result can display a losing branch. |
| F10 | P2 | Editing during simulation creates inconsistent state | The runner retains the starting machine while the UI can display and use an edited document to infer highlights. |
| F11 | P2 | Validation and identity invariants are incomplete | `packages/core/src/validation.ts:127` misses duplicate IDs and invalid TM properties. Imported IDs can collide with new IDs. Multiple initial states and dangling references are insufficiently guarded. |
| F12 | P2 | Execution lifecycle and analysis helpers are unreliable | PDA initial acceptance can be lost on stepping. `run(0)` crashes. Resource limits can look like rejection. Some determinism checks are incorrect, and PDA/TM completeness checks unconditionally return true. |
| F13 | P2 | Undo does not restore exact structure | Remove-state/remove-transition undo appends restored objects, changing order. With current first-match execution, this can change results. |
| F14 | P2 | Inspector drafts can disappear or be omitted | Local drafts reset on selection/object changes. Save and Start operate on committed graph data without resolving pending inspector edits. |
| F15 | P2 | Pointer and viewport behavior is incomplete | Mouse release outside the canvas can leave gestures active. No pointer capture is used. Resize handling misses container changes, high-DPI scaling is absent, and Fit/Zoom helpers are not exposed. |
| F16 | P2 | Teaching and accessibility features are missing | The UI lacks stack/tape/head and branch views, remaining-input visualization, and batch input results. Canvas editing lacks a keyboard-accessible semantic alternative; controls and responsive layouts need work. |
| F17 | P2 | File persistence and export behavior is incomplete | Desktop file paths and actual saved filenames are discarded. Dirty tracking is not revision-based. Web save ignores the boolean result. PNG export captures the current viewport rather than intentional whole-diagram bounds. |
| F18 | P2 | Delivery checks leave important gaps | Vue files are not linted; UI/apps lack test coverage and file-io passes with no tests. The release workflow invokes desktop packaging without first building workspace libraries. Native event capabilities need verification. |
| F19 | P2/P3 | Rendering and trace storage may scale poorly | Continuous idle rendering, repeated graph scans and geometry work, and growing trace arrays warrant measurement and targeted optimization. Performance impact has not yet been benchmarked. |
| F20 | P3 | Current scope covers only part of JFLAP | The model supports FA/PDA/TM, while JFLAP also supports other machine/document families and teaching workflows. Full parity requires separate milestones. |

## Implementation plan

### 1. Define the compatibility contract and establish independent checks

**Priority:** P1  
**Dependencies:** None

- [x] Target JFLAP 7.1 explicitly and publish a compatibility matrix for import, preservation, and execution.
- [x] Define supported transition syntax, epsilon/blank conventions, acceptance policies, and unsupported-feature behavior.
- [x] Start with FA/NFA, PDA, and single-tape TM as the first compatibility milestone.
- [x] Build a conformance suite from official JFLAP files and independently established expected outcomes.
- [x] Verify Jauto-created exports in JFLAP, including files with multiple new states.
- [x] Add regression cases for the confirmed defects, including empty input, string transitions, epsilon cycles, nondeterminism, malformed XML, and resource exhaustion.
- [x] Enable Vue linting and meaningful UI/store/file-service integration tests.
- [x] Add pull-request checks for tests, lint, type checking, and builds.

**Acceptance criteria:** Every advertised feature has an independent compatibility check. Unsupported documents cannot silently become altered editable documents. Tests cover integration behavior as well as isolated engines.

### 2. Repair the document model and JFF import/export

**Priority:** P1  
**Dependencies:** Compatibility rules and initial regression cases from step 1

- [x] Make automaton types a discriminated union with machine-specific transition schemas.
- [x] Allocate internal IDs without collisions and enforce graph uniqueness.
- [x] Map internal IDs to unique integer IDs on export, updating all transition endpoints consistently.
- [x] Use a shared XML writer or escaping utility for every text field and attribute; reject characters forbidden by XML.
- [x] Preserve semantic whitespace and trim only structural fields where appropriate.
- [x] Validate XML structure, document shape, references, initial-state rules, finite coordinates, tape counts, and movement values.
- [x] Preserve notes, state labels, and transition curve geometry.
- [x] Retain compatible document extensions or explicitly diagnose information that cannot be preserved.
- [x] Carry structured import diagnostics through file I/O to the UI.
- [x] Detect multi-tape and building-block documents. Reject unsupported editable imports or offer an explicit mode preserving the original contents.

**Acceptance criteria:** Supported files survive exchange in both directions without altered symbols, topology, annotations, or execution meaning. Unsupported constructs and invalid graphs produce actionable diagnostics.

### 3. Protect document editing and saving

**Priority:** P1  
**Dependencies:** Can proceed alongside steps 2 and 4

- [x] Centralize keyboard handling with editable-target, focus, modifier, and IME guards.
- [x] Add a shared document lifecycle for New/Open/Home/Close with Save/Discard/Cancel behavior.
- [x] Add recoverable drafts, reload/close protection, and a Resume path from Home.
- [x] Track document identity, current revision, and saved revision rather than a manually toggled dirty flag.
- [x] Bind asynchronous save completion to the document revision actually saved.
- [x] Preserve desktop paths and actual chosen filenames; distinguish Save from Save As.
- [x] Handle cancellation, false save results, and errors without clearing unsaved state.
- [x] Display actionable open/save/export errors instead of relying on console output.
- [x] Resolve inspector drafts consistently before saving, starting simulation, changing selection, or undoing.
- [x] Make undo restore exact graph structure and order; test undo back to the saved revision.

**Acceptance criteria:** Typing never deletes graph elements. Canceled or failed operations retain work. Save indicators accurately describe the saved revision, and pending edits cannot disappear silently.

### 4. Correct the execution engines

**Priority:** P1  
**Dependencies:** Compatibility semantics from step 1; coordinate model changes with step 2

- [x] Connect NFA execution and epsilon closure to the editor.
- [x] Support the declared FA/PDA string-transition semantics, including PDA stack-string matching.
- [x] Initialize PDA stacks consistently with JFLAP and correct initial-configuration acceptance.
- [x] Implement fair nondeterministic exploration and configuration deduplication where appropriate.
- [x] Support nondeterministic TMs or explicitly prevent unsupported execution until implemented.
- [x] Specify and implement the targeted TM acceptance policies and shortcut syntax.
- [x] Replace silent branch truncation with explicit resource-limit outcomes.
- [x] Standardize accepted, rejected, invalid, canceled, and incomplete outcomes across runners.
- [x] Validate execution budgets, including zero/negative values, and make terminal steps idempotent.
- [x] Repair determinism checks and remove placeholder completeness results.
- [x] Separate input, stack, and tape alphabet helpers.
- [x] Update existing tests that encode incompatible PDA initialization assumptions.

**Acceptance criteria:** Official examples and edge cases produce expected results. Exhausted resources never count as proof of rejection. Unsupported execution modes are identified before running.

### 5. Make simulation useful for learning

**Priority:** P2  
**Dependencies:** Correct engine behavior and result contracts from step 4

- [ ] Emit actual transition IDs, complete configurations, branch identities, and accepting paths from runners.
- [ ] Include the initial configuration in traces and replay complete snapshots directly.
- [ ] Separate the replay cursor from the execution head.
- [ ] Restart or invalidate simulations after semantic edits; define behavior for layout-only edits.
- [ ] Show consumed/remaining input, PDA stack, TM tape/head, and active configurations.
- [ ] Show branch selection and accepting witnesses for nondeterministic runs.
- [x] Expose meaningful execution limits and clear incomplete/canceled statuses.
- [ ] Add batch input testing after individual simulation and replay are dependable.

**Acceptance criteria:** Every displayed step, highlight, configuration, and status describes the same execution point. Users can inspect why a word was accepted or rejected.

### 6. Improve editor interaction, accessibility, and performance

**Priority:** P2; optimize based on measurements  
**Dependencies:** Coordinate with document transactions and trace UI

- [ ] Use Pointer Events and pointer capture for dragging and transition creation.
- [ ] Handle pointer cancellation, lost capture, Escape, blur, and document switches.
- [ ] Preserve drag offsets and use one history transaction per gesture.
- [ ] Add visible Fit/Zoom controls and fit imported diagrams into view.
- [ ] Observe container resizing and support high-density display rendering.
- [ ] Provide keyboard-operable state/transition editing and a semantic alternative to the canvas.
- [ ] Add associated labels, toolbar/menu semantics, visible focus, and accessible status announcements.
- [ ] Make the inspector collapsible and controls usable in narrow windows and at enlarged text/zoom settings.
- [ ] Export complete diagrams with intentional bounds, scale, background, and editing-decoration options.
- [ ] Benchmark representative small and large diagrams and long simulations.
- [ ] Address idle redraws, repeated graph scans, geometry recalculation, and trace retention based on results.
- [ ] Introduce background execution and viewport culling where justified by measurements.

**Acceptance criteria:** Diagrams remain discoverable and editable across supported input methods, window sizes, and agreed performance benchmarks. Exports include the intended complete diagram.

### 7. Make desktop builds and delivery dependable

**Priority:** P2 overall; clean-build and native-command failures are release blockers  
**Dependencies:** CI foundation from step 1; stable document commands from step 3

- [ ] Centralize shared application commands to reduce web/desktop behavior drift.
- [ ] Configure necessary native event capabilities and ensure listeners are cleaned up.
- [ ] Verify native menus, accelerators, document close protection, and file dialogs.
- [ ] Build workspace dependencies from clean checkouts before desktop packaging.
- [ ] Gate releases on conformance tests, lint, type checking, frontend builds, and native checks.
- [ ] Smoke-test installed Windows and macOS applications.
- [ ] Update affected PostCSS/nanoid dependency paths and assess advisory reachability.
- [ ] Review production CSP and keep native permissions scoped to required functionality.
- [ ] Align version numbers, toolchain requirements, release notes, and setup documentation.
- [ ] Review stale dependency/configuration remnants after checking actual usage.
- [ ] Complete signing/notarization before a stable distribution.

**Acceptance criteria:** Clean CI produces installers that pass platform smoke tests. Native commands work as documented, and dependency advisories are fixed or explicitly assessed.

### 8. Expand toward full JFLAP parity

**Priority:** P3  
**Dependencies:** Dependable compatible automata milestone

- [ ] Add multi-tape TMs and building-block machines with import, preservation, and execution support together.
- [ ] Add regular-expression documents and tooling.
- [ ] Add NFA-to-DFA conversion, DFA minimization, and automaton/regular-expression conversions.
- [ ] Add grammars and parsing workflows.
- [ ] Add Mealy and Moore machines.
- [ ] Add L-systems and pumping-lemma activities.
- [ ] Extend the compatibility matrix and independent fixture suite for every new feature before advertising support.

**Acceptance criteria:** Each feature is a separately verified product milestone. Full JFLAP replacement claims reflect demonstrated coverage rather than file-extension support alone.

## Execution order and release criteria

1. Establish the compatibility contract and regression foundation.
2. Prioritize steps 2-4: file preservation, document protection, and simulation correctness. Document protection can proceed independently alongside the other two.
3. Build trustworthy traces and educational views on the corrected engines.
4. Complete editor usability and platform reliability work, measuring performance before optimizing.
5. Expand to additional JFLAP features after the first compatibility milestone.

Before calling the automata milestone dependable:

- [ ] All P1 findings have regression coverage and are resolved.
- [ ] Supported JFLAP files preserve their meaning through import, edit, export, and reopening in JFLAP.
- [ ] Official examples and declared edge cases execute correctly.
- [ ] Unsupported constructs cannot be silently corrupted or simulated with misleading results.
- [ ] Save, cancellation, recovery, and undo workflows protect user work.
- [ ] Vue/UI/file-service checks run in CI, and releases build from clean checkouts.
- [ ] Installed applications pass the declared platform smoke tests.

## Primary references

- [Official JFLAP download page](https://www.jflap.org/jflaptmp/)
- [JFLAP 7.1 source archive](https://www.jflap.org/jflaptmp/july27-18/JFLAP7.1_With_Source.jar): integer IDs, document families, and XML persistence behavior.
- [JFLAP PDA tutorial](https://jflap.org/tutorial/pda/construct/index.html): initial stack and transition-string semantics.
- [Official PDA example](https://www.jflap.org/tutorial/pda/construct/pdaexample.jff): corpus-backed simulation reproduction.
- [JFLAP book](https://www.jflap.org/jflapbook/jflapbook2006.pdf): finite-automaton string transitions and educational workflows.
- [Single-tape TM tutorial](https://www.jflap.org/tutorial/turing/one/index.html): nondeterminism and shortcut syntax.
- [JFLAP preferences](https://www.jflap.org/tutorial/guiChanges/index.html): TM acceptance policies.
- [Official multi-tape example](https://www.jflap.org/tutorial/turing/multi/turingAnBnCnMulti.jff): per-tape XML structure.
- [JFLAP 7.1 TM format changes](https://www.jflap.org/tutorial/turing/changes7.1/index.html)
- [Finite-automaton tutorial](https://www.jflap.org/tutorial/fa/createfa/fa.html): annotations and editor behavior.
- [Tauri capabilities](https://v2.tauri.app/security/capabilities/): native API permissions.

## Implementation log

- Compatibility contract: added `docs/COMPATIBILITY.md` with an honest baseline matrix, first-release semantics, unsupported-feature policy and verification requirements. Validated against the audit's official JFLAP references and current implementation. No application behavior changed.
- Test and CI foundation: enabled Vue linting, added UI/history and file-service tests, retained the official PDA fixture with provenance, replaced obsolete Vitest workspace configuration, and added PR/release checks. Validation: 86 tests passed; lint, type checking and both frontend builds passed; Turbo task graph verified. Full simulator conformance and installed-platform checks remain outstanding.
- Document identity: made machine kinds discriminated, allocated IDs against the open document, rejected duplicate additions and introduced structural diagnostics for damaged graphs. Validation: 40 core tests passed; all workspace type checks and lint passed. Structural diagnostics will be connected to file opening/export in the next feature.
- Safe JFF exchange: added strict XML/document validation, loss-preventing rejection for unsupported constructs, numeric state-ID mapping, semantic XML entity/whitespace preservation, notes and transition control-point round trips, and visible import notices. Validation: 39 JFF tests and 3 UI tests passed; workspace type checks and lint passed. Independent XML checks cover generated IDs and references. Reopening generated files in the JFLAP application remains an external conformance gate.
- Keyboard safety: centralized editable-target, default-prevention and IME-composition guards for canvas commands and application undo/redo shortcuts. Validation: 8 UI tests passed; workspace type checks and lint passed.
- NFA editor execution: routed nondeterministic finite automata to the NFA runner, exposed epsilon-closure branch states in the canvas highlights, and derived the initial status from the runner so empty-input acceptance is immediate. Validation: 11 UI tests passed; workspace type checks and lint passed.
- Bounded simulation outcomes: added an explicit `step-limit` run outcome, preserved the current configuration for zero-step runs, and removed the shared `run(0)` crash from all four runners. Validation: 30 simulator tests passed; workspace type checks and lint passed.
- Vendor conformance corpus: retained official JFLAP NFA, PDA, and TM examples with provenance and independent language expectations; added execution and graph-preservation checks. A four-state Jauto export with colliding-style internal IDs was reopened successfully by JFLAP 7.1's own XML decoder. Validation: 44 JFF tests passed; JFLAP returned `automata.fsa.FiniteStateAutomaton` for the generated export.
- Transition-semantics regressions: implemented complete FA/PDA string reads, prefix-aware NFA branching, PDA stack-string operations with JFLAP's initial `Z`, and idempotent initial acceptance. Added regressions for string labels, epsilon cycles, nondeterminism, malformed documents, zero-step/resource limits, and vendor PDA languages. Validation: 41 core, 35 simulator, 11 UI, and 46 JFF tests passed; workspace type checks and lint passed.
- Revision-based document state: replaced the manual dirty flag with document identity plus current/saved revisions, preserved revisions across undo/redo, kept drag previews outside history, and bound asynchronous save completion to the captured document revision. Validation: 12 UI tests passed; workspace type checks and lint passed.
- Protected document lifecycle: routed New/Open through a shared Save/Discard/Cancel decision, retained work when saving fails or the user cancels, added browser reload/close protection, persisted unsaved recovery drafts, and exposed Resume on Home. Home navigation retains the current document rather than discarding it. Validation: 19 UI tests passed; workspace type checks and lint passed.
- File identity and save behavior: carried desktop paths through open/save, made Save overwrite the current path while Save As opens the chooser, adopted the filename actually selected, retained dirty state on cancellation/failure, and surfaced save/export errors to users. Validation: 4 file-service and 20 UI tests passed; Rust check/format, workspace type checks and lint passed.
- Exact structural undo: removal commands now capture and restore original state and transition indices, including connected edges, while revision history returns to the saved revision. Validation: 43 core tests passed; core type checks and lint passed.
- Inspector transaction boundary: registered the active inspector draft with the document store and flush it before selection changes, save, New/Open, simulation start, undo, and redo. Validation: 21 UI tests passed; workspace type checks and lint passed.
- Fair bounded exploration: deduplicated NFA/PDA configurations during breadth-first stepping, replaced PDA's silent 1,000-branch truncation with an `incomplete` result and `configuration-limit` reason, validated run budgets, and made terminal stepping idempotent. Validation: 43 simulator tests passed; simulator type checks and lint passed.
- Execution profiles and outcomes: added terminal cancellation across runners, surfaced invalid-machine errors in the editor, implemented configurable TM final-state/halting acceptance, and reject nondeterministic TMs, disabled stay moves, and JFLAP shortcut syntax before execution when unsupported. Validation: 49 simulator and 21 UI tests passed; workspace type checks and lint passed.
- Machine analysis: added separate input, stack, and tape alphabet helpers; made PDA determinism account for overlapping read/pop prefixes and equivalent blank spellings; implemented symbol-level FA, conservative PDA, and literal-TM completeness checks; and updated legacy PDA tests to start with JFLAP's `Z`. Validation: 51 core and 49 simulator tests passed; full workspace tests, type checks, lint, Rust format, and Rust check passed.

Unchecked items remain planned work. Checked items have been implemented and validated as described in the implementation log.
