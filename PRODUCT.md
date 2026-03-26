# Flight Finder (Next.js + Duffel)

## Modes

1. **Flight search (`/`)** — User picks origin, destination, dates (autocomplete via Duffel Places). With **Travelpayouts Search API** credentials, results and **Book** links come from the same search (aligned fare + agency URL). Otherwise results are from **Duffel** with a Kiwi deep link for the same route and dates.
2. **Budget explorer (`/budget`)** — User sets a max **flight** budget, nights, and month; we sample hub airports and rank quotes that fit.

## Affiliate / “Find this deal”

- **Travelpayouts mode** (`TRAVELPAYOUTS_API_TOKEN` + `NEXT_PUBLIC_TRAVELPAYOUTS_MARKER`): **Book this fare** resolves the agency URL on click (required by Travelpayouts; links expire in ~15 minutes).
- **Duffel fallback**: **Find this deal on Kiwi** opens a Kiwi deep link with `affilid` + route + dates aligned to the Duffel itinerary where possible. Kiwi’s live fare may still differ.
- Request **Flights search API** access from [Travelpayouts](https://travelpayouts.com/) if the token alone is not enough. For local testing, set `TRAVELPAYOUTS_USER_IP` to a public IP because `user_ip` cannot be `127.0.0.1`.

## Accounts & keys (your side)

| Item | Why |
|------|-----|
| **Duffel** account + access token | Flight data (test → production when approved). |
| **Travelpayouts** API token + marker | Real-time search + book links; marker still used for Kiwi fallback. |
| **Kiwi** program (via Travelpayouts) | Affiliate id on `kiwi.com/deep` when using Duffel-only mode. |
| **Vercel** (or similar) | Hosting; add the same env vars as `.env.local`. |

## Teleport

Removed from product flows (DNS issues were breaking UX). The budget explorer ranks on **fare vs. budget headroom** only.
