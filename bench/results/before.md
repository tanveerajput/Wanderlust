\# Baseline — before query optimisation



\*\*Method:\*\* autocannon -c 10 -d 20 (warm-up run discarded)

\*\*Data:\*\* 100 listings, 1000 reviews (10 per listing), 10 users

\*\*Database:\*\* MongoDB Atlas M0 (shared tier) over home broadband

\*\*Runtime:\*\* Node 24, Windows 11



| Route | p50 | p97.5 | Req/Sec avg | Requests / 20s |

|---|---|---|---|---|

| GET /listings | 5863 ms | 8666 ms | 1.35 | 38 (1 timeout) |

| GET /listings/:id | 1562 ms | 3468 ms | 5.05 | 111 |



\## Notes

\- The index route renders all 100 listings and is roughly 2.5x slower at p97.5

&#x20; than the show route.

\- Timeouts occur on the index route under 10 concurrent connections.

\- Run-to-run variance is high (index p97.5 ranged 7957–8832 ms across four runs)

&#x20; due to network latency to a shared-tier cluster. Comparisons use runs captured

&#x20; under identical conditions.

