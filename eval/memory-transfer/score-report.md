# Memory Transfer Score Report

Generated at: 2026-07-04T08:35:13.994Z

| Strategy | Runs | helpfulRecall@5 | precision@5 | leakage@5 | conflictRate | sensitiveLeaks | avgInjectedTokens | avgPlanScore | successRate | Verdict |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| A | 5 | 0% | 0% | 0% | 0% | 0 | 0 | 0 | 0% | pass |
| B | 5 | 48.33% | 65% | 0% | 0% | 0 | 64 | 0 | 0% | pass |
| C | 5 | 88.33% | 52% | 16% | 80% | 0 | 120 | 0 | 0% | fail |
| D | 5 | 76.67% | 86.67% | 0% | 0% | 0 | 49 | 0 | 0% | pass |
| E | 5 | 76.67% | 86.67% | 0% | 0% | 0 | 49 | 0 | 0% | pass |

## Failure Reasons

- C: naive global leakage@5 above 10%; use as counterexample only
