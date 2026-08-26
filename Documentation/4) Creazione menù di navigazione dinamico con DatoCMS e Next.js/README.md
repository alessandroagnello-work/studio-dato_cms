# Guida Tecnica (Modulo 4): Creazione menù di navigazione dinamico con DatoCMS e Next.js

## Introduzione

### Perché creare un menù dinamico dal CMS?
In un sito statico tradizionale, le voci di navigazione (Home, Chi Siamo, Contatti, ecc.) sono scritte ("hard-coded") direttamente nel codice sorgente. Questo significa che ogni volta che il cliente vuole aggiungere una nuova pagina o cambiare l'ordine delle voci nel menù, deve richiedere l'intervento di uno sviluppatore. 
Creando un modello dedicato su DatoCMS, diamo invece al team editoriale il potere di gestire in totale autonomia le voci di navigazione, i relativi link e persino il loro ordine visivo tramite una semplice interfaccia Drag & Drop, senza toccare una riga di codice.

---

## Riferimenti Ufficiali

* **DatoCMS Content Modelling:** [https://www.datocms.com/docs/content-modelling](https://www.datocms.com/docs/content-modelling)
* **DatoCMS Content Delivery API Pagination:** [https://www.datocms.com/docs/content-delivery-api/pagination](https://www.datocms.com/docs/content-delivery-api/pagination)
* **DatoCMS How to Fetch Records:** [https://www.datocms.com/docs/content-delivery-api/how-to-fetch-records](https://www.datocms.com/docs/content-delivery-api/how-to-fetch-records)

---

## 1. Configurazione Schema e Ordinamento su DatoCMS

### 1.1 Creazione del Modello e dei Campi
1. Dalla dashboard di DatoCMS, accedere alla sezione **Schema** e cliccare su **Create new model**.
2. Inserire il nome `Menu Item` (il Model ID generato automaticamente sarà `menu_item`).
3. Cliccare su **Add new field**, selezionare **Text** -> **Single-line string**:
   * **Name:** `Label` (Field ID: `label`). Servirà per il testo visibile del bottone.
   * Spuntare la casella **Required** nella scheda *Validations*.
4. Cliccare nuovamente su **Add new field**, selezionare **Text** -> **Single-line string**:
   * **Name:** `URL` (Field ID: `url`). Servirà per indicare la destinazione del link.
   * Spuntare la casella **Required** nella scheda *Validations*.

### 1.2 Attivazione Ordinamento Manuale (Drag & Drop)
Per permettere di ordinare liberamente i bottoni del menù:
1. Rimanendo in **Schema** -> **Menu Item**, cliccare su **Edit model** (vicino al titolo).
2. Aprire la scheda **Presentation**.
3. Alla voce **Ordering / Sort order**, selezionare l'opzione **Manual (drag and drop)**.
4. Cliccare **Save model**.

---

## 2. Inserimento e Ordinamento Contenuti (Content)

1. Spostarsi nella sezione **Content** dal menu principale in alto e selezionare **Menu Item** sulla colonna di sinistra.
2. Creare i record tramite il pulsante **New record**:
   * **Record 1:** Label: `Home` | URL: `/` -> **Save** e **Publish**.
   * **Record 2:** Label: `Chi siamo` | URL: `/chi-siamo` -> **Save** e **Publish**.
3. Tornati nella vista ad elenco di **Menu Item**, è ora possibile trascinare la riga `Home` sopra `Chi siamo` per impostare l'ordine desiderato che si rifletterà sul sito web.

---

## 3. Implementazione nel Progetto Next.js

Ora andiamo a collegare i dati creati nel CMS all'interno del nostro layout globale.

### Spiegazione dei Nuovi Concetti
* **Ordinamento GraphQL (`orderBy: position_ASC`)**: Aggiungendo questo parametro alla query, diciamo a DatoCMS di restituirci l'array delle voci di menù esattamente nell'ordine impostato tramite il Drag & Drop (dove 1 è la posizione più in alto).
* **Componente `<Link>` di Next.js**: Utilizzeremo il tag `<Link>` importato da `next/link` invece del classico tag HTML `<a>`. Questo garantisce una navigazione lato client (Single Page Application): il sito cambierà pagina istantaneamente senza dover ricaricare completamente il browser.
* **Gestione Errori (`try/catch`)**: Poiché il Layout è un elemento critico per il sito, avvolgiamo la chiamata API in un blocco `try/catch`. In questo modo, se c'è un problema di rete momentaneo, l'applicazione non andrà in crash bloccando l'intero sito, ma riporterà l'errore in console, limitandosi magari a non renderizzare il menù.

---

### 3.1 Modifica del file `src/app/layout.js`
Questo file è stato modificato nel modulo precedente per gestire la Favicon. Andiamo ad aggiornarlo implementando il menù di navigazione.

**Cosa andiamo a modificare:**
1. **Import:** Aggiungiamo l'import del componente `Link` di Next.js e del file CSS globale (se presente).
2. **Query:** Integriamo la voce `allMenuItems(orderBy: position_ASC)` all'interno della `LAYOUT_QUERY` già esistente (in modo da eseguire una sola chiamata al server per ricevere sia la Favicon che il Menù).
3. **Logica Async:** Trasformiamo il `RootLayout` in una funzione asincrona (`async function`) in modo che possa eseguire l'`await` per recuperare i dati.
4. **Rendering:** Inseriamo un tag `<header>` e mappiamo l'array `menuItems` per generare dinamicamente i vari `<Link>`.

**Codice Sorgente Completo Aggiornato:**

```javascript
import Link from 'next/link';
import { performRequest } from '@/lib/datocms';
import { toNextMetadata } from 'react-datocms/seo';
import '@/app/globals.css'; // Manteniamo i CSS globali se Next.js li ha generati

// 1. QUERY AGGIORNATA: Recuperiamo sia i tag Favicon sia le voci di menù ordinate
const LAYOUT_QUERY = `
  query LayoutQuery {
    _site {
      faviconMetaTags {
        attributes
        content
        tag
      }
    }
    allMenuItems(orderBy: position_ASC) {
      id
      label
      url
    }
  }
`;

// 2. Metadati (Preesistente dal modulo Favicon)
export async function generateMetadata() {
  const data = await performRequest(LAYOUT_QUERY);
  return toNextMetadata(data?._site?.faviconMetaTags || []);
}

// 3. Layout trasformato in asincrono per gestire il recupero dati
export default async function RootLayout({ children }) {
  let menuItems = [];

  // Gestione sicura della chiamata API
  try {
    const data = await performRequest(LAYOUT_QUERY);
    menuItems = data?.allMenuItems || [];
  } catch (error) {
    console.error('Errore nel recupero del layout:', error);
  }

  return (
    <html lang="it" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-950 text-gray-100">
        
        {/* Nuovo blocco Header con il menù dinamico */}
        <header className="p-4 border-b border-gray-800 bg-gray-900">
          <nav className="flex gap-4 max-w-5xl mx-auto">
            {menuItems.map((item) => (
              <Link className="hover:underline text-sm font-medium text-gray-200" href="{item.url}" key="{item.id}">
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        {/* Contenuto principale delle pagine */}
        <main className="flex-grow">
          {children}
        </main>
        
      </body>
    </html>
  );
}
```