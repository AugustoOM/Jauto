# JFLAP 7.1 compatibility contract

Jauto targets JFLAP **7.1**. Support has three independent dimensions: importing a document, preserving it on export, and executing it with the same semantics. A successful import does not imply either of the other guarantees.

## Current coverage

This table records the audited baseline. Update a row only after its independent conformance checks pass. See [the action plan](../ACTION_PLAN.md) for implementation progress.

| Document or feature | Import | Preservation | Execution |
| --- | --- | --- | --- |
| Finite automata | Validated structure and semantic fields | Integer export IDs, XML entities, whitespace and layout round-trip in automated tests; representative export reopened by JFLAP 7.1 | DFA/NFA literal-string execution, including prefix-overlapping branches and epsilon closure |
| Pushdown automata | Validated structure and semantic fields | Integer export IDs, XML entities, whitespace and layout round-trip in automated tests | Initial `Z`, literal read/pop/push strings, final-state acceptance; exploration limit reporting remains pending |
| Single-tape Turing machines | Validated literal single-tape subset | Integer export IDs, XML entities, whitespace and layout round-trip in automated tests | Deterministic literal-symbol subset |
| Notes and transition control points | Preserved | Round-trip covered by automated tests | Layout only; editing UI is pending |
| Multi-tape and building-block TMs | Rejected with an actionable error | Not editable | Unsupported |
| Regular expressions, grammars, Mealy/Moore, L-systems, pumping exercises | Unsupported | Unsupported | Unsupported |

## First release contract

The first dependable milestone covers finite automata (including nondeterminism and epsilon), pushdown automata, and single-tape Turing machines. Broader document families are separate milestones.

- FA transitions consume literal strings, including the empty string (epsilon). Prefix-overlapping transitions are nondeterministic and must explore all applicable paths.
- PDA read, pop and push fields are literal strings. The initial stack is `Z`. The leftmost symbol of a pop/push string is the top of that string. Acceptance requires consumed input and a final state; an empty stack alone is insufficient.
- An empty TM read/write field represents a blank cell. Moves are `L`, `R` or `S`. The initial execution profile accepts upon entering a final state; halt-only acceptance and shortcut expressions must be explicitly supported or rejected before execution. They must never be silently interpreted as ordinary literal cells.
- Names, labels, transition strings and whitespace retain their meaning. Internal IDs may change on export, but exported state IDs must be unique JFLAP-compatible integers and every reference must follow the same mapping.
- Missing initial/final states may be retained in editable drafts. Simulation requires exactly one initial state and valid references; a missing final state is a warning for final-state acceptance.
- Unsupported document structures must produce a visible error or an explicit preservation-only mode. Import must not silently drop tapes, nested machines or metadata.
- Unknown extensions must either be preserved or diagnosed. No unqualified lossless claim is allowed when data is discarded.
- Rejection means all applicable execution paths are exhausted. Resource limits, cancellation, invalid machines and unsupported features are distinct outcomes, never rejection.
- Semantic edits invalidate the running simulation. Replay displays stored configurations and actual traversed transitions rather than guesses from the current graph.

## Evidence required for support claims

1. Vendor-authored fixtures with source URLs and independently specified expected results.
2. Regression cases for epsilon, empty input, multi-character labels, Unicode, XML entities, whitespace, invalid graphs and bounded exploration.
3. Export checks independent of Jauto's own parser, followed by reopening representative exports in JFLAP 7.1.
4. UI and file-service integration checks that exercise the same paths used by users.
5. Clean-checkout web and desktop builds, plus installed-application smoke checks for advertised platforms.

Fixtures and their provenance are version-controlled so normal tests do not depend on live downloads. Native/JFLAP checks that require external runtimes must be reported separately when unavailable; they must not silently pass.

Current automated exchange checks validate exported XML independently and enforce JFLAP-compatible integer state IDs. A representative multi-state export has also been decoded by JFLAP 7.1 itself; see [the recorded evidence](conformance/JFLAP_7_1.md).

## References

- [JFLAP 7.1 source archive](https://www.jflap.org/jflaptmp/july27-18/JFLAP7.1_With_Source.jar)
- [PDA construction and stack semantics](https://jflap.org/tutorial/pda/construct/index.html)
- [Finite automata and string transitions, section 1.5](https://www.jflap.org/jflapbook/jflapbook2006.pdf)
- [Single-tape Turing machines](https://www.jflap.org/tutorial/turing/one/index.html)
- [Acceptance preferences](https://www.jflap.org/tutorial/guiChanges/index.html)
