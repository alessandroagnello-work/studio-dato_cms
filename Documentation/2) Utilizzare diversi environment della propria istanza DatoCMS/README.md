# Guida Tecnica: Gestione degli Ambienti (Environments) in DatoCMS

## Riferimenti Ufficiali

* **DatoCMS CLI Commands:** [https://www.datocms.com/docs/cli](https://www.datocms.com/docs/cli)
* **Content Delivery API Environments:** [https://www.datocms.com/docs/content-delivery-api/environments](https://www.datocms.com/docs/content-delivery-api/environments)

---

## 1. Concetto di Environment in DatoCMS

DatoCMS permette di creare copie totalmente isolate dell'intero progetto (Schema e Contenuti) chiamate **Environments**. Questo sistema evita di lavorare direttamente sui dati in produzione durante la fase di sviluppo o test.

* **`main` (Primary Environment):** L'ambiente di produzione principale utilizzato dall'applicazione live consultata dagli utenti finali.
* **`develop` (Sandbox Environment):** Un ambiente isolato di test e sviluppo per modificare lo schema, creare nuovi modelli o testare nuove funzionalità senza rischiare di danneggiare i dati live.

---

## 2. Gestione degli Ambienti tramite DatoCMS CLI

### Creazione di un nuovo Ambiente Sandbox (`develop`)
Per duplicare lo stato attuale dell'ambiente primario (`main`) e creare una sandbox isolata chiamata `develop`:

```bash
npx datocms environments:fork main develop
```

### Visualizzazione degli Ambienti Attivi
Per elencare tutti gli ambienti del progetto e identificare l'ambiente primario attuale (contrassegnato da `[primary]`):

```bash
npx datocms environments:list
```

### Promozione e Rimozione

* **Promuovere l'ambiente `develop` ad ambiente primario (`main`):**
  Sostituisce l'ambiente di produzione con la sandbox selezionata.
  ```bash
  npx datocms environments:promote develop
  ```

* **Eliminare un ambiente sandbox non più necessario:**
  Rimuove la sandbox liberando slot di ambiente sul progetto.
  ```bash
  npx datocms environments:destroy develop
  ```

---

## 3. Esecuzione dei Comandi CLI su uno Specifico Ambiente

I comandi della CLI agiscono di default sull'ambiente primario (`main`). Per applicare uno script di migrazione direttamente sulla sandbox `develop`, occorre esplicitare il flag `--environment`:

```bash
npx datocms migrations:run --environment=develop
```

---

## 4. Configurazione del Client Next.js per Puntare all'Ambiente `develop`

Per fare in modo che l'applicazione Next.js in locale recuperi i dati dall'ambiente sandbox `develop` invece che da `main`, occorre configurare la variabile d'ambiente nel progetto ed esplicitarla nel client API.

### Step 1: Configurazione File `.env.local`
Aggiungere la variabile d'ambiente `NEXT_DATOCMS_ENVIRONMENT` indicando il nome della sandbox desiderata:

```env
NEXT_DATOCMS_API_TOKEN=tuo_read_only_api_token_qui
NEXT_DATOCMS_ENVIRONMENT=develop
```

### Step 2: Aggiornamento della Funzione `performRequest` (`src/lib/datocms.js`)
Configurare l'SDK `@datocms/cda-client` aggiungendo la proprietà `environment` nelle opzioni di query. Se la variabile non viene definita (es. in produzione), DatoCMS utilizzerà automaticamente l'ambiente primario `main`.

```javascript
import { executeQuery } from '@datocms/cda-client';

export const performRequest = (query, options = {}) => {
  return executeQuery(query, {
    ...options,
    token: process.env.NEXT_DATOCMS_API_TOKEN,
    environment: process.env.NEXT_DATOCMS_ENVIRONMENT,
  });
};
```