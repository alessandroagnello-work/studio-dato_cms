# Guida Tecnica: Realizzare un menù di navigazione e mostrarlo sul sito NextJS


## 1. Configurazione Schema e Ordinamento su DatoCMS

### Creazione del Modello e dei Campi

1. Dalla dashboard di DatoCMS, accedere a **Schema** -> **Create new model**.

2. Inserire il nome `Menu Item` (Model ID generato automaticamente: `menu_item`).

3. Cliccare su **Add new field**, selezionare **Text** -> **Single-line string**:

   * **Name:** `Label` (Field ID: `label`) -> Spuntare `Required` nelle validazioni.

4. Cliccare nuovamente su **Add new field**, selezionare **Text** -> **Single-line string**:

   * **Name:** `URL` (Field ID: `url`) -> Spuntare `Required` nelle validazioni.

### Attivazione Ordinamento Manuale (Drag & Drop)

1. In **Schema** -> **Menu Item**, cliccare su **Edit model**.

2. Aprire la scheda **Presentation**.

3. Alla voce **Ordering / Sort order**, selezionare **Manual (drag and drop)**.

4. Cliccare **Save model**.

---

## 2. Inserimento e Ordinamento Contenuti (Content)

1. Spostarsi nella sezione **Content** nel menu in alto e selezionare **Menu Item**.
2. Creare i record tramite **New record**:
   * **Record 1:** Label: `Home` | URL: `/` -> **Save** e **Publish**.
   * **Record 2:** Label: `Chi siamo` | URL: `/chi-siamo` -> **Save** e **Publish**.
3. Nella vista ad elenco di **Menu Item**, trascinare la riga `Home` sopra `Chi siamo` per impostare l'ordine desiderato.

---

## 3. Spiegazione delle Modifiche nel Codice (`src/app/layout.js`)

* **Query GraphQL con Ordinamento (`position_ASC`)**:
  Recupera le voci del menu ordinate secondo il Drag & Drop configurato nel pannello di controllo.
* **Componente `<Link>` (`next/link`)**:
  Garantisce la navigazione tra le pagine lato client senza ricaricamento completo del browser.
* **Gestione Errori (`try/catch`)**:
  Previene blocchi durante il rendering server-side del layout o il recupero dei metadati in caso di fallimento della rete.

---

## 3. Aggiunta gestione menù di navigazione in nextjs (`src/app/layout.js`)

## Aggiungiamo i seguenti:

# Import:

```javascript

import Link from "next/link";

```

# Nuova constante LAYOUT_QUERY per la generazione di contenuti:

```javascript

const LAYOUT_QUERY = `
  query {
    allMenuItems {
      id
      label
      url
    }
  }
`;

```    

# Nota: se ne esiste già 1 di constante di questo tipo, aggiungere dentro la sua query solo:

  ```javascript

    allMenuItems {
      id
      label
      url
    }

   ```

# Recupero dati nel RootLayout (esegiuamo un check per vedere se recupera tutti i dati del menu, sennò ritorna un'errore)

# RootLayout diventa async, siccome deve aspettare l'arrivo dei dati da DatoCMS

 ```javascript

export default async function RootLayout({ children }) {
    //contenuto
}

```

# All'inizio del RootLayout, eseguiamo il check

  ```javascript

    let menuItems = [];

    try {
        const data = await performRequest(LAYOUT_QUERY);
        menuItems = data?.allMenuItems || [];
    } catch (error) {
        console.error("Errore nel recupero del menu:", error);
    }
  

   ```

# Nel return invece portiamo il lato visivo (giù un esempio banale della view della barra di navigazione):


 ```javascript

        return (
        <html
        lang="it"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
        <body className="min-h-full flex flex-col">
            <header className="p-4 border-b">
            <nav className="flex gap-4">
                {menuItems.map((item) => (
                <Link className="hover:underline" href={item.url} key={item.id}>
                    {item.label}
                </Link>
                ))}
            </nav>
            </header>
            {children}
        </body>
        </html>
    );
  

   ```



