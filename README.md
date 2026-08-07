# Guida Tecnica: Integrazione DatoCMS con CLI e Next.js

## Riferimenti Ufficiali

* **DatoCMS CLI (Installazione e Comandi):** [https://www.datocms.com/docs/cli](https://www.datocms.com/docs/cli)
* **Integrazione Next.js + DatoCMS:** [https://www.datocms.com/docs/next-js](https://www.datocms.com/docs/next-js)

---

## 1. Accesso e Setup Progetto DatoCMS

1. Registrarsi sul sito ufficiale di [DatoCMS](https://www.datocms.com/).
2. Creare un nuovo progetto scegliendo il template **Blank** (per iniziare totalmente da zero), definendo il nome del progetto (es. `Studio datocms`), la lingua e il colore del tema.
3. Cliccare sul nuovo progetto creato e poi sul pulsante **Enter project** per accedere alla Dashboard di amministrazione.

---

## 2. Creazione Progetto Locale e Configurazione DatoCMS CLI

### Inizializzazione Locale
1. Creare la struttura dell'applicazione Next.js da terminale:

   ```bash
   npx create-next-app@latest studio-dato_cms
   ```

2. Entrare nella cartella del progetto:

   ```bash
   cd studio-dato_cms
   ```

3. Installare la CLI di DatoCMS come dipendenza di sviluppo locale:

   ```bash
   npm install --save-dev datocms
   ```


### Autenticazione e Linking CLI

4. Effettuare l'autenticazione da terminale:
   ```bash
   npx datocms login
   ```

5. Collegare la cartella locale al progetto cloud:

   ```bash
   npx datocms link
   ```

   * Selezionare l'opzione: `Log in with browser and select a project`
   * Scegliere il progetto: `Studio datocms`
   * Selezionare `NONE` come livello di log per generare il file `datocms.config.json`.

6. Verificare la connessione e stampare gli ambienti attivi:

   ```bash
   npx datocms environments:list
   ```

### Prontuario Comandi CLI

**Gestione Sessione e Link**

* `npx datocms login` — Autentica l'utente tramite browser.
* `npx datocms link` — Collega la cartella locale a un progetto DatoCMS.
* `npx datocms whoami` — Mostra l'utente attualmente connesso.

**Gestione Ambienti (Environments)**

* `npx datocms environments:list` — Elenca gli ambienti attivi (Primary e Sandbox).
* `npx datocms environments:fork <source> <target>` — Crea un ambiente sandbox partendo da uno esistente.
* `npx datocms environments:promote <id>` — Promuove un ambiente sandbox ad ambiente primario.
* `npx datocms environments:destroy <id>` — Elimina un ambiente sandbox.

**Migrazioni**

* `npx datocms migrations:new "<nome>"` — Crea uno script di migrazione nella cartella `./migrations`.
* `npx datocms migrations:run` — Applica le migrazioni pendenti sullo schema.

---

## 3. Setup Codice e Librerie Next.js

1. Installare l'SDK GraphQL client di DatoCMS e la libreria per il rendering React dei campi Structured Text:

   ```bash
   npm install @datocms/cda-client react-datocms
   ```

2. Creare il file `.env.local` nella radice di progetto con il token API recuperato da Dashboard -> Project Settings -> API Tokens -> Read-only API token:

   ```env
   NEXT_DATOCMS_API_TOKEN=tuo_read_only_api_token_qui
   ```

3. Creare il file `src/lib/datocms.js` per gestire le chiamate HTTP alla Content Delivery API:
   ```javascript
   import { executeQuery } from '@datocms/cda-client';

   export const performRequest = (query, options = {}) => {
     return executeQuery(query, {
       ...options,
       token: process.env.NEXT_DATOCMS_API_TOKEN,
     });
   };
   ```

---

## 4. Modellazione Dati (Model & Content)

### QUI ABBIAMO 2 POSSIBILI STRADE:

## 4.1. Modellazione Dati (Model & Content) tramite dashboard

### Creazione dello Schema (Model)
1. Dalla dashboard di DatoCMS, accedere a **Schema** e cliccare su **Create new model**.
2. Inserire il nome `Article bello` nel campo Name (Model ID generato: `article`).
3. Cliccare su **Add new field**, selezionare **Single-line string**, impostare Name `Title` (Field ID: `title`) e salvare.
4. Cliccare su **Add new field**, selezionare **Structured Text**, impostare Name `description` (Field ID: `description`) e salvare.

### Inserimento del Content
1. Spostarsi nella sezione **Content** nel menu in alto.
2. Cliccare su **Article bello** e poi su **New record**.
3. Compilare `Title` (es. *pincopallino*) e `description` (es. *questa è una descrizione*).
4. Cliccare **Save** e poi **Publish**.

## 4.2. Modellazione Dati (Model & Content) tramite CLI

### Creare lo Script di Migrazione

Generare un nuovo script da terminale:

```bash
npx datocms migrations:new create_article_model
```

Il comando crea un file nella cartella `./migrations/` (es. `migrations/1786028804_createArticleModel.js`). Modificare il file inserendo la logica desiderata via SDK:

```javascript
'use strict';

module.exports = async (client) => {
  // 1. Creazione del Modello (usare una api_key univoca per evitare duplicati)
  const articleModel = await client.itemTypes.create({
    name: 'Article Nuovo',
    api_key: 'article_nuovo',
  });

  // 2. Creazione del Campo Title
  await client.fields.create(articleModel, {
    label: 'Title',
    api_key: 'title',
    field_type: 'string',
    validators: { required: {} },
  });

  // 3. Creazione di un Record iniziale
  await client.items.create({
    item_type: articleModel,
    title: 'My first article!',
  });
};
```

### Esecuzione delle Migrazioni

Applicare le migrazioni pendenti sullo schema cloud:

```bash
npx datocms migrations:run
```

> **Nota:** DatoCMS crea automaticamente un ambiente Sandbox di isolamento (es. `main-post-migrations`) e applica lo script lì per proteggere l'ambiente primario (`main`).

### Risoluzione Errori Sandbox Bloccata

Se lo script fallisce (es. `VALIDATION_UNIQUENESS` per `api_key` duplicata), l'ambiente sandbox resta aperto e bloccato.
1. Eliminare l'ambiente sandbox bloccato:
   ```bash
   npx datocms environments:destroy main-post-migrations
   ```
2. Modificare la `api_key` nello script di migrazione per renderla univoca.
3. Rilanciare la migrazione:
   ```bash
   npx datocms migrations:run
   ```

### Promozione dell'Ambiente Sandbox in Produzione

Una volta verificate le modifiche nella Sandbox, promuoverla ad ambiente primario (`main`):
```bash
npx datocms environments:promote main-post-migrations
```

---

## 5. Mostrare il content presente nella dashboard nel progetto Next.js (`src/app/page.js`)

### Per mostrare il contenuto presente nella dashboard nella pagina, creiamo in src/app la nostra page.js:

* **Query GraphQL (`PAGE_CONTENT_QUERY`)**:
  * `query`: Esegue la chiamata per recuperare i dati dei modelli presenti nella dashboard.
    * `article`: Chiama il Model ID creato nello Schema.
      * `title`: Recupera la stringa del titolo.
      * `description { value }`: Estrae la struttura dati JSON (AST) necessaria per lo Structured Text.

* **Logica di Rendering (`Home`)**:
  * `const data = await performRequest(PAGE_CONTENT_QUERY)`: Chiamata asincrona eseguita lato server (Server Component di Next.js) prima dell'invio dell'HTML al browser. Recupera i dati da DatoCMS autenticandosi con il token salvato in `.env.local`.
  * `<h1>{data?.article?.title || 'Nessun titolo trovato'}</h1>`: Prende il titolo presente nella Dashboard (nello schema `title` + il suo contenuto di tipo Single-line String) e lo mostra in pagina. L'operatore fallback (`||`) mostra un testo alternativo se il campo è vuoto.
  * `{data?.article?.description && (...)}`: Controllo di sicurezza e rendering condizionale tramite optional chaining (`?.`) e operatore logico (`&&`). Verifica che la descrizione esista prima di provare a renderizzarla, evitando errori a runtime se il campo non è popolato.
  * `<StructuredText data="{data.article.description}"/>`: Passa l'oggetto JSON del campo `description` al componente di `react-datocms`, che lo converte automaticamente nei tag HTML corrispondenti (`<p>`, `<strong>`, ecc.).

#### Codice di `src/app/page.js`:

```javascript
import { performRequest } from '@/lib/datocms';
import { StructuredText } from 'react-datocms';

// Query GraphQL
const PAGE_CONTENT_QUERY = `
  query {
    article {
      title
      description {
        value
      }
    }
  }
`;

// Logica di Rendering
export default async function Home() {
  const data = await performRequest(PAGE_CONTENT_QUERY);

  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>{data?.article?.title || 'Nessun titolo trovato'}</h1>
      
      {data?.article?.description && (
        <div style={{ marginTop: '1rem' }}>
          <StructuredText data={data.article.description} />
        </div>
      )}
    </main>
  );
}
```

---

## 6. Avvio Server di Sviluppo

Avviare l'applicazione Next.js per verificare il recupero dati:
```bash
npm run dev
```
Accedere a `http://localhost:3000` per visualizzare i contenuti sincronizzati in tempo reale da DatoCMS.