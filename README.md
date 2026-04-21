# CRM

Tento projekt sa vyvija a testuje cez Docker Compose.

## Architektura

- `frontend/` - Angular frontend servovany cez Nginx na porte `80`
- `backend/` - Node.js backend na porte `4000`
- `database/` - PostgreSQL inicializacia

Root Vite/Preact frontend bol odstraneny, pretoze sa v tomto repozitari uz nepouziva.

## Spustenie

Predpoklady:

- Docker
- Docker Compose

Spustenie celej aplikacie:

```bash
docker compose up --build -d
```

Frontend bude dostupny na:

```text
http://localhost:80
```

Backend bude dostupny na:

```text
http://localhost:4000
```

Databaza bude dostupna na:

```text
localhost:5432
```

## Bezne prikazy

Rebuild len frontendu:

```bash
docker compose up --build -d frontend
```

Rebuild len backendu:

```bash
docker compose up --build -d backend
```

Zastavenie kontajnerov:

```bash
docker compose down
```

Zastavenie kontajnerov aj s volume databazy:

```bash
docker compose down -v
```

Logy:

```bash
docker compose logs -f
```

Logy len frontendu:

```bash
docker compose logs -f frontend
```

Logy len backendu:

```bash
docker compose logs -f backend
```

## Vyvojovy workflow

Odporucany workflow vo VS Code:

1. Upravit kod v `frontend/`, `backend/` alebo `database/`.
2. Spustit rebuild prislusnej sluzby cez Docker Compose.
3. Overit zmeny v kontajnerizovanej aplikacii na porte `80`.

Projekt uz nevyzaduje ani nepouziva Vite dev server v root adresari.
