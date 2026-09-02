# Guida Tecnica (Modulo 10): Modellazione Avanzata via CLI, Relazioni e Seeding Data

## Riferimenti Ufficiali

* **DatoCMS CLI Commands:** [https://www.datocms.com/docs/cli](https://www.datocms.com/docs/cli)
* **DatoCMS Scripting Migrations:** [https://www.datocms.com/docs/scripting-migrations/scripting-migrations-with-the-datocms-cli](https://www.datocms.com/docs/scripting-migrations/scripting-migrations-with-the-datocms-cli)
* **Content Management API (Item Types):** [https://www.datocms.com/docs/content-management-api/resources/item-type](https://www.datocms.com/docs/content-management-api/resources/item-type)
* **Content Management API (Fields):** [https://www.datocms.com/docs/content-management-api/resources/field](https://www.datocms.com/docs/content-management-api/resources/field)

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
 * Script di migrazione per la creazione programmatic dei modelli Porto e Nave.
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

### 3.5 Risultato Atteso e Verifica della Reference nella Dashboard (Punto 3)

**1. Spiegazione Concettuale**  
L'esecuzione della terza migrazione stabilisce l'associazione strutturale tra le due entità. Il vincolo di riferimento creato via script è direttamente riscontrabile nel pannello di configurazione del campo.

**2. Risultato Visivo e Localizzazione della Reference**

* **Sezione `Schema` (Modello `Nave`)**: Nella lista dei campi del modello Nave compare il nuovo campo relazionale **`Porto di Appartenenza`** (`porto`), contrassegnato con la tipologia **Single Link**.

* **Verifica della Reference (`Edit field` $\rightarrow$ `Validations`)**: Cliccando sul campo **Porto di Appartenenza** e aprendo la scheda **Validations** della schermata di modifica, è possibile verificare la presenza della casella spuntata **`Accept only specified model`** con associato il tag del modello 

**`Porto`**. Questo dimostra che il validatore `item_item_type: { item_types: [portModel.id] }` inviato dalla CLI ha correttamente ristretto l'associazione alle sole entità di tipo Porto.

* **Sezione `Content` (Form di creazione `Nave`)**: Creando una nuova Nave, la maschera d'inserimento mostrerà il widget di selezione relazionale collegato alla collezione **Porto**.


_________________________________________________________________________________________________________


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
Al termine della migrazione, la dashboard offrirà una sezione dedicata alla gestione dei blocchi componibili e aggiornerà il form di inserimento del modello `Nave`.

**2. Risultato Visivo e Localizzazione del Blocco Replicabile**
* **Sezione `Schema` $\rightarrow$ Tab `Blocks`**: Sotto la voce Blocks comparirà la nuova entità **`Intervento Manutenzione`** (`maintenance_entry`) contenente i campi `Data Intervento` e `Descrizione Intervento`.
* **Sezione `Schema` $\rightarrow$ Modello `Nave`**: Nello schema del modello Nave sarà presente il campo **`Registro Manutenzioni`** (`registro_manutenzioni`) configurato come **Modular Content**.
* **Sezione `Content` (Raccolta `Nave`)**: La tabella principale continuerà a mostrare il messaggio *"This collection is empty"*. Questo è **assolutamente normale**, poiché finora abbiamo costruito solo l'impalcatura (lo Schema) e non abbiamo ancora inserito dati reali (Record).
* **Verifica del Form (Creazione Record)**: Cliccando sul pulsante blu **`Create a new record`** all'interno della raccolta Nave, si aprirà la maschera di inserimento completa.

![Maschera di inserimento record Nave con campo Single Link e Blocco Modulare](../Screenshot%20documentazione/NaveContent.png)

Come evidenziato nello screenshot sopra (`NaveContent.png`), l'editor troverà l'interfaccia di inserimento completa:
1. **Campi Base**: Input per `Nome Nave*`, `Codice IMO*` (con validatore di unicità attivo), `Capienza Passeggeri` (con limite $min \ge 1$), e l'interruttore `In Servizio`.
2. **Relazione Single Link**: Il campo `Porto di Appartenenza` con il selettore integrato e i pulsanti **`+ New Porto`** e **`From library`** per collegare i record della collezione Porto.
3. **Blocco Modulare Replicabile**: Il campo `Registro Manutenzioni` corredato dal pulsante **`+ New Intervento Manutenzione`**, che abilita l'inserimento dinamico di $0..N$ log di manutenzione all'interno dello stesso record.