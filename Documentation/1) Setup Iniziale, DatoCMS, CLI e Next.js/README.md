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
2. Inserire il nome `Content` nel campo Name (il Model ID `content` verrà generato in automatico) e salvare.
3. Ora clicchiamo su **Add new field** per aggiungere le colonne al nostro modello. Si aprirà la schermata **Choose a field type** con le seguenti tipologie di campi disponibili:

   * **Text (Giallo con icona A=, in alto a sinistra):** Cliccare qui per inserire campi testuali. Una volta cliccato, si aprirà un'ulteriore scelta per definire il tipo di testo desiderato.
   * **Modular content (Viola con blocchi):** Per creare strutture dati dinamiche a blocchi riutilizzabili.
   * **Media (Verde con icona immagine):** Per immagini, video, PDF e allegati.
   * **Date and time (Arancione con calendario):** Per date di eventi o orari.
   * **Number (Blu con '123'):** Per ID numeri d'ordine, prezzi o quantità.
   * **Boolean (Rosso 'Y/N'):** Per interruttori VERO/FALSO (Sì/No).
   * **Location (Verde con globo):** Per coordinate geografiche (latitudine e longitudine).
   * **Color (Rosa con contagocce):** Per valori cromatici RGB/Hex.
   * **SEO (Viola scuro con tag):** Per permalink, slug e meta-tag ottimizzati per i motori di ricerca.
   * **Links (Blu con rettangoli collegati):** Per definire relazioni tra modelli differenti.
   * **JSON (Verde con `{...}`):** Per metadata personalizzati in formato JSON grezzo.

> **Differenza fondamentale nei tipi di Testo (`Text`):**
> Dopo aver cliccato sull'icona **Text** (Giallo), il sistema chiederà di specificare il formato del testo. È fondamentale scegliere quello corretto in base all'utilizzo finale:
> * **Single-line string:** Campo di testo a riga singola. È ideale per stringhe brevi senza interruzioni di riga (es. titoli, nomi, etichette).
> * **Multiple-paragraph text (Multiple-line string):** Campo di testo multi-riga. È adatto per descrizioni estese, biografie o testi lunghi che richiedono gli "a capo" ma *nessuna* formattazione complessa.
> * **Structured Text:** Campo speciale in formato JSON AST (Abstract Syntax Tree), pensato per testi formattati complessi (titoli H1-H6, grassetti, elenchi, link e blocchi integrati).

4. **Creazione Campo Title:** Cliccare sull'icona **Text**, selezionare **Single-line string**, impostare il campo Name su `Title` (Field ID: `title`) e salvare.
5. **Creazione Campo Description:** Cliccare nuovamente su **Add new field**, selezionare **Text** -> **Structured Text** (oppure *Multiple-paragraph text* per un semplice testo lungo), impostare il nome su `description` (Field ID: `description`) e salvare.

#### Inserimento del Content
1. Spostarsi nella sezione **Content** nel menu in alto.
2. Selezionare il modello appena creato e cliccare su **New record**.
3. Compilare il campo `Title` (es. *Titolo*) e il campo `description` (es. *Ciao, sono una descrizione!*).
4. Cliccare **Save** e poi su **Publish** per rendere il dato disponibile via API.

---

### 4.2 Approccio 2: Modellazione tramite CLI (Script di Migrazione)

Oltre all'interfaccia grafica, possiamo definire la nostra struttura dati scrivendo codice in JavaScript. Questo approccio è utile per replicare le configurazioni in modo automatico.

**Generazione dello script**
Da terminale, eseguiamo un comando che creerà un file vuoto all'interno della cartella `./migrations/` del nostro progetto.
```bash
npx datocms migrations:new create_content_model
```

**La struttura base della migrazione**
Aprendo il file appena generato (es. `1786028804_createContentModel.js`), troveremo l'esportazione di una funzione asincrona. Questa funzione riceve l'oggetto `client`, che contiene tutti i metodi per comunicare con l'API di DatoCMS.
```javascript
'use strict';

module.exports = async (client) => {
  // Il codice per creare il modello e i campi andrà qui
};
```

**Creazione del Modello (Tabella)**
All'interno della funzione, il primo passo è creare il Modello (che fungerà da contenitore/tabella). Usiamo il metodo `client.itemTypes.create`, assegnandogli un nome visibile (`Content`) e una chiave API per richiamarlo (`content`). Salviamo il risultato nella variabile `contentModel`.
```javascript
  const contentModel = await client.itemTypes.create({
    name: 'Content',
    api_key: 'content',
  });
```

**Creazione del Campo**
Ora che abbiamo il contenitore, aggiungiamo una "colonna". Utilizziamo `client.fields.create` agganciandolo al `contentModel` appena creato. Definiamo che sarà un campo di testo stringa (`field_type: 'string'`) chiamato "Title", e aggiungiamo un validatore per renderlo obbligatorio.
```javascript
  await client.fields.create(contentModel, {
    label: 'Title',
    api_key: 'title',
    field_type: 'string',
    validators: { required: {} },
  });
```

**Inserimento di un Record (Contenuto)**
Per comodità, possiamo far sì che lo script inserisca automaticamente anche un primo contenuto testuale, così da non avere un database vuoto. Usiamo `client.items.create` passandogli il riferimento al modello e il valore del campo titolo.
```javascript
  await client.items.create({
    item_type: contentModel,
    title: 'Primo contenuto aziendale',
  });
```

#### Ecco un codice d'esempio dello script di migrazione completo
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
Una volta salvato il file, applichiamo lo script al nostro schema cloud digitando nel terminale:

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

Per visualizzare i contenuti appena creati sulla nostra pagina iniziale (struttura monolingua di base), andiamo a modificare il file di root del progetto (`src/app/page.js`).

### 5.1 Modifica del file `src/app/page.js`

**Import delle librerie**
Iniziamo importando la nostra funzione helper `performRequest` per eseguire chiamate GraphQL verso DatoCMS, e il componente `<StructuredText/>` fornito da `react-datocms` per renderizzare automaticamente i campi di testo strutturato.
```javascript
import { performRequest } from '@/lib/datocms';
import { StructuredText } from 'react-datocms';
```

**Definizione della Query GraphQL**
Definiamo la stringa di query GraphQL `PAGE_CONTENT_QUERY`. Chiediamo a DatoCMS di restituirci il campo `title` e l'AST del campo `description` compresi nel modello `content`.
```javascript
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
```

**Il Server Component e la Chiamata Dati**
Trattandosi di un Server Component asincrono (`async function Home`), eseguiamo la chiamata tramite `await performRequest(PAGE_CONTENT_QUERY)`. I dati vengono recuperati direttamente sul server prima che l'HTML venga inviato al client.
```javascript
export default async function Home() {
  const data = await performRequest(PAGE_CONTENT_QUERY);
```

**Rendering e Gestione dei Fallback**
All'interno del JSX restituito, mostriamo il titolo estratto dai dati (gestendo un valore di fallback se vuoto). Se il campo `description` esiste, utilizziamo il componente `<StructuredText data="{data.content.description}"/>` per trasformare l'AST in vero codice HTML.
```javascript
  return (
    <main className="p-8 font-sans">
      <h1 className="text-3xl font-bold">
        {data?.content?.title || 'Nessun titolo trovato'}
      </h1>
      
      {data?.content?.description && (
        <div className="mt-4">
          <StructuredText data={data.content.description} />
        </div>
      )}
    </main>
  );
}
```

#### Ecco un codice d'esempio completo di `src/app/page.js`
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
          <StructuredText data={data.content.description} />
        </div>
      )}
    </main>
  );
}
```

---

## 6. Avvio Server di Sviluppo

Avviare l'applicazione Next.js per verificare l'effettivo recupero dei dati:

```bash
npm run dev
```

Accedere a `http://localhost:3000` nel browser per visualizzare i contenuti sincronizzati in tempo reale da DatoCMS.