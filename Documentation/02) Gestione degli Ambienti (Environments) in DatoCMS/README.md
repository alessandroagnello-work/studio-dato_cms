# Guida Tecnica (Modulo 2): Gestione degli Ambienti (Environments) in DatoCMS

## Riferimenti Ufficiali

* **DatoCMS CLI Commands:** [https://www.datocms.com/docs/cli](https://www.datocms.com/docs/cli)
* **Content Delivery API Environments:** [https://www.datocms.com/docs/content-delivery-api/environments](https://www.datocms.com/docs/content-delivery-api/environments)
* **Content Management API (Items):** [https://www.datocms.com/docs/content-management-api/resources/item](https://www.datocms.com/docs/content-management-api/resources/item)

---

## 1. Il Concetto di Environment in DatoCMS

### Cosa sono e perché si usano
Nei progetti web professionali non si effettuano modifiche strutturali (come aggiungere campi o modelli) direttamente sul database di produzione per evitare di interrompere il sito live. DatoCMS permette di creare copie isolate dell'intero progetto chiamate **Environments**:

* **`main` (Primary Environment):** L'ambiente di produzione principale. È quello interrogato di default dall'applicazione live.
* **`develop` (Sandbox Environment):** L'ambiente di sviluppo condiviso dove testare codice e nuove funzionalità in sicurezza.

### Creazione dell'Ambiente di Sviluppo (`develop`)
> **Prerequisito:** Esegui sempre i comandi da terminale all'interno della cartella radice del tuo progetto Next.js (`cd company-datocms-app`).

Per duplicare lo stato attuale dell'ambiente primario (`main`) e creare l'ambiente `develop`:
```bash
npx datocms environments:fork main develop
```

### Verificare gli Ambienti Attivi
Per elencare gli ambienti disponibili e verificare quale ha il tag `PRIMARY`:
```bash
npx datocms environments:list
```

---

## 2. Regola Fondamentale: SCHEMA vs CONTENUTO

Prima di procedere con lo sviluppo, è fondamentale comprendere come si spostano i dati tra gli ambienti.

| Concetto | Cosa include | Come si trasferisce tra ambienti |
| :--- | :--- | :--- |
| **SCHEMA (Struttura)** | Modelli, Campi, Validazioni, Tipi di dato. | **Script di Migrazione CLI** (`migrations:new` / `migrations:run`). |
| **CONTENUTO (Dati)** | Testi dei campi, Articoli, Immagini caricate. | **Manualmente da Dashboard Web** oppure **Script CMA programmato**. |

> **Nota sui Contenuti:** Il comando `--autogenerate` ignora i testi dei record. Se compili un testo di prova dentro una sandbox, questo serve solo per i test visivi locali. Il testo definitivo va inserito a mano da Dashboard selezionando l'ambiente target, oppure sincronizzato via script.

---

## 3. Configurazione del Client Next.js per Puntare agli Ambienti

Per consentire a Next.js di dialogare con gli ambienti di DatoCMS in modo dinamico, configuriamo la variabile d'ambiente nel file `.env.local` e la passiamo alla funzione di fetch GraphQL centralizzata.

---

### 3.1 Configurazione in `.env.local`

In questo file configuriamo i token di sicurezza e dichiariamo l'ambiente attivo per l'esecuzione in locale.

**Pezzo 1: Configurazione del Token Read-Only**  
Definiamo la chiave API globale per autenticare le chiamate GraphQL in sola lettura verso DatoCMS.
```env
NEXT_DATOCMS_API_TOKEN=tuo_read_only_api_token_qui
```
* **`NEXT_DATOCMS_API_TOKEN`**: Il token alfanumerico generato nella dashboard di DatoCMS in *Project Settings -> API Tokens* con permessi Read-Only.

**Pezzo 2: Definizione dell'Ambiente Attivo**  
Definiamo la variabile che indica a Next.js da quale ambiente o sandbox leggere i dati in locale.
```env
NEXT_DATOCMS_ENVIRONMENT=develop
```
* **`NEXT_DATOCMS_ENVIRONMENT`**: Il nome dell'ambiente target su DatoCMS (es. `develop`, `main` o il nome di una sandbox di test come `task-modulo-10`). Per cambiare ambiente di lavoro in locale, si modifica direttamente questa stringa e si riavvia il server con `npm run dev`.

**Codice Completo di `.env.local`**
```env
# Token di lettura globale per l'API di DatoCMS
NEXT_DATOCMS_API_TOKEN=tuo_read_only_api_token_qui

# Nome dell'ambiente attivo su DatoCMS (es. develop, main, task-modulo-10)
NEXT_DATOCMS_ENVIRONMENT=develop
```

---

### 3.2 Modifica File: `src/lib/datocms.js`

Creiamo una funzione helper centralizzata per gestire le chiamate GraphQL verso l'API CDA di DatoCMS integrando il parametro dell'ambiente.

**Pezzo 1: Importazione della funzione SDK**  
Importiamo la funzione `executeQuery` fornita dal client ufficiale DatoCMS per Next.js/JavaScript.
```javascript
import { executeQuery } from '@datocms/cda-client';
```
* **`executeQuery`**: Metodo nativo del pacchetto `@datocms/cda-client` che esegue chiamate HTTP POST formattate verso l'endpoint GraphQL di DatoCMS.

**Pezzo 2: Iniezione del parametro Environment nella funzione di fetch**  
Definiamo ed esportiamo l'helper `performRequest` che accetta la query e inietta automaticamente il token e l'ambiente definiti nelle variabili `.env.local`.
```javascript
export const performRequest = (query, options = {}) => {
  return executeQuery(query, {
    ...options,
    token: process.env.NEXT_DATOCMS_API_TOKEN,
    environment: process.env.NEXT_DATOCMS_ENVIRONMENT,
  });
};
```
* **`query`**: La stringa contenente la query GraphQL da inviare a DatoCMS.
* **`options`**: Oggetto opzionale contenente variabili GraphQL (`variables`), impostazioni di revalidazione o header specifici.
* **`token`**: Utilizza il token di lettura `process.env.NEXT_DATOCMS_API_TOKEN`.
* **`environment`**: Legge il valore dell'ambiente specificato in `process.env.NEXT_DATOCMS_ENVIRONMENT`.

**Codice Completo di `src/lib/datocms.js`**
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
    environment: process.env.NEXT_DATOCMS_ENVIRONMENT,
  });
};
```

---

