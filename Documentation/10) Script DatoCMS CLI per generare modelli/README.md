# Guida Tecnica (Modulo 10): Modellazione Avanzata via CLI, Relazioni e Seeding Data

## Riferimenti Ufficiali

* **DatoCMS CLI Commands:** [https://www.datocms.com/docs/cli](https://www.datocms.com/docs/cli)
* **DatoCMS Scripting Migrations:** [https://www.datocms.com/docs/scripting-migrations/scripting-migrations-with-the-datocms-cli](https://www.datocms.com/docs/scripting-migrations/scripting-migrations-with-the-datocms-cli)
* **Content Management API (Item Types):** [https://www.datocms.com/docs/content-management-api/resources/item-type](https://www.datocms.com/docs/content-management-api/resources/item-type)
* **Content Management API (Fields):** [https://www.datocms.com/docs/content-management-api/resources/field](https://www.datocms.com/docs/content-management-api/resources/field)

---

## Premessa Teorica: Script di Migrazione vs Data Seeding

Prima di eseguire i comandi da CLI, è fondamentale comprendere la distinzione tra **Migrazioni** e **Seeding** nell'architettura di un Headless CMS:

| Concetto | Migrazione (Migration) | Seeding (Data Seeder) |
| :--- | :--- | :--- |
| **Scopo** | Definire ed evolvere lo **Schema** (la struttura). | Popolare i **Dati** (i contenuti reali o di test). |
| **Cosa crea/modifica** | Modelli (*Item Types*), Campi (*Fields*), Validazioni e Blocchi Modulari. | Record individuali (*Items*), Asset multimediali (*Uploads*) e Relazioni tra record. |
| **Quando si usa** | Ad ogni evoluzione architetturale o modifica del database. | In fase di setup iniziale, test in sandbox, ambienti di staging o sviluppo locale. |
| **Analogia** | Progettare e costruire le pareti e l'impianto elettrico di un edificio. | Arredare le stanze portando mobili, oggetti ed elettrodomestici. |

* **Script di Migrazione**: File di codice (identificati da un timestamp sequenziale) che consentono di tracciare le modifiche allo schema su Git. Garantiscono che ogni sviluppatore del team e ogni ambiente cloud (sviluppo, staging, produzione) possiedano esattamente la stessa struttura dati senza dover configurare nulla manualmente da interfaccia grafica.
* **Script di Seeding**: Script che automatizzano l'inserimento programmatico dei dati. Invece di compilare form a mano nella Dashboard, lo script crea i record di test, carica le immagini nella Media Library e collega le entità via API. 
*(Nota: In DatoCMS i seeder non hanno una cartella dedicata, ma vengono eseguiti tramite la stessa cartella e gli stessi comandi CLI delle migrazioni).*

---

## 1. Creazione dei Modelli Custom via CLI (Porto e Nave)

Per creare la struttura del database tramite codice, DatoCMS utilizza gli **Script di Migrazione**. A differenza della modalità con flag `--autogenerate`, in questo caso definiamo le istruzioni programmaticamente tramite la Content Management API (CMA).

---

### 1.1 Generazione del file di migrazione vuoto e creazione Sandbox

**1. Spiegazione Concettuale**  
Prima di definire i modelli, creiamo la sandbox isolata `task-modulo-10` per non alterare l'ambiente di lavoro principale. Generiamo poi un file di migrazione vuoto nella cartella `./migrations` del progetto, al quale la CLI assegnerà un prefisso numerico (timestamp) per garantire l'esecuzione sequenziale.

**2. Estratto di Codice**  
```bash
npx datocms environments:fork develop task-modulo-10
npx datocms migrations:new "create_port_and_ship_models"
```

**3. Spiegazione delle variabili e dei valori**  
* **`environments:fork develop task-modulo-10`**: Duplica l'ambiente `develop` e genera la sandbox temporanea `task-modulo-10`.
* **`migrations:new`**: Comando CLI per creare lo scheletro dello script.
* **`"create_port_and_ship_models"`**: Descrizione testuale associata al nome del file generato.

---

### 1.2 Nota Operativa: Ambiente Locale vs Sandbox CLI

**1. Spiegazione Concettuale**  
Quando esegui il fork `task-modulo-10`, l'ambiente sandbox risiede **esclusivamente sul cloud di DatoCMS**. L'applicazione Next.js avviata localmente (`npm run dev`) continua a comunicare con l'ambiente `develop`, poiché il file `.env.local` mantiene il riferimento `NEXT_DATOCMS_ENVIRONMENT=develop`.

**2. Gestione del File `.env.local` durante i Test**

* **Isolamento di Sviluppo (Default)**: Mantenendo `NEXT_DATOCMS_ENVIRONMENT=develop` in `.env.local`, l'app web rimane stabile mentre la CLI opera in modo completamente isolato sulla sandbox.
* **Verifica Visuale su Browser**: Se desideri verificare sul browser le modifiche apportate dalla migrazione prima del merge, modifica temporaneamente `.env.local`:
  ```env
  NEXT_DATOCMS_ENVIRONMENT=task-modulo-10
  ```
  Riavvia il server di sviluppo (`npm run dev`) per caricare i dati dalla sandbox. Concluso il test, ripristina il puntamento originale su `develop`.

---

### 1.3 Scrittura dello script di creazione modelli

**1. Spiegazione Concettuale**  
Ogni script di migrazione esporta una funzione asincrona che riceve il client CMA. Invochiamo `client.itemTypes.create()` per definire l'entità "Porto".

**2. Estratto di Codice**  
```javascript
module.exports = async (client) => {
  const portModel = await client.itemTypes.create({
    name: 'Porto',
    api_key: 'port',
    modular_block: false,
    collection_appearance: 'table',
  });
```

**3. Spiegazione delle variabili e dei valori**  
* **`client.itemTypes.create`**: Metodo CMA per instanziare un nuovo modello.
* **`name`**: `'Porto'` - Nome visualizzato nel pannello amministrativo.
* **`api_key`**: `'port'` - Identificatore unico per le API e le query GraphQL.
* **`modular_block`**: `false` - Definisce un modello di contenuto principale, non un blocco componibile.
* **`collection_appearance`**: `'table'` - Imposta la vista a tabella come predefinita nella Dashboard.

**4. Spiegazione Concettuale**  
Proseguiamo nello stesso script per definire l'entità "Nave".

**5. Estratto di Codice**  
```javascript
  const shipModel = await client.itemTypes.create({
    name: 'Nave',
    api_key: 'ship',
    modular_block: false,
    collection_appearance: 'table',
  });
};
```

**6. Spiegazione delle variabili e dei valori**  
* **`name`**: `'Nave'` - Nome della seconda entità per la Dashboard.
* **`api_key`**: `'ship'` - Chiave API univoca per il modello Nave.

---

### 1.4 Codice Completo dello Script (`migrations/XXXXX_create_port_and_ship_models.js`)

```javascript
'use strict';

/**
 * Script di migrazione per la creazione programmatica dei modelli Porto e Nave.
 */
module.exports = async (client) => {
  // 1. Creazione del Modello "Porto"
  const portModel = await client.itemTypes.create({
    name: 'Porto',
    api_key: 'port',
    modular_block: false,
    collection_appearance: 'table',
  });

  // 2. Creazione del Modello "Nave"
  const shipModel = await client.itemTypes.create({
    name: 'Nave',
    api_key: 'ship',
    modular_block: false,
    collection_appearance: 'table',
  });
};
```

---

### 1.5 Esecuzione dello script sulla Sandbox

**1. Spiegazione Concettuale**  
Applichiamo lo script di migrazione per generare i modelli all'interno della sandbox temporanea.

**2. Estratto di Codice**  
```bash
npx datocms migrations:run --source=task-modulo-10 --in-place
```

**3. Spiegazione delle variabili e dei valori**  
* **`migrations:run`**: Comando CLI per l'esecuzione delle migrazioni pendenti.
* **`--source=task-modulo-10`**: Specifica la sandbox di destinazione.
* **`--in-place`**: Applica le modifiche direttamente sulla sandbox indicata senza crearne una nuova derivata.

---

### 1.6 Risultato Atteso nella Dashboard (Punto 1)

**1. Spiegazione Concettuale**  
Dopo l'esecuzione della prima migrazione, nella dashboard della sandbox `task-modulo-10` troviamo registrate le due entità principali.

**2. Risultato Visivo nella Dashboard**
* **Sezione `Schema`**: Compare l'elenco dei modelli con **Porto** (`port`) e **Nave** (`ship`). Selezionando ciascun modello, la schermata principale mostra il messaggio *"Add some fields to this model!"*, a conferma che la struttura contenitore è stata creata ma non include ancora campi.
* **Sezione `Content`**: Compaiono le due nuove raccolte **Porto** e **Nave**. Accedendovi, la schermata mostra *"This collection is empty"* poiché non abbiamo ancora inserito né campi né record.

---

## 2. Aggiunta dei Campi ai Modelli Custom (Porto e Nave)

Dopo aver creato gli scheletri dei modelli, definiamo i campi (fields) programmaticamente tramite lo script di migrazione. Analizzeremo campi semplici (testo, numeri, boolean) e campi complessi (file/media e validazioni avanzate).

---

### 2.1 Generazione del file di migrazione per i campi

**1. Spiegazione Concettuale**  
Generiamo un nuovo script di migrazione dedicato alla creazione dei campi. Mantenere le modifiche allo schema suddivise in script distinti e sequenziali garantisce la tracciabilità e la modularità delle migrazioni.

**2. Estratto di Codice**  
```bash
npx datocms migrations:new "add_fields_to_port_and_ship_models"
```

**3. Spiegazione delle variabili e dei valori**  
* **`migrations:new`**: Comando CLI per creare un nuovo file nella cartella `./migrations`.
* **`"add_fields_to_port_and_ship_models"`**: Descrizione sintetica del contenuto dello script.

---

### 2.2 Definizione dei campi per il modello "Porto"

**1. Spiegazione Concettuale**  
Recuperiamo il modello `port` tramite la sua `api_key` e definiamo i seguenti campi:
* **`nome`**: Campo testo di tipo `string`, obbligatorio e impostato come titolo principale.
* **`citta`**: Campo testo di tipo `string`, obbligatorio.
* **`foto_copertina`**: Campo complesso di tipo `file` (Media) limitato alle sole risorse immagine.

**2. Estratto di Codice**  
```javascript
const portModel = await client.itemTypes.find('port');

// Campo Nome (String)
await client.fields.create(portModel, {
  label: 'Nome Porto',
  api_key: 'nome',
  field_type: 'string',
  validators: { required: {} },
});

// Campo Citta (String)
await client.fields.create(portModel, {
  label: 'Città',
  api_key: 'citta',
  field_type: 'string',
  validators: { required: {} },
});

// Campo Foto Copertina (File / Media Complesso)
await client.fields.create(portModel, {
  label: 'Foto Copertina',
  api_key: 'foto_copertina',
  field_type: 'file',
  validators: {
    extension: {
      predefined_list: 'image',
    },
  },
});
```

**3. Spiegazione delle variabili e dei valori**  
* **`client.itemTypes.find('port')`**: Cerca e restituisce l'oggetto del modello `Porto` usando la sua `api_key`.
* **`client.fields.create(portModel, ...)`**: Metodo CMA per creare un campo collegato al modello specificato.
* **`field_type: 'string'`**: Campo di testo a riga singola.
* **`field_type: 'file'`**: Campo per la gestione delle risorse multimediali (Asset).
* **`validators.required`**: Impone l'obbligatorietà del campo nella Dashboard.
* **`validators.extension`**: Valida le estensioni accettate dal campo file imponendo la lista predefinita `image` (`predefined_list: 'image'`).

---

### 2.3 Definizione dei campi per il modello "Nave"

**1. Spiegazione Concettuale**  
Per il modello `ship`, creiamo campi con validatori specifici e tipi differenti:
* **`nome`**: Campo testo `string`, obbligatorio.
* **`codice_imo`**: Campo testo `string`, univoco (non possono esistere due navi con lo stesso codice).
* **`capienza_passeggeri`**: Campo numerico `integer` con validazione di valore minimo.
* **`in_servizio`**: Campo logico `boolean` per indicare lo stato operativo.

**2. Estratto di Codice**  
```javascript
const shipModel = await client.itemTypes.find('ship');

// Campo Nome (String)
await client.fields.create(shipModel, {
  label: 'Nome Nave',
  api_key: 'nome',
  field_type: 'string',
  validators: { required: {} },
});

// Campo Codice IMO (String con Validatore Unique)
await client.fields.create(shipModel, {
  label: 'Codice IMO',
  api_key: 'codice_imo',
  field_type: 'string',
  validators: {
    required: {},
    unique: {},
  },
});

// Campo Capienza Passeggeri (Integer con Validatore Range)
await client.fields.create(shipModel, {
  label: 'Capienza Passeggeri',
  api_key: 'capienza_passeggeri',
  field_type: 'integer',
  validators: {
    number_range: {
      min: 1,
    },
  },
});

// Campo In Servizio (Boolean)
await client.fields.create(shipModel, {
  label: 'In Servizio',
  api_key: 'in_servizio',
  field_type: 'boolean',
  default_value: true,
});
```

**3. Spiegazione delle variabili e dei valori**  
* **`validators.unique`**: Garantisce che il valore inserito nel campo sia unico all'interno di tutto il database.
* **`field_type: 'integer'`**: Campo per numeri interi.
* **`validators.number_range`**: Impone un limite numerico (in questo caso `min: 1` impedisce valori zero o negativi).
* **`field_type: 'boolean'`**: Campo interruttore (vero/falso).
* **`default_value: true`**: Imposta il valore predefinito a `true` al momento della creazione di un nuovo record.

---

### 2.4 Codice Completo dello Script (`migrations/XXXXX_add_fields_to_port_and_ship_models.js`)

```javascript
'use strict';

/**
 * Script di migrazione per aggiungere i campi ai modelli Porto e Nave.
 */
module.exports = async (client) => {
  // 1. Recupero Modelli esistenti
  const portModel = await client.itemTypes.find('port');
  const shipModel = await client.itemTypes.find('ship');

  // 2. Aggiunta campi al modello "Porto"
  await client.fields.create(portModel, {
    label: 'Nome Porto',
    api_key: 'nome',
    field_type: 'string',
    validators: { required: {} },
  });

  await client.fields.create(portModel, {
    label: 'Città',
    api_key: 'citta',
    field_type: 'string',
    validators: { required: {} },
  });

  await client.fields.create(portModel, {
    label: 'Foto Copertina',
    api_key: 'foto_copertina',
    field_type: 'file',
    validators: {
      extension: {
        predefined_list: 'image',
      },
    },
  });

  // 3. Aggiunta campi al modello "Nave"
  await client.fields.create(shipModel, {
    label: 'Nome Nave',
    api_key: 'nome',
    field_type: 'string',
    validators: { required: {} },
  });

  await client.fields.create(shipModel, {
    label: 'Codice IMO',
    api_key: 'codice_imo',
    field_type: 'string',
    validators: {
      required: {},
      unique: {},
    },
  });

  await client.fields.create(shipModel, {
    label: 'Capienza Passeggeri',
    api_key: 'capienza_passeggeri',
    field_type: 'integer',
    validators: {
      number_range: {
        min: 1,
      },
    },
  });

  await client.fields.create(shipModel, {
    label: 'In Servizio',
    api_key: 'in_servizio',
    field_type: 'boolean',
    default_value: true,
  });
};
```

---

### 2.5 Esecuzione dello script sulla Sandbox

**1. Spiegazione Concettuale**  
Eseguiamo la migrazione pendente sulla sandbox temporanea `task-modulo-10`.

**2. Estratto di Codice**  
```bash
npx datocms migrations:run --source=task-modulo-10 --in-place
```

**3. Spiegazione delle variabili e dei valori**  
* **`migrations:run`**: Individua ed esegue il file di migrazione dei campi appena generato.
* **`--source=task-modulo-10`**: Specifica l'ambiente sandbox bersaglio.
* **`--in-place`**: Modifica la sandbox senza forzare una nuova sotto-ramificazione.

---

### 2.6 Nota di Troubleshooting: Validazioni API e Ripristino Sandbox

**1. Gestione Sintassi Validatore File (`INVALID_FIELD`)**  
Se si utilizza l'attributo generico `allowed_extensions` per i campi file, l'API di DatoCMS restituirà l'errore `422 Unprocessable Entity - invalid attribute: allowed_extensions`. La Content Management API richiede espressamente la chiave `predefined_list: 'image'` (oppure la configurazione dettagliata `extension: { predefined_list: 'image' }`).

**2. Risoluzione Errori di Unicità (`VALIDATION_UNIQUENESS`) su Migrazioni Parziali**  
Se uno script di migrazione fallisce a metà (ad esempio dopo aver creato i primi due campi), i campi già creati rimangono salvati nella sandbox. Rieseguire lo script provocherà l'errore `VALIDATION_UNIQUENESS` poiché i campi con quella `api_key` esistono già. Per ripristinare uno stato pulito sulla sandbox temporanea, eseguire la sequenza:

```bash
npx datocms environments:destroy task-modulo-10
npx datocms environments:fork develop task-modulo-10
npx datocms migrations:run --source=task-modulo-10 --in-place
```

---

### 2.7 Risultato Atteso nella Dashboard (Punto 2)

**1. Spiegazione Concettuale**  
Eseguita la seconda migrazione, gli schemi dei due modelli risulteranno arricchiti da tutte le rispettive proprietà e dai relativi vincoli di validazione.

**2. Risultato Visivo nella Dashboard**
* **Modello `Porto` (Sezione `Schema`)**:
  * `Nome Porto` (`nome`) - Single-line String * (Required)
  * `Città` (`citta`) - Single-line String * (Required)
  * `Foto Copertina` (`foto_copertina`) - File (Limitato ad immagini)
* **Modello `Nave` (Sezione `Schema`)**:
  * `Nome Nave` (`nome`) - Single-line String * (Required)
  * `Codice IMO` (`codice_imo`) - Single-line String * (Required, Unique)
  * `Capienza Passeggeri` (`capienza_passeggeri`) - Integer Number (Min: 1)
  * `In Servizio` (`in_servizio`) - Boolean (Default: `true`)
* **Sezione `Content`**: Le tabelle rimangono ancora vuote (*"This collection is empty"*), ma cliccando su *"Create a new record"* si aprirà la maschera di inserimento contenente tutti gli input generati dallo script.

---

## 3. Configurazione delle Relazioni tra Modelli (Porto 0..1 → 0..N Navi)

Per modellare una relazione uno-a-molti (1:N) in DatoCMS — dove un **Porto** può ospitare $0..N$ **Navi** e ciascuna **Nave** appartiene a $0..1$ **Porto** — si crea un campo di tipo **`link`** (Single Link) sul modello child (**Nave**) che riferisce il modello parent (**Porto**).

---

### 3.1 Generazione del file di migrazione per la relazione

**1. Spiegazione Concettuale**  
Generiamo un nuovo script di migrazione isolato per aggiungere il campo di collegamento tra le entità esistenti.

**2. Estratto di Codice**  
```bash
npx datocms migrations:new "add_link_between_ship_and_port"
```

**3. Spiegazione delle variabili e dei valori**  
* **`migrations:new`**: Comando CLI per creare lo scheletro dello script nella cartella `./migrations`.
* **`"add_link_between_ship_and_port"`**: Identificatore descrittivo del file di migrazione.

---

### 3.2 Definizione del campo Link sul modello "Nave"

**1. Spiegazione Concettuale**  
Recuperiamo sia il modello `ship` che il modello `port`. Sul modello `ship` definiamo un campo `field_type: 'link'` nominato `porto` e applichiamo il validatore `item_item_type` per restringere i record selezionabili ai soli record di tipo Porto.

**2. Estratto di Codice**  
```javascript
const shipModel = await client.itemTypes.find('ship');
const portModel = await client.itemTypes.find('port');

// Campo Relazione Single Link (Nave -> Porto)
await client.fields.create(shipModel, {
  label: 'Porto di Appartenenza',
  api_key: 'porto',
  field_type: 'link',
  validators: {
    item_item_type: {
      item_types: [portModel.id],
    },
  },
});
```

**3. Spiegazione delle variabili e dei valori**  
* **`field_type: 'link'`**: Definisce una relazione singola (1 record di destinazione).
* **`validators.item_item_type`**: Vincola il campo ad accettare unicamente record appartenenti ai modelli indicati nell'array `item_types`.
* **`item_types: [portModel.id]`**: Specifica l'ID dinamico del modello Porto come unico target valido.

---

### 3.3 Codice Completo dello Script (`migrations/XXXXX_add_link_between_ship_and_port.js`)

```javascript
'use strict';

/**
 * Script di migrazione per creare la relazione 1:N tra Porto e Nave.
 */
module.exports = async (client) => {
  // 1. Recupero dei modelli esistenti
  const shipModel = await client.itemTypes.find('ship');
  const portModel = await client.itemTypes.find('port');

  // 2. Creazione del campo relazionale Single Link su Nave
  await client.fields.create(shipModel, {
    label: 'Porto di Appartenenza',
    api_key: 'porto',
    field_type: 'link',
    validators: {
      item_item_type: {
        item_types: [portModel.id],
      },
    },
  });
};
```

---

### 3.4 Esecuzione dello script sulla Sandbox

**1. Spiegazione Concettuale**  
Applichiamo lo script di migrazione della relazione direttamente sulla sandbox attiva `task-modulo-10`.

**2. Estratto di Codice**  
```bash
npx datocms migrations:run --source=task-modulo-10 --in-place
```

**3. Spiegazione delle variabili e dei valori**  
* **`migrations:run`**: Esegue lo script pendente per aggiornare lo schema.
* **`--source=task-modulo-10`**: Mantiene l'isolamento dell'operazione sulla sandbox di test.
* **`--in-place`**: Modifica la sandbox corrente senza crearne una derivata.

---

### 3.5 Risultato Atteso e Verifica nella Dashboard (Punto 3)

**1. Spiegazione Concettuale**  
L'esecuzione della terza migrazione stabilisce l'associazione strutturale tra le due entità. Il vincolo di riferimento creato via script è direttamente riscontrabile nello schema del modello Nave.

**2. Risultato Visivo nella Dashboard**  
Nell'interfaccia di amministrazione di DatoCMS, accedendo alla sezione **Schema** e selezionando il modello **Nave**, possiamo osservare il nuovo campo di collegamento generato dallo script di migrazione, evidenziato dalla freccia rossa.

![Schema del modello Nave con campo Single Link Porto di Appartenenza](../Screenshot%20documentazione/NaveModels1.png)

Come mostrato nello screenshot dello Schema (`NaveModels1.png`):
* **Sezione `Schema` (Modello `Nave`)**: Compare il nuovo campo relazionale **`Porto di Appartenenza`** (`porto`), contrassegnato con la tipologia **Single Link** e il riferimento esplicito `References -> Porto`.
* **Configurazione delle Validazioni**: Cliccando sul campo e accedendo alla scheda *Validations*, la voce *Accept only specified model* risulta attiva sul modello *Porto*, garantendo il vincolo d'integrità relazionale inviato via CLI.

---

## 4. Organizzazione dei Campi: Fieldset Visivi vs Blocchi Modulari Replicabili

In DatoCMS, un **Fieldset** tradizionale gestisce unicamente l'organizzazione visiva e statica dei campi nell'interfaccia di editing (es. raggruppare i campi sotto un'intestazione espandibile). Per realizzare strutture di campi **replicabili** $0..N$ volte all'interno di un record, la piattaforma mette a disposizione i **Blocchi Modulari** (Modular Content).

---

### 4.1 Generazione del file di migrazione per il blocco modulare

**1. Spiegazione Concettuale**  
Generiamo uno script di migrazione dedicato per definire la struttura del blocco modulare replicabile (es. *Registro Manutenzioni* per le navi) e la sua associazione al modello `Nave`.

**2. Estratto di Codice**  
```bash
npx datocms migrations:new "add_maintenance_modular_block_to_ship"
```

**3. Spiegazione delle variabili e dei valori**  
* **`migrations:new`**: Comando CLI per istanziare un nuovo file di migrazione.
* **`"add_maintenance_modular_block_to_ship"`**: Descrizione sintetica del contenuto della migrazione.

---

### 4.2 Definizione del Blocco Modulare Replicabile e dei suoi Campi

**1. Spiegazione Concettuale**  
A differenza dei modelli standard, un blocco modulare viene creato impostando la proprietà `modular_block: true`. Successivamente, creiamo i campi interni destinati a ripetersi per ogni istanza del blocco (es. `data_intervento` e `descrizione`).

**2. Estratto di Codice**  
```javascript
// 1. Creazione dello schema per il Blocco Modulare
const maintenanceBlock = await client.itemTypes.create({
  name: 'Intervento Manutenzione',
  api_key: 'maintenance_entry',
  modular_block: true,
});

// 2. Aggiunta dei campi interni al Blocco Modulare
await client.fields.create(maintenanceBlock, {
  label: 'Data Intervento',
  api_key: 'data_intervento',
  field_type: 'date',
  validators: { required: {} },
});

await client.fields.create(maintenanceBlock, {
  label: 'Descrizione Intervento',
  api_key: 'descrizione',
  field_type: 'text',
  validators: { required: {} },
});
```

**3. Spiegazione delle variabili e dei valori**  
* **`modular_block: true`**: Identifica l'entità come blocco componibile/replicabile anziché come modello di contenuto autonomo.
* **`field_type: 'date'`**: Campo per la selezione di una data solare.
* **`field_type: 'text'`**: Campo di testo multilinea (area di testo) per note estese.

---

### 4.3 Collegamento del Blocco Modulare al Modello "Nave"

**1. Spiegazione Concettuale**  
Per permettere l'inserimento di $0..N$ blocchi all'interno del modello `Nave`, si crea un campo di tipo `rich_text` (Modular Content) sul modello `ship`, applicando il validatore `rich_text_blocks` per autorizzare l'uso del blocco modulare appena creato.

**2. Estratto di Codice**  
```javascript
const shipModel = await client.itemTypes.find('ship');

// Creazione del campo Modular Content (Insieme di blocchi replicabili)
await client.fields.create(shipModel, {
  label: 'Registro Manutenzioni',
  api_key: 'registro_manutenzioni',
  field_type: 'rich_text',
  validators: {
    rich_text_blocks: {
      item_types: [maintenanceBlock.id],
    },
  },
});
```

**3. Spiegazione delle variabili e dei valori**  
* **`field_type: 'rich_text'`**: Tipologia di campo usata dalla Content Management API per rappresentare il contenitore di **Modular Content** (elenco dinamico di blocchi).
* **`validators.rich_text_blocks`**: Definisce l'elenco degli ID dei blocchi modulari che l'editor può inserire all'interno di questo campo replicabile.

---

### 4.4 Codice Completo dello Script (`migrations/XXXXX_add_maintenance_modular_block_to_ship.js`)

```javascript
'use strict';

/**
 * Script di migrazione per la creazione di un blocco modulare replicabile
 * e l'associazione al modello Nave.
 */
module.exports = async (client) => {
  // 1. Recupero del modello Nave esistente
  const shipModel = await client.itemTypes.find('ship');

  // 2. Creazione dello schema per il Blocco Modulare Replicabile
  const maintenanceBlock = await client.itemTypes.create({
    name: 'Intervento Manutenzione',
    api_key: 'maintenance_entry',
    modular_block: true,
  });

  // 3. Aggiunta dei campi al Blocco Modulare
  await client.fields.create(maintenanceBlock, {
    label: 'Data Intervento',
    api_key: 'data_intervento',
    field_type: 'date',
    validators: { required: {} },
  });

  await client.fields.create(maintenanceBlock, {
    label: 'Descrizione Intervento',
    api_key: 'descrizione',
    field_type: 'text',
    validators: { required: {} },
  });

  // 4. Collegamento del Blocco Modulare al modello Nave come campo replicabile
  await client.fields.create(shipModel, {
    label: 'Registro Manutenzioni',
    api_key: 'registro_manutenzioni',
    field_type: 'rich_text',
    validators: {
      rich_text_blocks: {
        item_types: [maintenanceBlock.id],
      },
    },
  });
};
```

---

### 4.5 Esecuzione dello script sulla Sandbox

**1. Spiegazione Concettuale**  
Applichiamo la migrazione del blocco modulare sulla sandbox attiva `task-modulo-10`.

**2. Estratto di Codice**  
```bash
npx datocms migrations:run --source=task-modulo-10 --in-place
```

**3. Spiegazione delle variabili e dei valori**  
* **`migrations:run`**: Esegue lo script pendente nella cartella `./migrations`.
* **`--source=task-modulo-10`**: Specifica l'ambiente sandbox isolato.
* **`--in-place`**: Aggiorna direttamente la sandbox corrente.

---

### 4.6 Risultato Atteso e Verifica nella Dashboard (Punto 4)

**1. Spiegazione Concettuale**  
Al termine della quarta migrazione, la dashboard aggiorna sia la struttura dello Schema (aggiungendo il Modular Content) sia la maschera di inserimento dei contenuti.

**2. Risultato Visivo nello Schema**  
Nella scheda **Schema** relativa al modello **Nave**, possiamo verificare l'aggiunta del campo di tipo Modular Content, contrassegnato dalla freccia rossa, che abilita il contenitore per i blocchi componibili.

![Schema del modello Nave con campo Modular Content Registro Manutenzioni](../Screenshot%20documentazione/NaveModels2.png)

Come evidenziato nello screenshot dello Schema (`NaveModels2.png`):
* **Sezione `Schema` $\rightarrow$ Modello `Nave`**: È presente il campo **`Registro Manutenzioni`** (`registro_manutenzioni`) configurato come **Modular Content (Multiple blocks)** con indicazione `Blocks -> Intervento Manutenzione`.
* **Sezione `Schema` $\rightarrow$ Tab `Blocks`**: Compare il blocco componibile **`Intervento Manutenzione`** con i relativi campi `Data Intervento` e `Descrizione Intervento`.

**3. Risultato Visivo nella Maschera di Editing (Content)**  
Spostandoci nella sezione **Content** e avviando la creazione di un nuovo record per la raccolta **Nave**, la dashboard genera automaticamente la form completa con tutti gli input, i selettori di relazione e i pulsanti per l'inserimento dinamico dei blocchi.

![Maschera di inserimento record Nave con campo Single Link e Blocco Modulare](../Screenshot%20documentazione/NaveContent1.png)

Come mostrato nell'interfaccia di editing dei contenuti (`NaveContent1.png`):
1. **Campi Base**: Input per `Nome Nave*`, `Codice IMO*` (con validatore di unicità attivo), `Capienza Passeggeri` (con limite $min \ge 1$), e l'interruttore `In Servizio`.
2. **Relazione Single Link**: Il campo `Porto di Appartenenza` mette a disposizione i pulsanti **`+ New Porto`** e **`From library`** per collegare i record della collezione Porto.
3. **Blocco Modulare Replicabile**: Il campo `Registro Manutenzioni` include il pulsante **`+ New Intervento Manutenzione`**, abilitando l'inserimento dinamico di $0..N$ log di manutenzione all'interno dello stesso record.

---

## 5. Seeding Data: Popolamento Programmatico dei Dati via CLI

Dopo aver definito lo schema, popoliamo la sandbox con dati reali tramite uno script di migrazione dedicato. In questo passaggio vedremo come gestire l'upload programmatico di file multimediali, la creazione dei record parent (Porto), l'inserimento dei record child (Nave) e la pubblicazione forzata per evitare di dover cliccare "Publish" manualmente nella Dashboard.

---

### 5.1 Generazione del file di migrazione per il seeding

**1. Spiegazione Concettuale**  
Generiamo uno script di migrazione che conterrà le istruzioni CMA per creare gli asset e i record di test.

**2. Estratto di Codice**  
```bash
npx datocms migrations:new "seed_ports_and_ships_data"
```

**3. Spiegazione delle variabili e dei valori**  
* **`migrations:new`**: Comando CLI per creare il file vuoto nella cartella `./migrations`.
* **`"seed_ports_and_ships_data"`**: Identificatore descrittivo dello script di popolamento.

---

### 5.2 Caricamento di Asset Media e Creazione dei Record "Porto"

**1. Spiegazione Concettuale**  
Per compilare il campo `foto_copertina`, utilizziamo `client.uploads.createFromUrl()` che scarica un'immagine remota e la registra nella Media Library di DatoCMS. Utilizziamo poi l'ID dell'asset restituito per creare il primo record Porto. Infine, utilizziamo il comando `client.items.publish()` per pubblicare il record, aggirando così lo stato di bozza.

**2. Estratto di Codice**  
```javascript
// 1. Caricamento Asset nella Media Library
const coverPhoto = await client.uploads.createFromUrl({
  url: '[https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86](https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86)',
  filename: 'porto-napoli.jpg',
  skipValidation: true,
});

// 2. Creazione Record Porto (Stato Iniziale: Bozza/Draft)
const portModel = await client.itemTypes.find('port');

const portNapoli = await client.items.create({
  item_type: { type: 'item_type', id: portModel.id },
  nome: 'Porto di Napoli',
  citta: 'Napoli',
  foto_copertina: {
    upload_id: coverPhoto.id,
  },
});

// 3. Pubblicazione Forzata via API
await client.items.publish(portNapoli.id);
```

**3. Spiegazione delle variabili e dei valori**  
* **`client.uploads.createFromUrl`**: Metodo CMA per importare asset multimediali da sorgenti esterne.
* **`upload_id`**: Identificatore univoco della risorsa caricata nella Media Library, richiesto per valorizzare i campi di tipo `file`.
* **`client.items.create`**: Metodo CMA per inserire un nuovo record (contenuto).
* **`client.items.publish(id)`**: Metodo per forzare la pubblicazione di un record specifico, evitando interventi manuali nell'interfaccia.

---

### 5.3 Creazione del Record "Nave" con Relazione e Blocchi Modulari

**1. Spiegazione Concettuale**  
Creiamo un record Nave associando:
* L'ID del porto creato in precedenza nel campo `porto` (Single Link).
* Un array di oggetti nel campo `registro_manutenzioni` (Modular Content), definendo la struttura interna dei blocchi.
* Effettuiamo la pubblicazione finale del record generato.

**2. Estratto di Codice**  
```javascript
const shipModel = await client.itemTypes.find('ship');
const maintenanceBlock = await client.itemTypes.find('maintenance_entry');

const naveVesuvio = await client.items.create({
  item_type: { type: 'item_type', id: shipModel.id },
  nome: 'Vesuvio Express',
  codice_imo: 'IMO9876543',
  capienza_passeggeri: 450,
  in_servizio: true,
  porto: portNapoli.id, // Collegamento Single Link al Porto
  registro_manutenzioni: [
    {
      type: 'item',
      attributes: {
        data_intervento: '2026-01-15',
        descrizione: 'Ispezione periodica dei motori e manutenzione scafo.',
      },
      relationships: {
        item_type: {
          data: { type: 'item_type', id: maintenanceBlock.id },
        },
      },
    },
  ],
});

// Pubblicazione Forzata via API
await client.items.publish(naveVesuvio.id);
```

**3. Spiegazione delle variabili e dei valori**  
* **`porto: portNapoli.id`**: Assegna l'ID del record parent per soddisfare la relazione 1:N.
* **`registro_manutenzioni`**: Array di oggetti che rappresenta il contenuto del blocco modulare.
* **`type: 'item'`**: Identifica l'elemento come blocco inline di contenuto.
* **`item_type: { data: { type: 'item_type', id: maintenanceBlock.id } }`**: Specifica l'ID dello schema del Blocco Modulare da istanziare.

---

### 5.4 Codice Completo dello Script (`migrations/XXXXX_seed_ports_and_ships_data.js`)

```javascript
'use strict';

/**
 * Script di migrazione per il seeding dei dati (Porti, Navi, Asset e Blocchi Modulari).
 * Include la pubblicazione forzata per bypassare lo stato Draft.
 */
module.exports = async (client) => {
  // 1. Recupero dei modelli e blocchi esistenti
  const portModel = await client.itemTypes.find('port');
  const shipModel = await client.itemTypes.find('ship');
  const maintenanceBlock = await client.itemTypes.find('maintenance_entry');

  // 2. Upload dell'immagine di copertina
  const coverPhoto = await client.uploads.createFromUrl({
    url: '[https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86](https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86)',
    filename: 'porto-napoli.jpg',
    skipValidation: true,
  });

  // 3. Creazione Record "Porto di Napoli"
  const portNapoli = await client.items.create({
    item_type: { type: 'item_type', id: portModel.id },
    nome: 'Porto di Napoli',
    citta: 'Napoli',
    foto_copertina: {
      upload_id: coverPhoto.id,
    },
  });

  // Pubblicazione immediata del Porto
  await client.items.publish(portNapoli.id);

  // 4. Creazione Record "Nave Vesuvio Express" legata a Napoli
  const naveVesuvio = await client.items.create({
    item_type: { type: 'item_type', id: shipModel.id },
    nome: 'Vesuvio Express',
    codice_imo: 'IMO9876543',
    capienza_passeggeri: 450,
    in_servizio: true,
    porto: portNapoli.id,
    registro_manutenzioni: [
      {
        type: 'item',
        attributes: {
          data_intervento: '2026-01-15',
          descrizione: 'Ispezione periodica dei motori e manutenzione scafo.',
        },
        relationships: {
          item_type: {
            data: { type: 'item_type', id: maintenanceBlock.id },
          },
        },
      },
    ],
  });

  // Pubblicazione immediata della Nave
  await client.items.publish(naveVesuvio.id);
};
```

---

### 5.5 Esecuzione dello script sulla Sandbox

**1. Spiegazione Concettuale**  
Applichiamo la migrazione di seeding per popolare la nostra sandbox in maniera automatica.

**2. Estratto di Codice**  
```bash
npx datocms migrations:run --source=task-modulo-10 --in-place
```

---

### 5.6 Risultato Atteso e Verifica nella Dashboard (Punto 5)

**1. Spiegazione Concettuale**  
Al termine della migrazione di seeding, le tabelle della sezione **Content** non saranno più vuote ma ospiteranno i record generati dallo script, già visibili al pubblico e non in stato di bozza.

**2. Verifica Visiva - Collezione "Porto"**  
Accedendo alla raccolta **Porto**, troverai la riga del record **Porto di Napoli** con il pallino verde che ne certifica lo stato *Published*.

![Elenco record nella collezione Porto](../Screenshot%20documentazione/PortoPreview1.png)

Entrando nel dettaglio del record tramite la schermata di edit, potrai verificare la corretta associazione dei dati testuali e l'immagine di copertina regolarmente scaricata e caricata via API.

![Maschera di modifica del record Porto di Napoli](../Screenshot%20documentazione/PortoContents1.png)

**3. Verifica Visiva - Collezione "Nave"**  
Nella raccolta **Nave** comparirà la riga del record **Vesuvio Express**, anch'esso nello stato *Published*.

![Elenco record nella collezione Nave](../Screenshot%20documentazione/NavePreview1.png)

Aprendo in modifica il record, potrai constatare l'avvenuto inserimento di tutti i dati complessi:
* I campi anagrafici sono popolati.
* Il campo relazionale *Porto di Appartenenza* espone il collegamento Single Link generato verso il record "Porto di Napoli".
* Nel blocco *Registro Manutenzioni* è presente il primo log d'intervento configurato via script, regolarmente valorizzato con data e descrizione.

![Maschera di modifica del record Vesuvio Express con relazioni e blocchi](../Screenshot%20documentazione/NaveModel2.png)