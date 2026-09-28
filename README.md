# Anki / spaced repetition · Vanilla JS

Cartas con repetición espaciada (SM-2 recortado). Node `http` (sin Express) y front vanilla. Listo para **Cloud Run**.

## Local

```bash
npm start
```

http://localhost:8080

- `GET /api/due`
- `POST /api/cards` `{ front, back }`
- `POST /api/review` `{ id, grade: "again"|"hard"|"good" }`
- `GET /health`

## Persistencia en Cloud Run

El disco del contenedor es efímero. Las reviews se guardan en `/tmp/anki-db.json` (y en memoria). Si la instancia se apaga o escala, el mazo vuelve al seed de `data/db.json`. Para un Anki real haría falta Firestore o un bucket.

## Cloud Run

```bash
gcloud auth login
gcloud config set project TU_PROJECT_ID
gcloud run deploy anki-srs \
  --source . \
  --region southamerica-east1 \
  --allow-unauthenticated
```

APIs: Cloud Run, Cloud Build, Artifact Registry.

## Repo

https://github.com/DanyPreisz/anki-srs-vanilla
