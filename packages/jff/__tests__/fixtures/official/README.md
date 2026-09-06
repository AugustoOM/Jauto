# Official JFLAP fixtures

Files in this directory are retained unchanged from their public tutorial sources. Normal tests use these local copies and do not download fixtures.

| File | Source | Retrieved | Expected behavior |
| --- | --- | --- | --- |
| `pdaexample.jff` | https://www.jflap.org/tutorial/pda/construct/pdaexample.jff | 2026-09-05 | Accepts `a^n b^n` for `n >= 1`; starts with stack `Z` |
| `ex1.3a.jff` | https://www.jflap.org/jflapbook/files/ex1.3a.jff | 2026-09-06 | NFA for at least two `a`s followed by `b`s, with each symbol count satisfying the divisibility branches described by the book |
| `ex5.1.jff` | https://www.jflap.org/jflapbook/files/ex5.1.jff | 2026-09-06 | PDA for one or more `a`s followed by more `b`s than `a`s |
| `ex9-anbncn.jff` | https://www.jflap.org/jflapbook/files/ex9-anbncn.jff | 2026-09-06 | Single-tape TM for `a^n b^n c^n`, including empty input |

The example's XML identifies JFLAP 6.1; it is published in the official tutorial and uses the PDA structure accepted by JFLAP 7.1. Its language follows from the transitions: the first `a` replaces `Z` with `aZ`, more `a`s push `a`, each `b` pops one `a`, and the final epsilon transition is enabled when `Z` is exposed.

Conformance expectations: accept `ab`, `aabb`, `aaabbb`; reject empty input, `a`, `b`, `aab`, `abb`, and `abab`. Parser tests establish the foreign-file structure; simulator regression tests must establish the language independently of serialization.

The expected languages for the three book files are published in the official [file descriptions](https://www.jflap.org/jflapbook/files/description.html). The conformance test encodes representative accepting and rejecting inputs from those language definitions rather than deriving expectations from Jauto's implementation.
