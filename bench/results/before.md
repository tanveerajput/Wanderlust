# Baseline: before query optimisation

## Setup

- **Method:** autocannon -c 10 -d 20 (warm-up run discarded)
- **Data:** 100 listings, 1000 reviews (10 per listing), 10 users
- **Database:** MongoDB Atlas M0 (shared tier) over home broadband
- **Runtime:** Node 24, Windows 11

## 1. Original baseline (invalid)

| Route | p50 | p97.5 | Req/Sec avg | Requests / 20s |
|---|---|---|---|---|
| GET /listings | 5863 ms | 8666 ms | 1.35 | 38 (1 timeout) |

Raw output: `before-index.txt`.

**Why it was invalid:** three redundant app instances were running at the same
time, all competing for the same Atlas M0 cluster. The latency, the low
throughput and the timeout came from that contention, not from the code under
test. Nothing measured in this run can be attributed to the index route.

The `GET /listings/:id` numbers from the same session (p50 1562 ms, p97.5
3468 ms, `before-show.txt`) were captured under the same conditions and should
also be treated as contaminated. They have not been re-run yet.

## 2. Clean profiling (single instance)

| Measurement | Result |
|---|---|
| Listing query time (warm) | 172-308 ms |
| EJS render time | 7 ms |
| Response payload | 86 KB uncompressed |
| Queries per index request | 1 |

The index request is dominated by the database round trip to Atlas. Rendering
is negligible.

## 3. Conclusion: no N+1 exists

The suspected N+1 does not exist:

- The index route issues a single query.
- `showListing` already uses nested `.populate()`. Mongoose batches each
  populate level into one `$in` query, so a listing with 10 reviews and 8
  distinct authors takes **4 queries in total** (listing, reviews, review
  authors, listing owner), not the 21 an N+1 would produce.

There is no N+1 to fix, so the optimisation work should target other costs:
round-trip latency, payload size and indexing.

## 4. Clean baseline: GET /listings

Single app instance, `autocannon -c 10 -d 20`. Raw output: `before-index-clean.txt`.

| Stat | 2.5% | 50% | 97.5% | 99% | Avg | Stdev | Max |
|---|---|---|---|---|---|---|---|
| Latency | 293 ms | 593 ms | 1436 ms | 2003 ms | 706.83 ms | 347.5 ms | 2640 ms |

| Stat | 1% | 2.5% | 50% | 97.5% | Avg | Stdev | Min |
|---|---|---|---|---|---|---|---|
| Req/Sec | 3 | 3 | 12 | 24 | 13.75 | 5.52 | 3 |
| Bytes/Sec | 266 kB | 266 kB | 1.07 MB | 2.13 MB | 1.22 MB | 490 kB | 266 kB |

**285 requests in 20.16 s, 24.4 MB read, no errors or timeouts.**

Compared with the invalid baseline, p97.5 dropped from 8666 ms to 1436 ms and
throughput rose from 1.35 to 13.75 req/s. That difference is the removal of the
contention, not an optimisation. This is the number later changes should be
measured against.

## Notes

- Run-to-run variance is expected on a shared-tier cluster over home broadband.
  Compare only runs captured under identical conditions, with a single app
  instance running.
