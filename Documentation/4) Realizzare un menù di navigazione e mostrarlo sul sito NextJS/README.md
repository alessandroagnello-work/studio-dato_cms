# Guida Tecnica: Menù di Navigazione Dinamico con DatoCMS e Next.js

Documentazione dei passaggi per configurare un modello per le voci di menù su DatoCMS con ordinamento manuale (Drag & Drop) e la loro integrazione nel `RootLayout` di Next.js (`src/app/layout.js`).

---

## 1. Configurazione Schema e Ordinamento su DatoCMS

### 1.1 Creazione del Modello e dei Campi
1. Dalla dashboard di DatoCMS, accedere a **Schema** -> **Create new model**.
2. Inserire il nome `Menu Item` (Model ID generato automaticamente: `menu_item`).
3. Cliccare su **Add new field**, selezionare **Text** -> **Single-line string**:
   * **Name:** `Label` (Field ID: `label`) -> Spuntare **Required** nelle validazioni.
4. Cliccare nuovamente su **Add new field**, selezionare **Text** -> **Single-line string**:
   * **Name:** `URL` (Field ID: `url`) -> Spuntare **Required** nelle validazioni.

### 1.2 Attivazione Ordinamento Manuale (Drag & Drop)
1. In **Schema** -> **Menu Item**, cliccare su **Edit model**.
2. Aprire la scheda **Presentation**.
3. Alla voce **Ordering / Sort order**, selezionare **Manual (drag and drop)**.
4. Cliccare **Save model**.

---

## 2. Inserimento e Ordinamento Contenuti (Content)

1. Spostarsi nella sezione **Content** nel menu in alto e selezionare **Menu Item**.
2. Creare i record tramite il pulsante **New record**:
   * **Record 1:** Label: `Home` | URL: `/` -> **Save** e **Publish**.
   * **Record 2:** Label: `Chi siamo` | URL: `/chi-siamo` -> **Save** e **Publish**.
3. Nella vista ad elenco di **Menu Item**, trascinare la riga `Home` sopra `Chi siamo` per impostare l'ordine desiderato.

---

## 3. Spiegazione delle Modifiche nel Codice

* **Query GraphQL con Ordinamento (`orderBy: position_ASC`)**:
  Recupera le voci di menù esattamente nell'ordine impostato tramite il Drag & Drop configurato nel pannello di controllo.
* **Componente `<Link>` (`next/link`)**:
  Garantisce la navigazione tra le pagine lato client senza ricaricamento completo del browser.
* **Gestione Errori (`try/catch`)**:
  Previene blocchi durante il rendering server-side del layout in caso di problemi di rete o errori nel recupero dati.

---

## 4. Implementazione del Codice Sorgente (`src/app/layout.js`)

### 4.1 La Query GraphQL (`LAYOUT_QUERY`)
Nella query richiediamo l'elenco `allMenuItems` specificando l'ordinamento crescente per posizione:

```graphql
query LayoutQuery {
  allMenuItems(orderBy: position_ASC) {
    id
    label
    url
  }
}
```

> **Nota per query esistenti**: Se nel file `src/app/layout.js` è già presente `LAYOUT_QUERY` (es. per il Favicon `_site`), aggiungi semplicemente l'oggetto `allMenuItems(orderBy: position_ASC)` al suo interno:
>
> ```graphql
> query LayoutQuery {
>   allMenuItems(orderBy: position_ASC) {
>     id
>     label
>     url
>   }
>   _site {
>     faviconMetaTags {
>       attributes
>       content
>       tag
>     }
>   }
> }
> ```

---

### 4.2 Codice Sorgente Completo

```javascript
import Link from 'next/link';
import { performRequest } from '@/lib/datocms';
import '@/app/globals.css';

// Query GraphQL per il menù con ordinamento Drag & Drop
const LAYOUT_QUERY = `
  query LayoutQuery {
    allMenuItems(orderBy: position_ASC) {
      id
      label
      url
    }
  }
`;

export default async function RootLayout({ children }) {
  let menuItems = [];

  // Gestione errori lato server durante il recupero dei dati
  try {
    const data = await performRequest(LAYOUT_QUERY);
    menuItems = data?.allMenuItems || [];
  } catch (error) {
    console.error('Errore nel recupero del menu:', error);
  }

  return (
    <html lang="it" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">
        <header className="p-4 border-b border-gray-800 bg-gray-900">
          <nav className="flex gap-4 max-w-5xl mx-auto">
            {menuItems.map((item) => (
              <Link className="hover:underline text-sm font-medium text-gray-200" href="{item.url}" key="{item.id}">
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
```