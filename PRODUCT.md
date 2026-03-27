# Flight Finder

- **Flights**: Travelpayouts real-time search — `start` → browser **polls** results (fits Vercel time limits) → `compile` builds rows. **Book on {partner}** uses the click API.
- **Airports**: Travelpayouts `data/en/airports.json` (same token).
- **Budget explorer**: Paused (was Duffel); use Flights.
- Env: host dashboard — `TRAVELPAYOUTS_API_TOKEN`, `NEXT_PUBLIC_TRAVELPAYOUTS_MARKER`.

Klook / Tiqets / AirHelp are not flight offer APIs; add those programs separately (widgets or their APIs) when you build activities/insurance sections.
