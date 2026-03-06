# EnergieBuddy MySQL Starter, met originele UI terug

Deze versie combineert:
- je originele EnergieBuddy look & feel
- login/register
- MySQL database
- demo user
- leaderboard
- Groq chatbot via Netlify Function

## Lokale run
1. Zorg dat MySQL/XAMPP draait.
2. Vul `.env` in.
3. Importeer `sql/schema.sql` en `sql/seed.sql`.
4. Start met `npx netlify dev`.

## Demo user
- Email: `demo@energiebuddy.app`
- Wachtwoord: wat overeenkomt met de hash in `sql/seed.sql`

## Belangrijk
- De pagina's `index.html`, `dashboard.html`, `input.html`, `savings.html` en `tips.html` hebben opnieuw de oorspronkelijke stijl.
- Profiel updaten is in deze versie read-only. De backend heeft nog geen update-profiel endpoint.
- Energieprijs en CO₂-factor worden lokaal in de browser opgeslagen.
