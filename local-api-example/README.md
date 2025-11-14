# SQL Server Lokale API

Deze lokale API maakt het mogelijk om vanuit je browser-applicatie te verbinden met een Microsoft SQL Server database.

## Installatie

1. Zorg dat Node.js is geïnstalleerd (https://nodejs.org)

2. Open een terminal in de `local-api-example` folder

3. Installeer de dependencies:
```bash
npm install
```

## API Starten

Start de API server:
```bash
npm start
```

De API draait nu op `http://localhost:3001`

## Gebruik

1. Start de API server (zie hierboven)
2. Open de SQL Viewer applicatie in je browser
3. Ga naar het "SQL Server" tabblad
4. Vul je SQL Server gegevens in:
   - **Server**: bijv. `localhost` of `server.domain.com`
   - **Database**: naam van je database
   - **Gebruikersnaam**: SQL Server login
   - **Wachtwoord**: wachtwoord (optioneel voor Windows Authentication)
   - **Query**: SQL query om uit te voeren
5. Klik op "Query Uitvoeren"

## Beveiliging

⚠️ **BELANGRIJK**: Deze API is bedoeld voor lokaal gebruik alleen!

- Gebruik NOOIT in productie zonder extra beveiligingsmaatregelen
- Voeg geen gevoelige credentials toe aan broncode
- De API accepteert momenteel alle origins (CORS: '*')
- `trustServerCertificate: true` is ingesteld voor lokale ontwikkeling

Voor productie gebruik:
- Beperk CORS tot specifieke origins
- Gebruik environment variables voor credentials
- Schakel `trustServerCertificate: false` in
- Voeg authenticatie toe aan de API zelf
- Gebruik HTTPS

## Troubleshooting

### Kan niet verbinden met SQL Server

1. Controleer of SQL Server draait
2. Controleer firewall instellingen
3. Zorg dat TCP/IP is ingeschakeld in SQL Server Configuration Manager
4. Controleer of de gebruiker permissies heeft

### Port 3001 al in gebruik

Wijzig de `PORT` variabele in `server.js` naar een andere port.

### CORS errors

Zorg dat de API draait voordat je de browser-applicatie gebruikt.
