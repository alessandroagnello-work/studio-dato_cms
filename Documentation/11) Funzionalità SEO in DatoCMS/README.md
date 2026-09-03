# Guida Tecnica (Modulo 11): Integrazione DatoCMS e Next.js - Funzionalità SEO e Crawler

La gestione SEO in un'architettura headless richiede una chiara separazione delle responsabilità: DatoCMS si occupa della strutturazione centralizzata dei metadati, mentre Next.js gestisce il rendering dei tag HTML e l'indicizzazione dinamica per i crawler.

---

## 1. Impostazione dei Metadati SEO su DatoCMS e Next.js

La configurazione dei metadati si divide in regole globali valide per l'intero sito e campi specifici applicati ai singoli modelli di contenuto.

---

### 1.1 Configurazione del Global SEO (Fallback di Progetto)

**1. Spiegazione Concettuale**  
DatoCMS permette di configurare un "Global SEO" a livello di progetto. Questo agisce come rete di sicurezza: se una singola pagina non ha metadati compilati, il sistema interviene fornendo valori di default (come un suffisso fisso per il titolo e un'immagine di condivisione predefinita) per garantire che i tag Open Graph non risultino mai vuoti.

**2. Strategia di Implementazione (Anticipazione)**  
Questa configurazione non viene effettuata tramite i modelli di contenuto standard, ma agisce a livello di impostazioni globali del CMS o tramite uno script dedicato per le *Site Settings*. 

**3. Spiegazione delle variabili e dei valori**  
* **Title suffix**: Una stringa fissa (es. `| Nome Azienda`) che verrà accodata in automatico ai titoli di tutte le pagine.
* **Fallback Image**: L'URL di un'immagine standard (consigliata 1200x630 pixel) utilizzata da Facebook/LinkedIn se la singola pagina è sprovvista di copertina.

---

### 1.2 Gestione SEO per Singola Pagina/Contenuto (Title, Description, Image)

**1. Spiegazione Concettuale**  
Per gestire in modo ottimale la SEO su URL dedicate (es. la singola scheda di una Nave o di un Porto), eviteremo di creare campi testo separati per titolo e descrizione. Utilizzeremo invece il campo nativo speciale di DatoCMS progettato appositamente per generare un'interfaccia editoriale SEO-friendly (con anteprima snippet in tempo reale).

**2. Strategia di Implementazione (Anticipazione)**  
In fase operativa, scriveremo uno script di migrazione per aggiungere il campo SEO ai modelli esistenti, analogamente a quanto fatto nel Modulo 10.

**3. Spiegazione delle variabili e dei valori**  
* **`field_type: 'seo'`**: Il tipo di campo nativo della CMA di DatoCMS che racchiude in un unico blocco Title, Description e Image, mappandoli automaticamente sui tag Open Graph (`og:title`, `og:description`, `og:image`).
* **Keyword**: DatoCMS non include il tag "keywords" nel blocco nativo SEO in quanto obsoleto. Se i requisiti aziendali lo impongono, andrà aggiunto tramite migrazione come campo indipendente di tipo `string`.

---

### 1.3 Canonical URL e Open Graph Type (`og:type`, `og:url`)

**1. Spiegazione Concettuale**  
Mentre i metadati testuali provengono dal CMS, i tag posizionali e strutturali devono riflettere l'infrastruttura di routing. Il *Canonical URL* (indirizzo web ufficiale) non va inserito manualmente nel CMS per evitare disallineamenti tra ambiente di staging e produzione.

**2. Strategia di Implementazione (Anticipazione)**  
Delegheremo la generazione del Canonical URL e dell'`og:url` interamente al frontend. Utilizzeremo l'API `generateMetadata` di Next.js per calcolare l'URL assoluto a runtime, unendo il dominio base (letto da variabili d'ambiente) e lo slug estratto da DatoCMS.

**3. Spiegazione delle variabili e dei valori**  
* **Canonical URL (`<link rel="canonical">`)**: Indirizzo univoco calcolato da Next.js.
* **`og:type`**: Tipo di contenuto (es. `"website"`, `"article"`), configurabile nativamente tramite il campo SEO di DatoCMS o forzato a livello di layout su Next.js.

---

### 1.4 Definizione File per i Crawler (Robots.txt, Sitemap.xml, llms.txt)

**1. Spiegazione Concettuale**  
I file destinati ai crawler non esistono "fisicamente" all'interno del database di DatoCMS. In un'architettura disaccoppiata, il CMS è solo la sorgente dati, mentre la responsabilità di generare ed esporre questi file spetta esclusivamente al server Next.js.

**2. Strategia di Implementazione (Anticipazione)**  
* **Sitemap.xml**: In Next.js (App Router) creeremo un file dinamico che eseguirà una query GraphQL verso DatoCMS per estrapolare tutti gli *slug* attivi e generare l'albero XML.
* **Robots.txt**: Verrà gestito tramite un file statico o dinamico in Next.js, definendo le regole di indicizzazione per gli user-agent.
* **llms.txt**: (File per i crawler AI) Verrà generato tramite una route API in Next.js, interrogando DatoCMS per fornire versioni puramente testuali o sintetiche della struttura del sito.

**3. Spiegazione delle variabili e dei valori**  
*(Le variabili e le query GraphQL necessarie verranno dettagliate nella fase di scrittura del codice).*

## 2. Aggiunta dei Campi SEO ai Modelli Custom via CLI

Per abilitare la gestione dei metadati per le singole pagine raggiungibili tramite URL (Porto e Nave), modifichiamo lo schema del database utilizzando la Content Management API di DatoCMS. Introdurremo il campo nativo `seo` per gestire Title, Description e Open Graph, e un campo `string` separato per le storiche Keywords.

---

### 2.1 Generazione del file di migrazione vuoto e creazione Sandbox

**1. Spiegazione Concettuale**  
Prima di alterare lo schema, creiamo la sandbox isolata `task-seo` per non alterare l'ambiente di lavoro principale. Generiamo poi un file di migrazione vuoto nella cartella `./migrations` del progetto, al quale la CLI assegnerà un prefisso numerico (timestamp) per garantire l'esecuzione sequenziale.

**2. Estratto di Codice**  
```bash
npx datocms environments:fork develop task-seo
npx datocms migrations:new "add_seo_and_keywords_to_models"
```

**3. Spiegazione delle variabili e dei valori**  
* **`environments:fork develop task-seo`**: Duplica l'ambiente `develop` e genera la sandbox temporanea `task-seo`.
* **`migrations:new`**: Comando CLI per creare lo scheletro dello script.
* **`"add_seo_and_keywords_to_models"`**: Descrizione testuale associata al nome del file generato.

---

### 2.2 Nota Operativa: Ambiente Locale vs Sandbox CLI

**1. Spiegazione Concettuale**  
Quando esegui il fork `task-seo`, l'ambiente sandbox risiede **esclusivamente sul cloud di DatoCMS**. L'applicazione Next.js avviata localmente (`npm run dev`) continua a comunicare con l'ambiente `develop`, poiché il file `.env.local` mantiene il riferimento `NEXT_DATOCMS_ENVIRONMENT=develop`.

**2. Gestione del File `.env.local` durante i Test**

* **Isolamento di Sviluppo (Default)**: Mantenendo `NEXT_DATOCMS_ENVIRONMENT=develop` in `.env.local`, l'app web rimane stabile mentre la CLI opera in modo completamente isolato sulla sandbox.
* **Verifica Visuale su Browser**: Se desideri verificare sul browser le modifiche apportate dalla migrazione (es. vedere i nuovi campi SEO nell'interfaccia o testare l'API) prima del merge, modifica temporaneamente `.env.local`:
  ```env
  NEXT_DATOCMS_ENVIRONMENT=task-seo
  ```
  Riavvia il server di sviluppo (`npm run dev`) per caricare i dati dalla sandbox. Concluso il test, ripristina il puntamento originale su `develop`.

---

### 2.3 Scrittura dello script per l'aggiunta dei campi SEO

**1. Spiegazione Concettuale**  
Ogni script di migrazione esporta una funzione asincrona che riceve il client CMA. Recuperiamo i modelli esistenti tramite le loro `api_key` (`port` e `ship`). Per ciascuno di essi, definiamo due nuovi campi: il campo speciale `seo` che genererà l'interfaccia dedicata per snippet e social preview, e il campo testo standard per le `keywords`.

**2. Estratto di Codice**  
```javascript
const portModel = await client.itemTypes.find('port');

// Campo nativo SEO (Include Title, Description, Image e OG)
await client.fields.create(portModel, {
  label: 'SEO Meta Tags',
  api_key: 'seo',
  field_type: 'seo',
});

// Campo testuale custom per le Keywords
await client.fields.create(portModel, {
  label: 'Keywords (SEO)',
  api_key: 'keywords',
  field_type: 'string',
});
```

**3. Spiegazione delle variabili e dei valori**  
* **`field_type: 'seo'`**: Identificativo CMA per il campo composito nativo di DatoCMS. L'editor vedrà un'interfaccia che raggruppa titolo, descrizione, immagine e preview dei risultati di ricerca.
* **`field_type: 'string'`**: Stringa a riga singola in cui l'editor potrà inserire le parole chiave separate da virgola (es. `"porto, logistica, navi"`).

---

### 2.4 Codice Completo dello Script (`migrations/XXXXX_add_seo_and_keywords_to_models.js`)

```javascript
'use strict';

/**
 * Script di migrazione per l'aggiunta dei campi SEO (Nativo) e Keywords
 * ai modelli Porto e Nave.
 */
module.exports = async (client) => {
  // 1. Recupero dei modelli esistenti
  const portModel = await client.itemTypes.find('port');
  const shipModel = await client.itemTypes.find('ship');

  // 2. Aggiunta dei campi al Modello "Porto"
  await client.fields.create(portModel, {
    label: 'SEO Meta Tags',
    api_key: 'seo',
    field_type: 'seo',
  });

  await client.fields.create(portModel, {
    label: 'Keywords (SEO)',
    api_key: 'keywords',
    field_type: 'string',
  });

  // 3. Aggiunta dei campi al Modello "Nave"
  await client.fields.create(shipModel, {
    label: 'SEO Meta Tags',
    api_key: 'seo',
    field_type: 'seo',
  });

  await client.fields.create(shipModel, {
    label: 'Keywords (SEO)',
    api_key: 'keywords',
    field_type: 'string',
  });
};
```

---

### 2.5 Esecuzione dello script sulla Sandbox

**1. Spiegazione Concettuale**  
Applichiamo lo script di migrazione per generare i nuovi campi all'interno della sandbox temporanea `task-seo`.

**2. Estratto di Codice**  
```bash
npx datocms migrations:run --source=task-seo --in-place
```

**3. Spiegazione delle variabili e dei valori**  
* **`migrations:run`**: Comando CLI per l'esecuzione delle migrazioni pendenti.
* **`--source=task-seo`**: Specifica la sandbox di destinazione.
* **`--in-place`**: Applica le modifiche direttamente sulla sandbox indicata senza crearne una nuova derivata.

---

### 2.6 Risultato Atteso nella Dashboard (Punto 2)

**1. Spiegazione Concettuale**  
Dopo l'esecuzione della migrazione, nella dashboard della sandbox `task-seo` troveremo gli schemi aggiornati per le due entità principali e le rispettive maschere di inserimento pronte all'uso.

**2. Risultato Visivo nella Dashboard**  

* **Sezione Schema (`Porto` e `Nave`)**: Nelle rispettive definizioni dei modelli appariranno i nuovi campi `SEO Meta Tags` (type: SEO) e `Keywords (SEO)` (type: Single-line string).

* **Sezione Content (Maschera di Editing)**: Aprendo un record (es. "Porto di Napoli"), in fondo alla form appariranno:

  * Un campo testo semplice intitolato **Keywords (SEO)**.
  * Un blocco interattivo intitolato **SEO Meta Tags**. Questo contenitore mostra:
    * Campi input per *Title* (con contatore di lunghezza), *Description* (con contatore) e un uploader per l'*Image* (con indicazione `1200x630px recommended`).
    * Un riquadro *Google Search*, *Facebook* e *Twitter* che genera l'anteprima reale dello snippet in base al testo digitato.