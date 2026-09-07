# Official JFLAP fixtures

Files in this directory are retained unchanged from their public tutorial sources. Normal tests use these local copies and do not download fixtures.

| File                    | Source                                                                   | Retrieved  | Expected behavior                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `pdaexample.jff`        | https://www.jflap.org/tutorial/pda/construct/pdaexample.jff              | 2026-09-05 | Accepts `a^n b^n` for `n >= 1`; starts with stack `Z`                                                                         |
| `ex1.3a.jff`            | https://www.jflap.org/jflapbook/files/ex1.3a.jff                         | 2026-09-06 | NFA for at least two `a`s followed by `b`s, with each symbol count satisfying the divisibility branches described by the book |
| `ex5.1.jff`             | https://www.jflap.org/jflapbook/files/ex5.1.jff                          | 2026-09-06 | PDA for one or more `a`s followed by more `b`s than `a`s                                                                      |
| `ex9-anbncn.jff`        | https://www.jflap.org/jflapbook/files/ex9-anbncn.jff                     | 2026-09-06 | Single-tape TM for `a^n b^n c^n`, including empty input                                                                       |
| `turingAnBnCnMulti.jff` | https://www.jflap.org/tutorial/turing/multi/turingAnBnCnMulti.jff        | 2026-09-06 | Official three-tape TM for `a^n b^n c^n`                                                                                      |
| `regExprToNfa.jff`      | https://www.jflap.org/tutorial/regular/regExprToNfa.jff                  | 2026-09-06 | Official regular-expression document containing `a*b(a+b)`                                                                    |
| `regGrammarToNFA.jff`   | https://www.jflap.org/tutorial/grammar/toFA/regGrammarToNFA.jff          | 2026-09-06 | Official right-linear grammar used by JFLAP's grammar-to-FA tutorial                                                          |
| `mealyNOT.jff`          | https://www.jflap.org/tutorial/mealy/files/mealyNOT.jff                  | 2026-09-06 | Official Mealy machine that complements each input bit                                                                        |
| `mooreNOT.jff`          | https://www.jflap.org/tutorial/mealy/files/mooreNOT.jff                  | 2026-09-06 | Official Moore machine that complements each input bit                                                                        |
| `lsystem1.jff`          | https://www.jflap.org/tutorial/lsystem/lsystem1.jff                      | 2026-09-06 | Official deterministic L-system tutorial example                                                                              |
| `regUserFirst.jff`      | https://www.jflap.org/tutorial/pumpinglemma/regular/regUserFirst.jff     | 2026-09-06 | Official regular pumping-lemma activity                                                                                       |
| `cfUserFirst.jff`       | https://www.jflap.org/tutorial/pumpinglemma/context_free/cfUserFirst.jff | 2026-09-06 | Official context-free pumping-lemma activity                                                                                  |
| `asfirst.jff`           | https://www.jflap.org/jflapfiles/TMBBexamples/asfirst.jff                | 2026-09-06 | Official nested building-block TM; moves all `a` symbols before all `b` symbols                                               |

The example's XML identifies JFLAP 6.1; it is published in the official tutorial and uses the PDA structure accepted by JFLAP 7.1. Its language follows from the transitions: the first `a` replaces `Z` with `aZ`, more `a`s push `a`, each `b` pops one `a`, and the final epsilon transition is enabled when `Z` is exposed.

Conformance expectations: accept `ab`, `aabb`, `aaabbb`; reject empty input, `a`, `b`, `aab`, `abb`, and `abab`. Parser tests establish the foreign-file structure; simulator regression tests must establish the language independently of serialization.

The expected languages for the three book files are published in the official [file descriptions](https://www.jflap.org/jflapbook/files/description.html). The conformance test encodes representative accepting and rejecting inputs from those language definitions rather than deriving expectations from Jauto's implementation.
