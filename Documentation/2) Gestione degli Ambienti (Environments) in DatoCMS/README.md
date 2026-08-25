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

### 4.1 La Teoria: Come comunica Next.js con gli Ambienti di DatoCMS

Quando Next.js invia una richiesta GraphQL alla Content Delivery API (CDA) di DatoCMS, l'SDK `@datocms/cda-client` include un'opzione di configurazione denominata `environment`. 

* **Comportamento di Default:** Se la proprietà `environment` non viene specificata (o vale `undefined`), DatoCMS instrada automaticamente la chiamata verso l'ambiente **Primario** (`main`).
* **Routing Dinamico verso la Sandbox:** Specificando la proprietà `environment: 'develop'`, il client API aggiunge un header HTTP di instradamento alla richiesta GraphQL. DatoCMS intercetta questo header e restituisce lo schema e i contenuti isolati della Sandbox `develop`.

Per evitare di modificare manualmente il codice ogni volta che passiamo dallo sviluppo locale al deployment in produzione, gestiamo questo valore tramite le **variabili d'ambiente di Next.js** (`process.env`).

* **Ambiente Locale (Sviluppo):** Il file `.env.local` imposterà `NEXT_DATOCMS_ENVIRONMENT=develop`. Tutte le chiamate fatte dal nostro computer punteranno alla Sandbox.
* **Ambiente Server (Produzione / Vercel):** Non inseriremo questa variabile sul server di hosting. Risultando `undefined`, l'applicazione in produzione continuerà a servire i dati stabili dell'ambiente `main`.

---

### 4.2 Modifica File 1: `.env.local`

Questo file è stato creato nel Modulo 1 e risiede nella radice del progetto. Essendo ignorato da Git (`.gitignore`), è il posto perfetto per definire impostazioni specifiche per la nostra macchina locale.

**Azione:** Aprire il file `.env.local` e aggiungere la variabile `NEXT_DATOCMS_ENVIRONMENT`.

**Codice Sorgente Completo (`.env.local`):**

```env
# Token di lettura globale per l'API di DatoCMS
NEXT_DATOCMS_API_TOKEN=tuo_read_only_api_token_qui

# Nome della Sandbox di sviluppo attiva su DatoCMS
NEXT_DATOCMS_ENVIRONMENT=develop
```

---

### 4.3 Modifica File 2: `src/lib/datocms.js`

Questo file (creato nel Modulo 1) centralizza la funzione `performRequest` utilizzata in tutte le pagine dell'applicazione per eseguire le query GraphQL.

**Azione:** Aggiornare la funzione passandole la nuova opzione `environment`.

**Analisi delle Modifiche:**
Iniettando `environment: process.env.NEXT_DATOCMS_ENVIRONMENT` dentro le opzioni di `executeQuery`, l'SDK leggerà automaticamente la variabile definita al punto 4.2. Se la variabile esiste (in locale), le query punteranno a `develop`; se non esiste (in produzione), l'SDK ignorerà la voce e punterà a `main`.

**Codice Sorgente Completo (`src/lib/datocms.js`):**

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