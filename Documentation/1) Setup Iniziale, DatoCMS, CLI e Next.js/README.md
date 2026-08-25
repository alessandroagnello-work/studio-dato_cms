# Guida Tecnica (Modulo 1): Setup Iniziale, CLI DatoCMS e Prima Pagina Next.js

## Introduzione

### Cos'è DatoCMS?
DatoCMS è un **Headless CMS** (Content Management System "senza testa"). A differenza dei CMS tradizionali (come WordPress) che vincolano la gestione dei dati alla veste grafica del sito, un CMS *headless* si occupa esclusivamente di immagazzinare e strutturare i contenuti. Questi contenuti vengono poi esposti agli sviluppatori tramite un'API (in questo caso GraphQL). Questo approccio separa completamente il "dietro le quinte" (il database gestito dai redattori) dall'interfaccia visiva finale mostrata agli utenti.

### Perché usiamo Next.js e React con DatoCMS?
L'architettura Headless ci dà la totale libertà di scegliere come costruire l'interfaccia visiva. Scegliamo **React** (e in particolare il suo framework enterprise **Next.js**) perché ci garantisce massime prestazioni, caricamenti fulminei e un'ottimizzazione SEO nativa (grazie al Server-Side Rendering). Inoltre, DatoCMS fornisce pacchetti ufficiali come `react-datocms` che semplificano enormemente il lavoro, traducendo automaticamente i dati complessi (come i testi formattati o le immagini) in componenti React pronti all'uso.

---

## Riferimenti Ufficiali

* **DatoCMS CLI (Installazione e Comandi):** [https://www.datocms.com/docs/cli](https://www.datocms.com/docs/cli)
* **Integrazione Next.js + DatoCMS:** [https://www.datocms.com/docs/next-js](https://www.datocms.com/docs/next-js)

---

## 1. Accesso e Setup Progetto DatoCMS

1. Registrarsi sul sito ufficiale di [DatoCMS](https://www.datocms.com/).
2. Creare un nuovo progetto scegliendo il template **Blank** (per iniziare totalmente da zero). Definire il nome del progetto (es. `Corporate Web App`), la lingua di default e il colore del tema.
3. Cliccare sul nuovo progetto appena creato e poi sul pulsante **Enter project** per accedere alla Dashboard di amministrazione.

---

## 2. Creazione Progetto Locale e Configurazione DatoCMS CLI

### Cos'è la CLI e a cosa serve?
La **CLI (Command Line Interface)** è un programma che ci permette di comunicare con i server cloud di DatoCMS direttamente scrivendo comandi nel nostro terminale locale. Ci serve principalmente per tre motivi: autenticarci in modo sicuro, sincronizzare la nostra cartella di codice con il progetto online e automatizzare la creazione delle strutture dati (Schema) scrivendo degli script di codice, senza dover cliccare manualmente nella dashboard.

### Inizializzazione Locale
1. Creare la struttura base dell'applicazione Next.js da terminale:

   ```bash
   npx create-next-app@latest company-datocms-app
   ```

2. Entrare nella cartella del progetto appena generata:

   ```bash
   cd company-datocms-app
   ```

3. Installare la Command Line Interface (CLI) di DatoCMS come dipendenza di sviluppo:

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

   * Selezionare l'opzione: `Log in with browser and select a project`.
   * Scegliere il progetto creato in precedenza: `Corporate Web App`.
   * Selezionare `NONE` come livello di log. Questo genererà automaticamente il file `datocms.config.json` nella root del progetto.

6. Verificare la connessione stampando a schermo gli ambienti attivi:

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
* `npx datocms migrations:new "<nome>"` — Crea un nuovo script di migrazione nella cartella `./migrations`.
* `npx datocms migrations:run` — Applica le migrazioni pendenti sullo schema cloud.

---

## 3. Setup Codice e Librerie Next.js

Per far comunicare la nostra app Next.js con DatoCMS, iniziamo installando l'SDK ufficiale e la libreria per gestire i testi formattati:

```bash
npm install @datocms/cda-client react-datocms
```

### 3.1 Creazione del file `.env.local`
Creiamo questo nuovo file nella radice principale del progetto (allo stesso livello del file `package.json`). Ci servirà per conservare in modo sicuro la chiave di accesso alle API.
Recuperiamo il token dalla dashboard di DatoCMS andando su **Project Settings -> API Tokens -> Read-only API token** e inseriamolo nel file:

```env
NEXT_DATOCMS_API_TOKEN=tuo_read_only_api_token_qui
```

### 3.2 Creazione del file `src/lib/datocms.js`
Creiamo una nuova cartella `lib` dentro `src`, e al suo interno generiamo il file `datocms.js`.
Questo file esporterà una funzione di supporto (`performRequest`) che utilizzeremo in tutta l'applicazione per eseguire le chiamate GraphQL, agganciando automaticamente il token di sicurezza.

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

DatoCMS permette di creare la struttura dei dati (Schema) sia da interfaccia grafica sia da riga di comando. Scegliere uno dei due approcci descritti di seguito.

### 4.1 Approccio 1: Modellazione tramite Dashboard (GUI)

#### Creazione dello Schema (Model)
1. Dalla dashboard di DatoCMS, accedere a **Schema** e cliccare su **Create new model**.
2. Inserire il nome `Content` nel campo Name (il Model ID `content` verrà generato in automatico).
3. Cliccare su **Add new field**, selezionare **Single-line string**, impostare il nome su `Title` (Field ID: `title`) e salvare.
4. Cliccare su **Add new field**, selezionare **Structured Text**, impostare il nome su `description` (Field ID: `description`) e salvare.

#### Inserimento del Content
1. Spostarsi nella sezione **Content** nel menu in alto.
2. Selezionare il modello appena creato e cliccare su **New record**.
3. Compilare il campo `Title` (es. *Titolo Aziendale*) e il campo `description` (es. *Descrizione del contenuto aziendale*).
4. Cliccare **Save** e poi su **Publish** per rendere il dato disponibile via API.

---

### 4.2 Approccio 2: Modellazione tramite CLI (Script di Migrazione)

#### Creare lo script
Da terminale, generiamo un nuovo script di migrazione:

```bash
npx datocms migrations:new create_content_model
```

Il comando genererà un file nella cartella `./migrations/` (es. `migrations/1786028804_createContentModel.js`). Apriamo questo file e sostituiamo il suo contenuto con la seguente logica SDK:

```javascript
'use strict';

module.exports = async (client) => {
  // 1. Creazione del Modello
  const contentModel = await client.itemTypes.create({
    name: 'Content',
    api_key: 'content',
  });

  // 2. Creazione del Campo Title
  await client.fields.create(contentModel, {
    label: 'Title',
    api_key: 'title',
    field_type: 'string',
    validators: { required: {} },
  });

  // 3. Creazione di un Record iniziale pubblicato
  await client.items.create({
    item_type: contentModel,
    title: 'Primo contenuto aziendale',
  });
};
```

#### Esecuzione delle Migrazioni
Applichiamo lo script appena creato al nostro schema cloud:

```bash
npx datocms migrations:run
```

> **Nota di sicurezza:** DatoCMS crea automaticamente un ambiente Sandbox di isolamento (es. `main-post-migrations`) e applica lo script lì dentro, per proteggere i dati di produzione dell'ambiente primario (`main`).

#### Risoluzione Errori e Promozione
* **In caso di errore nello script** (es. `api_key` duplicata), l'ambiente sandbox rimarrà aperto. Occorre distruggerlo manualmente, correggere lo script e rilanciare la migrazione:
  ```bash
  npx datocms environments:destroy main-post-migrations
  npx datocms migrations:run
  ```
* **In caso di successo**, verifichiamo le modifiche nella Sandbox. Una volta sicuri, promuoviamo l'ambiente a primario:
  ```bash
  npx datocms environments:promote main-post-migrations
  ```

---

## 5. Mostrare il Content nel Progetto Next.js

Per visualizzare i contenuti appena creati sulla nostra pagina iniziale (struttura monolingua di base), andiamo a modificare il file di root del progetto.

### 5.1 Modifica del file `src/app/page.js`
Questo file è stato generato automaticamente da Next.js durante la fase di setup iniziale. Cancelliamo tutto il codice preimpostato di Next.js e sostituiamolo con il nostro codice personalizzato.


**Codice Sorgente Completo:**

```javascript
import { performRequest } from '@/lib/datocms';
import { StructuredText } from 'react-datocms';

// Query GraphQL
const PAGE_CONTENT_QUERY = `
  query {
    content {
      title
      description {
        value
      }
    }
  }
`;

// Logica di Rendering (Server Component)
export default async function Home() {
  const data = await performRequest(PAGE_CONTENT_QUERY);

  return (
    <main className="p-8 font-sans">
      <h1 className="text-3xl font-bold">
        {data?.content?.title || 'Nessun titolo trovato'}
      </h1>
      
      {data?.content?.description && (
        <div className="mt-4">
          <StructuredText data="{data.content.description}"/>
        </div>
      )}
    </main>
  );
}
```

Cosa fa questo script:
* **`PAGE_CONTENT_QUERY`**: È la query GraphQL per estrarre dal modello `content` la stringa del titolo e l'Abstract Syntax Tree (AST) necessario per renderizzare il campo Structured Text.
* **Componente Server**: Definiamo `Home` come funzione asincrona (`async function`) per eseguire la chiamata HTTP server-side prima che l'HTML venga inviato al browser dell'utente.
* **Rendering**: Gestiamo dei fallback in caso di campi vuoti e utilizziamo il componente `<StructuredText />` per convertire automaticamente i dati JSON avanzati di DatoCMS in tag HTML reali.

---

## 6. Avvio Server di Sviluppo

Avviare l'applicazione Next.js per verificare l'effettivo recupero dei dati:

```bash
npm run dev
```

Accedere a `http://localhost:3000` nel browser per visualizzare i contenuti sincronizzati in tempo reale da DatoCMS.