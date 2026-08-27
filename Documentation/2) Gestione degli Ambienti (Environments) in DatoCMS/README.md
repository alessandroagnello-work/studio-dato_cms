# Guida Tecnica (Modulo 2): Gestione degli Ambienti (Environments) in DatoCMS

## Riferimenti Ufficiali

* **DatoCMS CLI Commands:** [https://www.datocms.com/docs/cli](https://www.datocms.com/docs/cli)
* **Content Delivery API Environments:** [https://www.datocms.com/docs/content-delivery-api/environments](https://www.datocms.com/docs/content-delivery-api/environments)

---

## 1. Il Concetto di Environment in DatoCMS

### Cosa sono e perché si usano
Nei progetti web professionali, non si effettuano mai modifiche strutturali (come aggiungere nuovi campi, rimuovere modelli o cambiare le validazioni) direttamente sul database di produzione, per evitare di rompere il sito live mentre gli utenti lo stanno navigando.

Per risolvere questo problema, DatoCMS permette di creare delle copie esatte e totalmente isolate dell'intero progetto (Schema e Contenuti) chiamate **Environments**. 

* **`main` (Primary Environment):** L'ambiente di produzione principale. È quello interrogato di default dall'applicazione live consultata dagli utenti finali.
* **`develop` (Sandbox Environment):** Un ambiente di test isolato. Qui gli sviluppatori possono modificare lo schema, lanciare script di migrazione o testare nuove funzionalità in totale sicurezza, senza rischiare di danneggiare i dati del sito in produzione.

---

## 2. Gestione degli Ambienti tramite DatoCMS CLI

### Creazione di un nuovo Ambiente Sandbox (`develop`)
Per duplicare lo stato attuale dell'ambiente primario (`main`) e creare una sandbox isolata (che chiameremo `develop`):

```bash
npx datocms environments:fork main develop
```

### Visualizzazione degli Ambienti Attivi
Per elencare tutti gli ambienti attualmente disponibili sul progetto cloud e identificare qual è l'ambiente primario attuale (contrassegnato dal tag `[primary]`):

```bash
npx datocms environments:list
```

### Promozione e Rimozione

* **Promuovere l'ambiente `develop` ad ambiente primario (`main`):**
  Quando i test nella sandbox sono conclusi con successo, possiamo sostituire l'ambiente di produzione con la sandbox selezionata.
  ```bash
  npx datocms environments:promote develop
  ```

* **Eliminare un ambiente sandbox non più necessario:**
  Rimuove definitivamente la sandbox, liberando gli slot di ambiente previsti dal piano del progetto su DatoCMS.
  ```bash
  npx datocms environments:destroy develop
  ```

---

## 3. Esecuzione dei Comandi CLI su uno Specifico Ambiente

I comandi della CLI agiscono sempre, di default, sull'ambiente primario (`main`). Per dire alla CLI di applicare uno script di migrazione direttamente sulla sandbox di sviluppo, occorre esplicitare il comando passandogli il flag `--environment`:

```bash
npx datocms migrations:run --environment=develop
```

---

## 4. Configurazione del Client Next.js per Puntare all'Ambiente `develop`

### 4.1 Come comunica Next.js con gli Ambienti di DatoCMS

Quando Next.js invia una richiesta GraphQL alla Content Delivery API (CDA) di DatoCMS, l'SDK `@datocms/cda-client` include un'opzione di configurazione denominata `environment`. 

* **Comportamento di Default:** Se la proprietà `environment` non viene specificata (o vale `undefined`), DatoCMS instrada automaticamente la chiamata verso l'ambiente **Primario** (`main`).
* **Routing Dinamico verso la Sandbox:** Specificando la proprietà `environment: 'develop'`, il client API aggiunge un header HTTP di instradamento alla richiesta GraphQL. DatoCMS intercetta questo header e restituisce lo schema e i contenuti isolati della Sandbox `develop`.

Per evitare di modificare manualmente il codice ogni volta che passiamo dallo sviluppo locale al deployment in produzione, gestiamo questo valore tramite le **variabili d'ambiente di Next.js** (`process.env`).

* **Ambiente Locale (Sviluppo):** Il file `.env.local` imposterà `NEXT_DATOCMS_ENVIRONMENT=develop`. Tutte le chiamate fatte dal nostro computer punteranno alla Sandbox.
* **Ambiente Server (Produzione / Vercel):** Non inseriremo questa variabile sul server di hosting. Risultando `undefined`, l'applicazione in produzione continuerà a servire i dati stabili dell'ambiente `main`.

---

### 4.2 Modifica File 1: `.env.local`

**Spiegazione: Dichiarazione del Token di Lettura**
Iniziamo definendo il token di sicurezza Read-Only ottenuto dalla dashboard di DatoCMS. Questo permette a Next.js di autenticarsi con le API in sola lettura.
```env
NEXT_DATOCMS_API_TOKEN=tuo_read_only_api_token_qui
```

**Spiegazione: Impostazione dell'Ambiente Sandbox**
Aggiungiamo la variabile d'ambiente per forzare le chiamate locali verso l'ambiente di test `develop`.
```env
NEXT_DATOCMS_ENVIRONMENT=develop
```

#### Ecco un codice d'esempio di `.env.local`
```env
# Token di lettura globale per l'API di DatoCMS
NEXT_DATOCMS_API_TOKEN=tuo_read_only_api_token_qui

# Nome della Sandbox di sviluppo attiva su DatoCMS
NEXT_DATOCMS_ENVIRONMENT=develop
```

---

### 4.3 Modifica File 2: `src/lib/datocms.js`

**Spiegazione: Importazione della libreria CDA**
Importiamo la funzione `executeQuery` dal pacchetto ufficiale `@datocms/cda-client` installato nel Modulo 1.
```javascript
import { executeQuery } from '@datocms/cda-client';
```

**Spiegazione: Struttura della funzione helper**
Esportiamo la funzione `performRequest` che accetta la query GraphQL e le opzioni aggiuntive (variabili, tag di revalidazione, ecc.).
```javascript
export const performRequest = (query, options = {}) => {
  return executeQuery(query, {
    ...options,
    token: process.env.NEXT_DATOCMS_API_TOKEN,
```

**Spiegazione: Iniezione dell'Ambiente Dinamico**
Aggiungiamo la voce `environment` passandole la variabile `process.env.NEXT_DATOCMS_ENVIRONMENT`. Se la variabile esiste nel file `.env.local` (in sviluppo), la chiamata interrogherà `develop`. Se la variabile non esiste (in produzione), l'SDK punterà automaticamente a `main`.
```javascript
    environment: process.env.NEXT_DATOCMS_ENVIRONMENT,
  });
};
```

#### Ecco un codice d'esempio di `src/lib/datocms.js`
```javascript
import { executeQuery } from '@datocms/cda-client';

/**
 * Funzione centralizzata per eseguire chiamate GraphQL verso DatoCMS.
 * 
 * @param {string} query - La query GraphQL da eseguire.
 * @param {Object} options - Opzioni aggiuntive (variables, revalidate, ecc.).
 * @returns {Promise<Object>} I dati restituiti dall'API di DatoCMS.
 */
export const performRequest = (query, options = {}) => {
  return executeQuery(query, {
    ...options,
    token: process.env.NEXT_DATOCMS_API_TOKEN,
    // Instrada la chiamata verso la Sandbox se definita nel file .env.local
    environment: process.env.NEXT_DATOCMS_ENVIRONMENT,
  });
};
```

---

## 5. Modellazione Visiva tramite GUI sulla Sandbox (`develop`)

Quando si lavora tramite la dashboard di DatoCMS in presenza di più ambienti, è importante assicurarsi di essere posizionati sull'ambiente sandbox prima di apportare modifiche manuali allo Schema.

### 5.1 Selezione dell'Ambiente nella Dashboard
1. In alto a sinistra nella Dashboard di DatoCMS, cliccare sul menu a discesa degli ambienti (accanto al nome del progetto).
2. Selezionare l'ambiente **`develop`**. Notare che l'interfaccia mostrerà un indicatore per segnalare che ci si trova in una Sandbox.

### 5.2 Creazione di un nuovo Campo nello Schema
Quando si aggiunge un nuovo campo a un Modello esistente o a un nuovo Modello:

1. Navigare su **Schema** e selezionare il Modello desiderato.
2. Cliccare su **Add new field**.
3. Si aprirà la schermata **Choose a field type** contenente la griglia delle tipologie di campo:
   * **Text (Giallo, in alto a sinistra):** Cliccare qui per inserire campi di testo. Si potrà poi scegliere tra *Single-line string* (titoli, brevi stringhe) o *Multiple-paragraph text* (testi lunghi/textarea).
   * **Modular content (Viola):** Per creare blocchi dinamici e complessi.
   * **Media (Verde):** Per immagini, video e file allegati.
   * **Date and time (Arancione):** Per date di eventi o pubblicazioni.
   * **SEO (Viola scuro):** Per meta tag, slug e permalink.
   * **Links (Blu):** Per creare relazioni tra modelli differenti.
4. Selezionare la tipologia desiderata (es. **Text** $\rightarrow$ **Single-line string**), assegnare il nome del campo (Field Label e API Key) e salvare.

---

## 6. Verifica dell'Integrazione in Next.js

Dopo aver configurato `.env.local` e aggiornato `src/lib/datocms.js`:

1. Avviare il server di sviluppo Next.js:
   ```bash
   npm run dev
   ```
2. Modificare un contenuto o aggiungere un campo unicamente nell'ambiente `develop` su DatoCMS.
3. Ricaricare la pagina locale (`http://localhost:3000`). Next.js leggerà correttamente i dati aggiornati provenienti dalla Sandbox `develop`, lasciando totalmente inalterato l'ambiente `main` di produzione.