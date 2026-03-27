# Flight Finder

- **Flights**: Travelpayouts — `POST .../start` → `GET .../batch-poll` (several TP reads per Vercel invocation) → `POST .../compile`. **Book on {partner}** = click API.
- **Redeploy Vercel**: push to `main` (connected repo), or **Deployments → ⋮ → Redeploy** on the latest deployment.
- **Node**: Project uses `engines` for Node 20–22; in Vercel **Settings → General → Node.js Version**, pick **20.x** (avoid 24.x unless you’ve verified the build).
- **Airports**: Travelpayouts `data/en/airports.json` (same token).
- **Budget explorer**: Paused (was Duffel); use Flights.
- Env: host dashboard — `TRAVELPAYOUTS_API_TOKEN`, `NEXT_PUBLIC_TRAVELPAYOUTS_MARKER`.

Klook / Tiqets / AirHelp are not flight offer APIs; add those programs separately (widgets or their APIs) when you build activities/insurance sections.
