# Guida Tecnica (Modulo 1): Setup Iniziale, CLI DatoCMS e Prima Pagina Next.js

## Introduzione

### Cos'è DatoCMS?
DatoCMS è un **Headless CMS** (Content Management System "senza testa"). A differenza dei CMS tradizionali (come WordPress) che vincolano la gestione dei dati alla veste grafica del sito, un CMS *headless* si occupa esclusivamente di immagazzinare e strutturare i contenuti. Questi contenuti vengono poi esposti agli sviluppatori tramite un'API (in questo caso GraphQL). Questo approccio separa completamente il "dietro le quinte" (il database gestito dai redattori) dall'interfaccia visiva finale mostrata agli utenti.

### Perché usiamo Next.js e React con DatoCMS?
L'architettura Headless ci dà la totale libertà di scegliere come costruire l'interfaccia visiva. Scegliamo **React** (e in particolare il suo framework enterprise **Next.js**) perché ci garantisce massime prestazioni, caricamenti rapidi e un'ottimizzazione SEO nativa (grazie al Server-Side Rendering). Inoltre, DatoCMS fornisce pacchetti ufficiali come `react-datocms` che semplificano enormemente il lavoro, traducendo automaticamente i dati complessi (come i testi formattati o le immagini) in componenti React pronti all'uso.

---

## Riferimenti Ufficiali

* **DatoCMS CLI (Installazione e Comandi):** [https://www.datocms.com/docs/cli](https://www.datocms.com/docs/cli)
* **Integrazione Next.js + DatoCMS:** [https://www.datocms.com/docs/next-js](https://www.datocms.com/docs/next-js)

---

## 1. Accesso e Setup Progetto DatoCMS

1. Registrarsi sul sito ufficiale di [DatoCMS](https://www.datocms.com/).

2. Creare un nuovo progetto scegliendo il template **Blank**. 

3. Aggiungere il nome del progetto (es. `Corporate Web App`), la lingua di default e il colore del tema.

4. Cliccare sul nuovo progetto appena creato e poi sul pulsante **Enter project** per accedere alla Dashboard di amministrazione.

---

## 2. Creazione Progetto Locale e Configurazione DatoCMS CLI

### Cos'è la CLI e a cosa serve?
La **CLI (Command Line Interface)** è un programma che ci permette di comunicare con i server cloud di DatoCMS direttamente scrivendo comandi nel nostro terminale locale. Ci serve principalmente per tre motivi: 

1. Autenticarci in modo sicuro
2. Sincronizzare la nostra cartella di codice con il progetto online 
3. Automatizzare la creazione delle strutture dati (Schema) scrivendo degli script di codice, senza dover cliccare manualmente nella dashboard.

### Inizializzazione Locale
1. Creare la struttura base dell'applicazione Next.js da terminale:

   ```bash
   npx create-next-app@latest company-datocms-app
   ```

## Una volta inserito il comando, ti farà una serie di domande, qui sotto metto cosa rispondere:

✔ Would you like to use the recommended Next.js defaults? › No, customize settings
✔ Would you like to use TypeScript? No 
✔ Which linter would you like to use? › ESLint
✔ Would you like to use React Compiler? … No
✔ Would you like to use Tailwind CSS? Yes
✔ Would you like your code inside a `src/` directory? Yes
✔ Would you like to use App Router? (recommended) Yes
✔ Would you like to customize the import alias (`@/*` by default)? No

Opzionale:

✔ Would you like to include AGENTS.md to guide coding agents to write up-to-date Next.js code? Yes

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
   Si aprirà automaticamente una pagina nel browser con il titolo **"Authorize DatoCMS CLI"**. In questa schermata devi scegliere a quali progetti la tua riga di comando locale avrà accesso. Hai due opzioni:

   * **All projects (Scelta di default):**
     * **Perché selezionarlo?** Comodità assoluta. Se in futuro creerai altri progetti sul tuo account, il tuo terminale sarà già autorizzato a gestirli senza dover rifare questa procedura ogni volta.

   * **Only selected projects:** Dal menu a tendina selezioni solo il progetto attuale (es. *Corporate Web App*).
     * **Perché selezionarlo?** Sicurezza e isolamento (Principio del privilegio minimo). È l'opzione perfetta se gestisci decine di clienti diversi. Elimina il rischio che uno script lanciato per errore da terminale possa intaccare accidentalmente i dati o lo schema di un altro progetto.

   Dopo aver scelto, clicca su **Authorize**.

5. Collegare la cartella locale al progetto cloud:

   ```bash
   npx datocms link
   ```

   * Se il terminale te lo chiede, seleziona l'opzione: `Log in with browser and select a project` (se invece la CLI rileva già la sessione del punto 4, ti mostrerà direttamente i tuoi progetti).
   * Scegli il progetto creato in precedenza: `Corporate Web App`.
   * La CLI ti chiederà il **Level of logging** (Livello di log). Questo parametro decide quanti dettagli tecnici verranno stampati nel terminale ogni volta che la tua app comunica con le API di DatoCMS. Ecco le opzioni disponibili:

     * **`NONE` (Scelta Consigliata in Produzione/Clienti):** Non stampa nulla riguardo alle chiamate API. Mantiene il terminale pulito ed è la scelta standard per la sicurezza aziendale.
     * **`BASIC`:** Mostra solo i dettagli essenziali della richiesta (es. metodo HTTP come GET/POST, l'URL chiamato e il codice di stato della risposta come 200 OK o 404). Utile per verificare se le comunicazioni con il server vanno a buon fine.
     * **`BODY`:** Mostra le info di base più l'intero contenuto in formato JSON (payload) dei dati inviati e ricevuti. Molto utile per fare debug se uno script non funziona e vuoi vedere esattamente quali dati stai mandando a DatoCMS.
     * **`BODY_AND_HEADERS`:** Mostra tutto, inclusi gli Header HTTP. **Attenzione:** Questa opzione stampa a schermo anche i tuoi Token segreti di autorizzazione. Usala solo per debug profondi e assicurati di non incollare mai questi log su internet o in chat pubbliche.

   * **`Directory where script migrations will be stored`:** Definisce la cartella locale in cui la CLI salverà gli script programmati per aggiornare lo schema del database. Premi **Invio** per accettare il valore predefinito (`./migrations`).
   * **`API key of the DatoCMS model used to store migration data`:** Specifica l'API Key del modello tecnico che DatoCMS gestisce nel cloud per tracciare lo storico delle migrazioni. Premi **Invio** per confermare la chiave di default (`schema_migration`).
   * **`Path of the file to use as migration script template (optional)`:** Permette di impostare un file di modello personalizzato per la generazione dei nuovi script di migrazione. Trattandosi di una voce opzionale, premi **Invio** per lasciarla vuota.
   * **`Path of the tsconfig.json to use to run TS migration scripts (optional)`:** Specifica il percorso del file di configurazione TypeScript se gli script di migrazione sono in TS. Poiché il nostro progetto è configurato in JavaScript nativo, premi **Invio** per saltare questo passaggio.

   * Questo passaggio finale genererà automaticamente il file `datocms.config.json` nella root del tuo progetto locale, stabilendo il collegamento definitivo con il CMS.

   > **Consigli per la produzione:**  
   > Nei progetti destinati a un cliente o pronti per la produzione, imposta sempre **`NONE`**. Questo previene la fuga di dati sensibili (GDPR) e di Token di autorizzazione nei log di sistema aziendali (es. Vercel, AWS).  
   >  
   > **Suggerimento per il Debug:** Se durante lo sviluppo devi tracciare un bug, puoi modificare temporaneamente il file `datocms.config.json` generato nella root del progetto cambiando `"logLevel": "NONE"` in `"logLevel": "BODY"`. Una volta risolto l'errore, ricordati di ripristinare il valore su `"NONE"` prima di rilasciare il codice al cliente.

6. Verificare la connessione stampando a schermo gli ambienti attivi:

   ```bash
   npx datocms environments:list
   ```

   **Perché eseguire questo comando?**  
   Questo passaggio funge da "prova del nove" (*health check*). Ci permette di verificare immediatamente che il file `datocms.config.json` (generato nel passaggio precedente) stia funzionando e che il nostro terminale abbia i permessi corretti per comunicare in sicurezza con il database cloud di DatoCMS. 

   **Cosa apparirà a schermo?**  
   Il terminale restituirà una piccola tabella testuale contenente l'elenco degli ambienti di lavoro (*Environments*) presenti sul tuo progetto DatoCMS. 
   Se hai appena creato il progetto da zero, vedrai un'unica riga contenente l'ambiente di default, solitamente chiamato **`main`**, affiancato da un badge o da una spunta che lo identifica come ambiente primario (`Primary: yes`). 

   Se visualizzi correttamente questa tabella, significa che la tua cartella locale è perfettamente agganciata al cloud. Il setup dell'ambiente è concluso con successo!

   **Risoluzione dei Problemi (Troubleshooting):**
   Se al posto della tabella visualizzi un errore, ecco come risolverlo rapidamente:
   
   * **Errore `401 Unauthorized` (Non Autorizzato):** Significa che l'accesso è stato negato. Di solito accade se la sessione del terminale è scaduta, oppure se nel browser hai autorizzato un account DatoCMS diverso da quello proprietario del progetto. 
     * **Soluzione:** Esegui nuovamente il comando `npx datocms login`, assicurandoti di essere connesso nel browser con l'account corretto. Dopodiché, ripeti `npx datocms link`.
   
   * **Errore `404 Not Found` (Non Trovato):** Significa che la CLI è autenticata correttamente, ma non riesce a trovare il progetto specifico. Questo succede se il progetto è stato rinominato/eliminato dalla dashboard web, oppure se durante il passaggio precedente hai selezionato dalla lista un progetto a cui non hai più accesso.
     * **Soluzione:** Verifica sulla dashboard web di DatoCMS che il progetto esista ancora. Poi esegui di nuovo `npx datocms link` per forzare la rigenerazione del file di configurazione, facendo attenzione a selezionare il progetto esatto dal menu a tendina.

### Prontuario Comandi CLI (Command Line Interface)

La CLI di DatoCMS è il tuo "telecomando" per gestire il database dal terminale. Di seguito un riepilogo dei comandi fondamentali:

**1. Gestione Sessione e Progetto**
* `npx datocms login` — Autentica il tuo terminale aprendo il browser. Da fare solo la prima volta o se la sessione scade.
* `npx datocms link` — Genera il file `datocms.config.json` e collega la tua cartella locale a un progetto specifico sul cloud.
* `npx datocms whoami` — Molto utile per il debug: ti mostra l'indirizzo email dell'account attualmente connesso.

**2. Gestione Ambienti (Environments)**
In DatoCMS non si testano mai le nuove funzionalità direttamente sul database live (`main`). Si crea una copia identica (Sandbox), si fanno i test in sicurezza, e se tutto funziona, la copia diventa il nuovo ambiente ufficiale.
* `npx datocms environments:list` — Mostra la tabella con tutti gli ambienti esistenti e indica quale è attualmente il primario.
* `npx datocms environments:fork <source> <target>` — Crea un ambiente di test (*target*) clonandolo da uno esistente (*source*). Es: `npx datocms environments:fork main sviluppo`.
* `npx datocms environments:promote <id>` — Rende l'ambiente specificato (es. `sviluppo`) il nuovo ambiente primario.
* `npx datocms environments:destroy <id>` — Elimina definitivamente un ambiente sandbox per liberare spazio.
* `npx datocms environments:rename <old> <new>` — Rinomina un ambiente esistente.

**3. Migrazioni (Automazione Database)**
* `npx datocms migrations:new "<nome>"` — Genera un file vuoto nella cartella `./migrations` (es. `npx datocms migrations:new "crea_modello_articoli"`).
* `npx datocms migrations:run` — Legge i file di migrazione ed applica fisicamente le modifiche al database cloud.

**4. Comandi di Supporto**
* `npx datocms --help` — Mostra la lista completa di tutti i comandi disponibili.
* `npx datocms help <comando>` — Mostra le istruzioni dettagliate per un singolo comando.

---

## 3. Setup Codice e Librerie Next.js

Per far comunicare la nostra app Next.js con DatoCMS e mostrare a schermo i contenuti in modo ottimizzato, dobbiamo installare due pacchetti fondamentali. 

Apri il terminale (assicurati di essere all'interno della cartella del progetto `company-datocms-app`) ed esegui:

```bash
npm install @datocms/cda-client react-datocms
```

**A cosa servono esattamente questi due pacchetti?**

Lavorano in tandem: uno si occupa di *recuperare* i dati, l'altro di *disegnarli* a schermo.

* **`@datocms/cda-client` (Il Motore di Lettura):** 
  "CDA" sta per *Content Delivery API*. Questo pacchetto è il client ufficiale di DatoCMS per interrogare il database in "sola lettura". Lo useremo all'interno dei nostri *Server Components* per inviare le query GraphQL in modo pulito ed efficiente. 
  * *Perché lo usiamo?* Potremmo usare il `fetch` nativo di JavaScript, ma questo pacchetto ufficiale ci semplifica la vita: gestisce in automatico gli header di autorizzazione, formatta correttamente le richieste GraphQL e ci restituisce errori molto più chiari.

* **`react-datocms` (Il Costruttore Visivo):** 
  Quando scarichiamo i dati da DatoCMS, a volte riceviamo strutture complesse. Questa libreria ci fornisce dei componenti React già pronti per gestire questi casi:
  * **`<Image/>`**: Prende i dati dell'immagine dal CMS e crea un tag HTML perfetto con lazy-loading, responsive e blur-up nativo.
  * **`<StructuredText/>`**: Prende i testi formattati scritti dai redattori sul CMS (grassetti, corsivi, elenchi puntati, link) e li traduce automaticamente in HTML sicuro e ben strutturato.

### 3.1 Creazione del file `.env.local`
Creiamo questo nuovo file nella radice principale del progetto (allo stesso livello del file `package.json`). Ci servirà per conservare in modo sicuro la chiave di accesso alle API.
Recuperiamo il token dalla dashboard di DatoCMS andando su **Project Settings -> API Tokens -> Read-only API token** e inseriamolo nel file:

```env
NEXT_DATOCMS_API_TOKEN=tuo_read_only_api_token_qui
```

### 3.2 Creazione del file `src/lib/datocms.js` (Il "Motore" delle Query)

In un progetto Next.js strutturato, è considerata una pessima pratica scrivere le chiavi API o le configurazioni di rete direttamente nei file delle pagine. Per questo motivo, centralizziamo la logica di comunicazione.

Crea una nuova cartella chiamata `lib` (abbreviazione di *library*) all'interno di `src/`. Al suo interno, crea il file `datocms.js` e incolla questo codice:

```javascript
import { executeQuery } from '@datocms/cda-client';

export const performRequest = (query, options = {}) => {
  return executeQuery(query, {
    ...options,
    token: process.env.NEXT_DATOCMS_API_TOKEN,
  });
};
```

**Come funziona questo Helper e perché è fondamentale:**
Abbiamo appena creato una funzione personalizzata (`performRequest`) che farà da "ponte" tra la nostra app e DatoCMS.
* **`query`**: È la stringa GraphQL che passeremo di volta in volta dalle nostre pagine (es. dammi il titolo, dammi le immagini).
* **`token: process.env.NEXT_DATOCMS_API_TOKEN`**: Aggancia automaticamente in modo invisibile e sicuro il nostro Token di Sola Lettura a ogni singola chiamata. Non dovremo mai più preoccuparci di inserirlo a mano.
* **`options = {}`**: Questo è il vero "jolly". Se non passiamo nulla, è un oggetto vuoto. Ma ci permette, quando serve, di iniettare parametri extra in specifiche pagine (es. `{ variables: { locale: 'it' } }` o `{ includeDrafts: true }`).

Tuttavia, *potresti* decidere di modificarlo in base alle esigenze del cliente o per funzionalità più avanzate:
1. **Per specificare un ambiente (Sandbox):** Aggiungendo `environment: process.env.NEXT_DATOCMS_ENVIRONMENT`.
2. **Per gestire la Cache globale di Next.js:** Aggiungendo le direttive `next: { revalidate: 60 }`.

**Esempi:**
* **Approccio Globale (Modificando il file):**
  ```javascript
  export const performRequest = (query, options = {}) => {
    return executeQuery(query, {
      ...options,
      token: process.env.NEXT_DATOCMS_API_TOKEN,
      requestInitOptions: { next: { revalidate: 60 } } 
    });
  };
  ```
* **Approccio Dinamico:**
  ```javascript
  const data = await performRequest(HOMEPAGE_QUERY, {
    requestInitOptions: {
      next: { revalidate: 60 }
    }
  });
  ```

---

## 4. Modellazione Dati (Model & Content)

DatoCMS permette di creare la struttura dei dati (Schema) sia da interfaccia grafica sia da riga di comando. Scegliere uno dei due approcci descritti di seguito.

### 4.1 Approccio 1: Modellazione tramite Dashboard (GUI)

#### Creazione dello Schema (Model)
1. Dalla dashboard di DatoCMS, accedere a **Schema** e cliccare su **Create new model**.
2. Inserire il nome `Content` nel campo Name (il Model ID `content` verrà generato in automatico) e salvare.
3. Ora clicchiamo su **Add new field** per aggiungere le colonne al nostro modello. Tipologie disponibili:
   * **Text (Giallo con icona A=):** Per campi testuali.
   * **Modular content (Viola):** Per strutture dati dinamiche a blocchi.
   * **Media (Verde):** Per immagini, video, PDF.
   * **Date and time (Arancione):** Per date o orari.
   * **Number (Blu):** Per prezzi o quantità.
   * **Boolean (Rosso):** Per interruttori VERO/FALSO.
   * **Location (Verde):** Per coordinate geografiche.
   * **Color (Rosa):** Per valori Hex/RGB.
   * **SEO (Viola scuro):** Per permalink e meta-tag.
   * **Links (Blu):** Per relazioni tra modelli.
   * **JSON (Verde):** Per metadata JSON grezzi.

> **Differenza fondamentale nei tipi di Testo (`Text`):**
> * **Single-line string:** Testo a riga singola senza a capo (titoli, nomi).
> * **Multiple-paragraph text:** Testo multi-riga senza formattazione avanzata.
> * **Structured Text:** Campo speciale in formato JSON AST (Abstract Syntax Tree), pensato per testi formattati complessi (titoli, grassetti, elenchi, link e blocchi integrati).

4. **Creazione Campo Title:** Cliccare su **Text** -> **Single-line string**, impostare Name su `Title` (Field ID: `title`) e salvare.
5. **Creazione Campo Description:** Cliccare su **Add new field**, selezionare **Text** -> **Structured Text**, impostare il nome su `Description` (Field ID: `description`) e salvare.

#### Inserimento del Content
1. Spostarsi nella sezione **Content** nel menu in alto.
2. Selezionare il modello `Content` e cliccare su **New record**.
3. Compilare il campo `Title` (es. *Primo contenuto aziendale*) e il campo `description` con un testo formattato.
4. Cliccare **Save** e poi su **Publish** per rendere il dato disponibile via API.

---

### 4.2 Approccio 2: Modellazione tramite CLI (Script di Migrazione)

Oltre all'interfaccia grafica, possiamo definire la nostra struttura dati scrivendo codice in JavaScript. Questo approccio ("Infrastructure as Code") è ideale per versionare le modifiche al database su Git e replicarle in automatico tra vari ambienti.

**Generazione dello script**  
Da terminale, eseguiamo il comando per creare il file:

```bash
npx datocms migrations:new create_content_model
```

**Struttura dello script e personalizzazione**  
Aprendo il file generato dentro la cartella `./migrations/` (es. `1786028804_createContentModel.js`), noterai che DatoCMS include un codice di esempio basato su un modello fittizio chiamato `Article` (`articleModel`).

Per adattare la migrazione al nostro progetto, sostituiamo le variabili di esempio con il nostro modello **`Content`** (o con qualsiasi altro nome tu debba creare in futuro, es. *Product*, *Project*, *FAQ*).

**Creazione del Modello (Tabella)**  
All'interno della funzione, il primo passo è creare il Modello (che fungerà da contenitore/tabella). Sostituiamo l'esempio predefinito salvando la risposta in una variabile JavaScript a nostra scelta: in questo caso usiamo `contentModel` (puoi rinominarla a piacere in base alle tue preferenze, l'importante è riutilizzare lo stesso nome della variabile nei passaggi successivi dello script per collegare campi e record).

```javascript
'use strict';

/** @param client { import("datocms/lib/cma-client-node").Client } */
module.exports = async (client) => {
  // Creazione del Modello (Content)
  const contentModel = await client.itemTypes.create({
    name: 'Content',
    api_key: 'content',
  });
};
```

**Anatomia dei tre livelli di identificazione:**
* **Nome della variabile JS (`const contentModel`)**: È il riferimento interno allo script JavaScript. Serve esclusivamente a te per memorizzare il modello in memoria e passarlo alle chiamate successive (`client.fields.create`).
* **`name`**: L'etichetta visibile nell'interfaccia grafica per i redattori (es. `Content`, `Articolo`, `Pagina Chi Siamo`). Può contenere spazi, maiuscole e caratteri speciali.
* **`api_key`**: L'identificatore tecnico univoco usato da GraphQL nelle chiamate da Next.js (es. `content`). Deve essere scritto sempre in minuscolo, senza spazi o caratteri speciali.

**Creazione dei Campi (Proprietà della Tabella)**  
Una volta creato il Modello (il contenitore), dobbiamo definirne la struttura aggiungendo i singoli campi. Utilizziamo il metodo `client.fields.create`, passando come primo argomento il modello di destinazione (`contentModel`) e come secondo argomento l'oggetto con le configurazioni del campo. 

In questo esempio creiamo sia il campo **Title** (stringa breve) sia il campo **Description** (Structured Text per supporto al testo formattato):

```javascript
  // 1. Campo Titolo
  await client.fields.create(contentModel, {
    label: 'Title',
    api_key: 'title',
    field_type: 'string',
    validators: {
      required: {},
    },
  });

  // 2. Campo Descrizione (Structured Text)
  await client.fields.create(contentModel, {
    label: 'Description',
    api_key: 'description',
    field_type: 'structured_text',
    validators: {
      required: {},
    },
  });
```

**Parametri di configurazione:**
* **`contentModel`:** Il riferimento al modello a cui agganciare il campo.
* **`label`:** L'etichetta visibile nell'interfaccia grafica per i redattori (es. *Title*, *Description*).
* **`api_key`:** L'identificatore univoco usato da Next.js per recuperare il valore nelle query GraphQL.
* **`field_type`:** Determina la natura del dato che il CMS accetterà. Usiamo `'string'` per un testo breve a riga singola e `'structured_text'` per testo formattato. Altri valori comuni per `field_type` sono:
  * `'text'` — Testo multiriga senza formattazione.
  * `'structured_text'` — Testo formattato complesso (Rich Text con titoli, elenchi e link).
  * `'file'` o `'gallery'` — Immagine/documento o galleria.
  * `'boolean'` — Interruttore True/False.
  * `'date_time'` — Data e ora.
* **`validators`:** Imposta le regole di controllo del CMS prima del salvataggio (`required: {}`).

> **Nota sui Validatori:** Oltre a `required: {}`, puoi aggiungere altre regole nello stesso oggetto, come `unique: {}` o `length: { min: 5, max: 100 }`.

**Esempio pratico di validazione avanzata (Campo Slug/URL):**
```javascript
  await client.fields.create(contentModel, {
    label: 'Slug',
    api_key: 'slug',
    field_type: 'string',
    validators: {
      required: {},
      unique: {},
      length: { min: 3, max: 50 },
    },
  });
```

**Inserimento di un Record di Prova (Data Seeding)**  
Oltre a definire la struttura, gli script di migrazione permettono di inserire dei dati iniziali nel database cloud (*seeding*):

```javascript
  await client.items.create({
    item_type: contentModel,
    title: 'Primo contenuto aziendale',
    description: 'Questa è la descrizione di prova del nostro primo contenuto aziendale.',
  });
```

**Anatomia dei parametri:**
* **`client.items.create()`:** Genera una nuova voce di contenuto (*Record*) su DatoCMS.
* **`item_type: contentModel`:** Indica a DatoCMS in quale tabella inserire questo dato.
* **`title` e `description`:** Definiscono i valori dei rispettivi campi (le chiavi devono combaciare con le `api_key`).

> **Consiglio Operativo:** Inserire record nelle migrazioni è opzionale, ma utilissimo durante lo sviluppo per avere subito dati reali senza doverli inserire a mano dalla dashboard. I record nascono di default in stato di **Bozza (Draft)**.

#### Codice d'esempio dello script di migrazione completo

```javascript
'use strict';

module.exports = async (client) => {
  // 1. Creazione del Modello (Content)
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

  // 3. Creazione del Campo Description (Structured Text)
  await client.fields.create(contentModel, {
    label: 'Description',
    api_key: 'description',
    field_type: 'structured_text',
    validators: { required: {} },
  });

  // 4. Creazione di un Record iniziale di prova
  await client.items.create({
    item_type: contentModel,
    title: 'Primo contenuto aziendale',
    description: 'Questa è la descrizione di prova del nostro primo contenuto aziendale.',
  });
};
```

#### Esecuzione delle Migrazioni
Una volta salvato il file, applichiamo lo script al nostro schema cloud digitando nel terminale:

```bash
npx datocms migrations:run
```

> **Nota di sicurezza:** DatoCMS crea automaticamente un ambiente Sandbox di isolamento (es. `main-post-migrations`) e applica lo script lì dentro, per proteggere i dati di produzione dell'ambiente primario (`main`).

#### Risoluzione Errori, Ispezione e Promozione

* **In caso di errore nello script o modifica PRIMA della promozione:**  
  Se hai eseguito `migrations:run` ma ti accorgi di un errore o di un campo mancante, l'ambiente Sandbox appena creato (`main-post-migrations`) è attivo.  
  1. Elimina l'ambiente Sandbox generato dall'esecuzione incompleta:
     ```bash
     npx datocms environments:destroy main-post-migrations
     ```
  2. Apri lo script locale, correggi il codice e rilancia:
     ```bash
     npx datocms migrations:run
     ```

* **Dimenticanza di una colonna DOPO aver già promosso l'ambiente a primario:**  
  Se hai già promosso la Sandbox, crea un secondo file di migrazione dedicato all'aggiunta del campo mancante:
  1. Genera uno script di modifica schema:
     ```bash
     npx datocms migrations:new add_description_to_content
     ```
  2. Recupera il modello ed esegui `fields.create`:
     ```javascript
     module.exports = async (client) => {
       const contentModel = await client.itemTypes.find('content');
       await client.fields.create(contentModel, {
         label: 'Description',
         api_key: 'description',
         field_type: 'structured_text',
       });
     };
     ```
  3. Esegui la nuova migrazione:
     ```bash
     npx datocms migrations:run
     ```

* **In caso di successo (Ispezione, Promozione e Ripristino del nome `main`):**  
  1. **Ispezione sulla Dashboard:** Vai su DatoCMS, seleziona l'ambiente `main-post-migrations` e verifica che il modello `Content` ed i campi `title` e `description` siano stati creati.
  2. **Promozione in Produzione:** Promuovi la Sandbox ad ambiente primario:
     ```bash
     npx datocms environments:promote main-post-migrations
     ```
  3. **Rollback di Emergenza:** Se noti problemi immediati in produzione, puoi tornare allo stato precedente ri-promuovendo il vecchio `main`:
     ```bash
     npx datocms environments:promote main
     ```
  4. **Pulizia e Rinominazione in `main`:** Quando sei sicuro che il nuovo ambiente funzioni, cancella il vecchio backup e rinomina l'ambiente primario corrente in `main`:
     ```bash
     npx datocms environments:destroy main
     npx datocms environments:rename main-post-migrations main
     ```

---

## 5. Mostrare il Content nel Progetto Next.js

Per visualizzare i contenuti appena creati sulla nostra pagina iniziale, andiamo a modificare il file di root del progetto (`src/app/page.js`).

### 5.1 Modifica del file `src/app/page.js`

In Next.js (App Router), i file creati nella cartella `app` sono di default **Server Components**. Il codice viene eseguito esclusivamente sul server Node.js: le chiamate a DatoCMS avvengono prima di generare l'HTML, senza esporre token nel browser dell'utente.

---

#### Step 1: Import delle librerie

```javascript
import { performRequest } from '@/lib/datocms';
import { StructuredText } from 'react-datocms';
```

**Cosa fanno i singoli elementi:**
* **`performRequest`**: È la funzione helper che abbiamo creato in `src/lib/datocms.js`. Si occupa di inviare la richiesta HTTP a DatoCMS iniettando automaticamente il token di autenticazione API.
* **`StructuredText`**: È il componente React preconfezionato fornito dal pacchetto `react-datocms`. Trasforma il formato dati JSON inviato da DatoCMS per i campi di testo formattato in veri tag HTML semantici (`<p>`, `<h1>`, `<ul>`, `<a>`).

---

#### Step 2: Definizione della Query GraphQL

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

**Cosa fanno i singoli elementi:**
* **`query { ... }`**: Dichiara a DatoCMS che stiamo effettuando un'operazione di sola lettura (fetch dei dati).
* **`content`**: È l'entry-point generato automaticamente da DatoCMS a partire dalla `api_key` del modello (`content`).
* **`title`**: Richiede il valore del campo titolo (stringa semplice).
* **`description`**: Richiede il campo descrizione.
* **`value`**: Trattandosi di un campo *Structured Text*, il testo non viene inviato come semplice stringa, ma come albero JSON (AST). Chiedere `{ value }` serve ad estrarre questa mappa di nodi formattati per React.

---

#### Step 3: Il Server Component e la Chiamata Dati

```javascript
export default async function Home() {
  const data = await performRequest(PAGE_CONTENT_QUERY);
```

**Cosa fanno i singoli elementi:**
* **`export default async function Home()`**: Dichiara il componente di pagina React come funzione asincrona per abilitare l'uso di `await`.
* **`await performRequest(PAGE_CONTENT_QUERY)`**: Mette in pausa l'esecuzione del Server Component finché DatoCMS non risponde con i dati richiesti.
* **`const data`**: La variabile che conterrà la risposta speculare alla query GraphQL (`data.content.title` e `data.content.description`).

---

#### Step 4: Rendering e Gestione dei Fallback

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

**Cosa fanno i singoli elementi:**
* **`data?.content?.title`**: L'operatore Optional Chaining (`?.`) evita crash se i dati dovessero essere `null` o `undefined`.
* **`|| 'Nessun titolo trovato'`**: Valore di fallback se il titolo su DatoCMS è vuoto.
* **`{data?.content?.description && (...)}`**: Controllo condizionale per renderizzare il `<div>` solo se il campo `description` è compilato.
* **`<StructuredText data="{data.content.description}"/>`**: Passa l'AST al componente `StructuredText` per convertirlo automaticamente in HTML visibile sul browser.

---

#### Codice d'esempio completo di `src/app/page.js`

```javascript
import { performRequest } from '@/lib/datocms';
import { StructuredText } from 'react-datocms';

// 1. Query GraphQL: Definiamo i dati da richiedere a DatoCMS
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

// 2. Componente di Pagina (Server Component)
export default async function Home() {
  // Chiamata asincrona al CMS
  const data = await performRequest(PAGE_CONTENT_QUERY);

  // Layout HTML restituito al browser
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