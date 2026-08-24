# Utilizzare diversi environment della propria istanza DatoCMS

## Riferimenti Ufficiali

* **DatoCMS CLI Commands:** https://www.datocms.com/docs/cli

---

## 1. Concetto di Environment in DatoCMS

DatoCMS permette di creare copie totalmente isolate dell'intero progetto (Schema e Contenuti) chiamate **Environments**:
* **`main` (Primary Environment):** L'ambiente principale utilizzato dall'applicazione in produzione.
* **`develop` (Sandbox Environment):** Un ambiente isolato di test/sviluppo per modificare lo schema o testare nuovi modelli senza rischiare di danneggiare i dati live.

---

## 2. Gestione degli Ambienti tramite DatoCMS CLI

### Creazione di un nuovo Ambiente Sandbox (`develop`)
Per duplicare l'ambiente primario (`main`) e creare una sandbox chiamata `develop`:

`npx datocms environments:fork main develop`

### Visualizzazione degli Ambienti Attivi
Per elencare tutti gli ambienti del progetto e identificare l'ambiente primario attuale:

`npx datocms environments:list`

### Promozione e Rimozione
* **Promuovere l'ambiente `develop` ad ambiente primario (`main`):**
  `npx datocms environments:promote develop`
* **Eliminare un ambiente sandbox non più necessario:**
  `npx datocms environments:destroy develop`

---

## 3. Esecuzione dei Comandi CLI su uno Specifico Ambiente

I comandi della CLI agiscono di default sull'ambiente primario. Per applicare una migrazione o un comando direttamente sull'ambiente `develop`, si specifica il flag `--environment`:

`npx datocms migrations:run --environment=develop`

---

## 4. Configurazione del Client Next.js per Puntare all'Ambiente `develop`

Per fare in modo che l'applicazione Next.js recuperi i dati dall'ambiente `develop` durante lo sviluppo locale, occorre configurare l'header di ambiente nella chiamata API.

### Step 1: Configurazione File `.env.local`
Aggiungere la variabile d'ambiente per specificare l'ambiente desiderato:

NEXT_DATOCMS_API_TOKEN=tuo_read_only_api_token_qui
NEXT_DATOCMS_ENVIRONMENT=develop

### Step 2: Aggiornamento della Funzione `performRequest` (`src/lib/datocms.js`)
Configurare l'SDK `@datocms/cda-client` aggiungendo la proprietà `environment` nelle opzioni di query:

import { executeQuery } from '@datocms/cda-client';

export const performRequest = (query, options = {}) => {
  return executeQuery(query, {
    ...options,
    token: process.env.NEXT_DATOCMS_API_TOKEN,
    environment: process.env.NEXT_DATOCMS_ENVIRONMENT,
  });
};