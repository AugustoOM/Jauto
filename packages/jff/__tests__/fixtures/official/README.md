# Official JFLAP fixtures

Files in this directory are retained unchanged from their public tutorial sources. Normal tests use these local copies and do not download fixtures.

| File | Source | Retrieved | Expected behavior |
| --- | --- | --- | --- |
| `pdaexample.jff` | https://www.jflap.org/tutorial/pda/construct/pdaexample.jff | 2026-09-05 | Accepts `a^n b^n` for `n >= 1`; starts with stack `Z` |

The example's XML identifies JFLAP 6.1; it is published in the official tutorial and uses the PDA structure accepted by JFLAP 7.1. Its language follows from the transitions: the first `a` replaces `Z` with `aZ`, more `a`s push `a`, each `b` pops one `a`, and the final epsilon transition is enabled when `Z` is exposed.

Conformance expectations: accept `ab`, `aabb`, `aaabbb`; reject empty input, `a`, `b`, `aab`, `abb`, and `abab`. Parser tests establish the foreign-file structure; simulator regression tests must establish the language independently of serialization.
