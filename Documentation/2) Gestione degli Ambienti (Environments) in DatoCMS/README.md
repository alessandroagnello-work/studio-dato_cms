# Guida Tecnica (Modulo 2): Gestione degli Ambienti (Environments) in DatoCMS

## Riferimenti Ufficiali

* **DatoCMS CLI Commands:** [https://www.datocms.com/docs/cli](https://www.datocms.com/docs/cli)
* **Content Delivery API Environments:** [https://www.datocms.com/docs/content-delivery-api/environments](https://www.datocms.com/docs/content-delivery-api/environments)

---

## 1. Il Concetto di Environment in DatoCMS

### Cosa sono e perché si usano
Nei progetti web professionali non si effettuano modifiche strutturali (come aggiungere campi o modelli) direttamente sul database di produzione per evitare di interrompere il sito live. DatoCMS permette di creare copie isolate dell'intero progetto chiamate **Environments**:

* **`main` (Primary Environment):** L'ambiente di produzione principale. È quello interrogato di default dall'applicazione live.
* **`develop` (Sandbox Environment):** L'ambiente di sviluppo condiviso dove testare codice e nuove funzionalità in sicurezza.

---

## 2. Creazione dell'Ambiente di Sviluppo (`develop`)

> **Prerequisito:** Esegui sempre i comandi da terminale all'interno della cartella radice del tuo progetto Next.js (`cd company-datocms-app`).

### Creare la Sandbox `develop` da `main`
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

## 3. Flusso di Lavoro Operativo: Sviluppo di una Feature (`task-1`)

Per lavorare su un nuovo ticket senza sporcare l'ambiente `develop` condiviso, si crea una sub-sandbox temporanea (es. `task-1`), si applicano le modifiche e infine si esegue il **Merge** su `develop`.

---

### Step 1: Creare la Sandbox del Ticket
Clona l'ambiente `develop` per creare il tuo recinto di lavoro isolato `task-1`:

```bash
npx datocms environments:fork develop task-1
```

---

### Step 2: Modificare lo Schema da Dashboard Web (GUI)
1. Apri la Dashboard Web di DatoCMS.
2. Nel menu a tendina in alto a sinistra (*SWITCH TO*), passa all'ambiente **`task-1`**.
3. Naviga su **Schema** $\rightarrow$ seleziona il Modello desiderato (es. `Page`) $\rightarrow$ clicca su **Add new field**.
4. Aggiungi il nuovo campo (es. un campo testo `subtitle`) e salva.

---

### Step 3: Autogenerare lo Script di Migrazione CLI
Le modifiche fatte da Dashboard Web risiedono sul cloud. Per scaricare le differenze tra `task-1` e `develop` sotto forma di script `.js` locale, lancia:

```bash
npx datocms migrations:new "add_subtitle_to_page" --autogenerate=task-1:develop
```

* **Cosa fa:** Confronta lo schema di `task-1` con quello di `develop` e crea un nuovo file `.js` nella cartella `./migrations/`.

---

### Step 4: Eseguire il Merge dello Schema su `develop`
Applica lo script appena generato direttamente dentro l'ambiente condiviso `develop`:

```bash
npx datocms migrations:run --source=develop --in-place
```

* **`--source=develop`**: Specifica l'ambiente su cui applicare la migrazione.
* **`--in-place`**: Modifica l'ambiente `develop` esistente in tempo reale senza creare sandbox temporanee di test.

---

### Step 5: Eliminare la Sandbox Temporanea
Una volta che le modifiche di schema sono state unite su `develop`, elimina la sandbox `task-1` per liberare risorse:

```bash
npx datocms environments:destroy task-1
```

---

## 4. Regola Fondamentale: SCHEMA vs CONTENUTO

| Concetto | Cosa include | Come si trasferisce da `task-1` a `develop` |
| :--- | :--- | :--- |
| **SCHEMA (Struttura)** | Modelli, Campi, Validazioni, Tipi di dato. | **Script di Migrazione CLI** (`migrations:new` / `migrations:run`). |
| **CONTENUTO (Dati)** | Testi dei campi, Articoli, Immagini caricate. | **Manualmente da Dashboard Web** (selezionando `develop` dal menu). |

> **Nota sui Contenuti:** Il comando `--autogenerate` ignora i testi dei record. Se compili un testo di prova dentro `task-1`, questo serve solo per i tuoi test visivi locali. Il testo definitivo va inserito a mano da Dashboard selezionando l'ambiente `develop`.

---

## 5. Configurazione del Client Next.js per Puntare a `develop`

### 5.1 Come funziona il Routing dell'Ambiente
L'SDK `@datocms/cda-client` accetta il parametro `environment`:
* **Se non specificato (`undefined`):** DatoCMS risponde con i dati dell'ambiente **`main`** (Produzione).
* **Se impostato su `'develop'`:** DatoCMS risponde isolato con i dati della Sandbox **`develop`**.

---

### 5.2 Modifica File 1: `.env.local`

**1. Spiegazione Concettuale**  
Definiamo la chiave API globale per le chiamate GraphQL.

**2. Estratto di Codice**  
```env
NEXT_DATOCMS_API_TOKEN=tuo_read_only_api_token_qui
```

**3. Spiegazione Concettuale**  
Definiamo la variabile che forza Next.js a leggere i dati dall'ambiente sandbox in locale.

**4. Estratto di Codice**  
```env
NEXT_DATOCMS_ENVIRONMENT=develop
```

**5. Codice Completo di `.env.local`**  
```env
# Token di lettura globale per l'API di DatoCMS
NEXT_DATOCMS_API_TOKEN=tuo_read_only_api_token_qui

# Nome della Sandbox di sviluppo attiva su DatoCMS
NEXT_DATOCMS_ENVIRONMENT=develop
```

---

### 5.3 Modifica File 2: `src/lib/datocms.js`

**1. Spiegazione Concettuale**  
Importiamo la funzione `executeQuery` dal pacchetto ufficiale `@datocms/cda-client`.

**2. Estratto di Codice**  
```javascript
import { executeQuery } from '@datocms/cda-client';
```

**3. Spiegazione Concettuale**  
Passiamo la variabile d'ambiente `environment` nelle opzioni della funzione, così che l'SDK instradi le query in automatico.

**4. Estratto di Codice**  
```javascript
environment: process.env.NEXT_DATOCMS_ENVIRONMENT,
```

**5. Codice Completo di `src/lib/datocms.js`**  
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

## 6. Rilascio Finale in Produzione e Rollback

Quando tutte le funzionalità su `develop` sono state collaudate con successo, è il momento di rilasciare le modifiche in Produzione su `main`.

### 6.1 Promozione in Produzione (`develop` $\rightarrow$ `main`)

Esegui il comando di promozione:

```bash
npx datocms environments:promote develop
```

**Cosa succede sul cloud DatoCMS:**
1. L'ambiente `develop` riceve il tag `PRIMARY` e diventa il **nuovo ambiente di produzione live**.
2. Il vecchio ambiente `main` **non viene sovrascritto o cancellato**: viene automaticamente declassato a Sandbox di backup congelata.

---

### 6.2 Rollback Istantaneo in Caso di Errore

Se subito dopo il rilascio riscontri un bug critico in produzione, puoi ripristinare la versione precedente in un secondo promossi di nuovo il vecchio ambiente `main`:

```bash
npx datocms environments:promote main
```

*Il sito live tornerà istantaneamente a leggere dal backup precedente con zero downtime e senza alcuna perdita di dati.*