# Flight Finder

- **Flights**: Travelpayouts real-time search only — each row is a specific partner price; **Book on {partner}** uses the click API (aligned with that price).
- **Airports**: Travelpayouts `data/en/airports.json` (same token).
- **Budget explorer**: Paused (was Duffel); use Flights.
- Env: host dashboard — `TRAVELPAYOUTS_API_TOKEN`, `NEXT_PUBLIC_TRAVELPAYOUTS_MARKER`.

Klook / Tiqets / AirHelp are not flight offer APIs; add those programs separately (widgets or their APIs) when you build activities/insurance sections.
