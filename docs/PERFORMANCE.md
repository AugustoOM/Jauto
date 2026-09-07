# Performance baseline

Run the repeatable benchmark with `pnpm --filter @jauto/ui bench`.

The benchmark covers a 500-state/4,000-transition render pass and a 10,000-step deterministic batch simulation. On the September 2026 development machine, indexed diagram preparation averaged 0.83 ms, the optimized batch run averaged 74.13 ms (down from 481 ms when every intermediate snapshot was retained), and the culled render pass averaged 23.82 ms (down from 129.20 ms).

The canvas now draws only after document, selection, simulation, viewport, or size changes. Each draw creates state and transition-group indexes once instead of repeatedly scanning the full graph. Simulator runners index outgoing transitions and states once at startup. UI replay retention stops at 10,000 executed steps with an explicit incomplete result.

The large render measurement justified viewport culling, which now skips graph elements whose padded bounds do not intersect the viewport. The optimized 10,000-step batch stays below one tenth of a second on the measured machine, while interactive simulation schedules individual steps, so worker coordination is not currently justified. Revisit background execution if larger supported limits or user traces show sustained blocking.
