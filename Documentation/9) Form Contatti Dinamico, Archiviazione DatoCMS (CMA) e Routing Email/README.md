# Guida Tecnica (Modulo 9): Form Contatti Dinamico CMS-Driven, Archiviazione DatoCMS (CMA) e Routing Email

## Introduzione e Scopo del Modulo

### Cos'è un'Architettura Headless per i Form?
Nei progetti web tradizionali (come WordPress o siti statici), i testi di un modulo di contatto (es. la scritta "Nome", "Cognome", "Invia Messaggio") sono spesso scritti direttamente nel codice sorgente (hardcoded). Questo significa che per cambiare una traduzione o modificare l'etichetta di un campo, è necessario l'intervento di uno sviluppatore.

In questo modulo, implementiamo un'architettura **"Headless" (senza testa)**: separiamo la gestione dei testi (che avviene sul CMS) dalla visualizzazione (che avviene su Next.js). 
Il flusso di lavoro si articola in tre livelli:

1. **DatoCMS CDA (Content Delivery API / Sola Lettura)**: Tramite una query GraphQL, Next.js chiede a DatoCMS tutti i testi della pagina tradotti (es. i titoli e le etichette dei campi).
2. **Componente React (Frontend)**: Riceve i testi da DatoCMS, disegna l'interfaccia a schermo e raccoglie i dati digitati dall'utente.
3. **Next.js Server Action & DatoCMS CMA (Scrittura e Backend)**: Quando l'utente preme "Invia", il server elabora i dati in modo sicuro. Archivia una copia del messaggio su DatoCMS, legge l'argomento scelto dall'utente e invia l'email al reparto corretto tramite il servizio Resend.

---

## Riferimenti Ufficiali

* **Next.js Server Actions & Mutations:** [https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
* **DatoCMS Content Management API (CMA - Node.js):** [https://www.datocms.com/docs/content-management-api/using-the-nodejs-clients](https://www.datocms.com/docs/content-management-api/using-the-nodejs-clients)
* **Resend Node.js SDK:** [https://resend.com/docs/send-with-nodejs](https://resend.com/docs/send-with-nodejs)

---

## 1. Configurazione del Database su DatoCMS

Per mantenere una netta separazione delle responsabilità, creiamo due "Modelli" (tabelle del database) separati all'interno di DatoCMS:

* **Il modello dell'Interfaccia (`Contact Page`)**: Serve ai redattori (copywriter) per cambiare i testi della pagina e tradurli in italiano o inglese.
* **Il modello dell'Archivio (`Contact Submission`)**: Serve all'azienda (come un mini-CRM) per salvare e consultare tutti i messaggi ricevuti dagli utenti. Non ha bisogno di traduzioni.

### 1.1 Creazione del Modello "Contact Page" (Testi dell'Interfaccia)
Questo modello conterrà solo un'istanza (una sola pagina Contatti).

1. Nella dashboard di DatoCMS, naviga su **Schema** e clicca su **Create new model**.
2. **Model Name**: Inserisci `Contact Page`.
3. **Tipo**: **ATTIVA** la levetta **Single instance?**.
4. Ora aggiungiamo i campi. Clicca su "Add new field", scegli **Single-line string** e aggiungi questi campi. *Nota bene: per ognuno devi spuntare la casella "Enable localization on this field?" per abilitare le traduzioni IT/EN.*
   * **Titolo principale:** `title`
   * **Sottotitolo:** `subtitle`
   * **Etichetta Nome:** `first_name_label`
   * **Etichetta Cognome:** `last_name_label`
   * **Etichetta Email:** `email_label`
   * **Etichetta Telefono:** `phone_label`
   * **Etichetta Argomento:** `topic_label`
   * **Etichetta Messaggio:** `message_label`
   * **Testo del Bottone:** `submit_button_label`
   * **Messaggio di Conferma:** `success_message_label`

> **Cosa fare ora:** Vai nella sezione **Content** (dal menu a sinistra), seleziona `Contact page`, compila tutti questi campi sia per l'Italiano che per l'Inglese (usando lo switcher in alto) e premi **Publish**.

### 1.2 Creazione del Modello "Contact Submission" (Archivio Messaggi)
Questo modello raccoglierà le richieste inviate dagli utenti come archivio permanente.

1. Torna su **Schema** e clicca su **Create new model**.
2. **Model Name**: Inserisci `Contact Submission` (API Key generata: `contact_submission`).
3. **Tipo**: Assicurati che la levetta **Single instance?** sia **DISATTIVATA** (vogliamo raccogliere infiniti messaggi, non uno solo).
4. Aggiungi i seguenti campi testuali. *Nota bene: in questo caso NON attivare la localizzazione, perché stiamo salvando i dati grezzi dell'utente.*
   * **Nome:** `first_name` (Tipo: Single-line string, imposta come Required)
   * **Cognome:** `last_name` (Tipo: Single-line string, Required)
   * **Email:** `email` (Tipo: Single-line string, Required)
   * **Telefono:** `phone` (Tipo: Single-line string, Opzionale)
   * **Argomento:** `topic` (Tipo: Single-line string, Required)
   * **Messaggio:** `message` (Tipo: Multiple-paragraph text, Required)

> **Nota Fondamentale sull'ID del Modello (Evitare errore 404):**
> L'API di scrittura di DatoCMS (`cma-client`) non utilizza la Model API Key testuale (`contact_submission`) per salvare i dati, bensì l'ID Tecnico Univoco. Se si passa lo slug testuale, l'API restituirà errore 404 Not Found. 
> 
> Esistono due modi per gestire l'ID in Next.js (entrambi validi):
> 1. **Metodo Manuale (Hardcoded):** In DatoCMS -> Schema -> Contact Submission, clicca sui tre pallini in alto e scegli "Edit model". In alto a destra del popup troverai una stringa (es. ID: GlQTmNF0QRSOMRiR4TUd6w). Puoi copiare e incollare quell'ID direttamente nel codice.
> 2. **Metodo Dinamico (Consigliato e implementato in questa guida):** Utilizzare il metodo `await client.itemTypes.find('contact_submission')` nel codice server per recuperare automaticamente l'ID tecnico partendo dalla Model API Key testuale.

---

## 2. Setup dell'Ambiente e Gestione delle API Key

Prima di scrivere il codice, dobbiamo installare le librerie necessarie e generare token con permessi differenziati per garantire la sicurezza del sistema.

### 2.1 Installazione dei Pacchetti
Apri il terminale nella cartella del progetto Next.js ed esegui:
```bash
npm install @datocms/cma-client-node resend
```

### 2.2 Creazione Token Separati: Lettura (CDA) vs Scrittura (CMA)
Per ragioni di sicurezza, un'architettura headless richiede token distinti:
* **Token Read-Only (Già in uso):** Viene esposto o utilizzato dai componenti generici per leggere testi e immagini. Se intercettato, non permette di modificare il sito.
* **Token Full-Access (Nuovo):** Ha il potere di scrivere, modificare o cancellare dati nel CRM aziendale. Questo token deve vivere **esclusivamente sul server** e non arrivare mai al browser dell'utente.

**Come generare il Token di Scrittura:**
1. In DatoCMS vai su **Project Settings** -> **API Tokens** -> **New API Token**.
2. **Nome**: Inserisci `Server Actions Token`.
3. **Permessi**: Assicurati di **attivare l'interruttore** `Access the Content Management API`. Se questo rimane grigio/disattivato, qualsiasi operazione di salvataggio restituirà un errore 401 Unauthorized.
4. Clicca su `Save API Token` e copialo.

### 2.3 Configurazione `.env.local`
Aggiungi le chiavi nel tuo progetto (incluso l'ambiente di lavoro in cui risiede lo schema `Contact Submission`, es. `develop` o `main`):

```env
# Ambiente DatoCMS
NEXT_DATOCMS_ENVIRONMENT=main

# Token Read-Only per le query GraphQL (lettura testi UI)
NEXT_DATOCMS_API_TOKEN=tuo_read_only_api_token_qui

# Token Full-Access (CMA attivata) per scrivere nel CRM via Server Actions
DATOCMS_FULL_ACCESS_API_TOKEN=tuo_full_access_api_token_qui

# Chiave API del servizio Resend per l'invio delle email
RESEND_API_KEY=tuo_resend_api_key_qui
```

---

## 3. Implementazione del Codice Sorgente

Il flusso dati prevede tre componenti fondamentali: una pagina server per leggere i testi, un componente client per l'interfaccia, e una Server Action per processare e archiviare i dati.

### 3.1 La Pagina Server (`src/app/[lang]/contatti/page.js`)

**La Query GraphQL**
Iniziamo definendo la query GraphQL. Richiediamo a DatoCMS tutti i campi creati nel modello `Contact Page`. Usiamo la variabile `$locale` per assicurarci di ricevere i testi nella lingua giusta (es. Italiano o Inglese).
```javascript
import { performRequest } from '@/lib/datocms';
import ContactForm from '@/app/widgets/Contact/ContactForm';

const CONTACT_PAGE_QUERY = `
  query ContactPageQuery($locale: SiteLocale!) {
    contactPage(locale: $locale) {
      title
      subtitle
      firstNameLabel
      lastNameLabel
      emailLabel
      phoneLabel
      topicLabel
      messageLabel
      submitButtonLabel
      successMessageLabel
    }
  }
`;
```

**Recupero Dati e Iniezione**
Nel Server Component, recuperiamo la lingua dell'utente dai parametri dell'URL (`params.lang`) ed eseguiamo la query. Una volta ottenuti i testi, li passiamo al componente visivo `<ContactForm>` tramite la proprietà `content={content}`.
```javascript
export default async function ContactPage({ params }) {
  const { lang } = await params;

  const data = await performRequest(CONTACT_PAGE_QUERY, {
    variables: { locale: lang },
  });

  const content = data?.contactPage;

  return (
    <main className="py-16 px-4 max-w-4xl mx-auto text-gray-100">
      <div className="text-center mb-12">
        {content?.title && <h1 className="text-4xl font-extrabold text-white mb-4">{content.title}</h1>}
        {content?.subtitle && <p className="text-gray-400 max-w-lg mx-auto">{content.subtitle}</p>}
      </div>

      {/* Passiamo i testi estratti dal CMS al form interattivo */}
      <ContactForm content={content} lang={lang}/>
    </main>
  );
}
```

#### Ecco un codice d'esempio completo di `page.js`
```javascript
import { performRequest } from '@/lib/datocms';
import ContactForm from '@/app/widgets/Contact/ContactForm';

const CONTACT_PAGE_QUERY = `
  query ContactPageQuery($locale: SiteLocale!) {
    contactPage(locale: $locale) {
      title
      subtitle
      firstNameLabel
      lastNameLabel
      emailLabel
      phoneLabel
      topicLabel
      messageLabel
      submitButtonLabel
      successMessageLabel
    }
  }
`;

export default async function ContactPage({ params }) {
  const { lang } = await params;

  const data = await performRequest(CONTACT_PAGE_QUERY, {
    variables: { locale: lang },
  });

  const content = data?.contactPage;

  return (
    <main className="py-16 px-4 max-w-4xl mx-auto text-gray-100">
      <div className="text-center mb-12">
        {content?.title && (
          <h1 className="text-4xl font-extrabold text-white mb-4">
            {content.title}
          </h1>
        )}
        {content?.subtitle && (
          <p className="text-gray-400 max-w-lg mx-auto">
            {content.subtitle}
          </p>
        )}
      </div>

      <ContactForm content={content} lang={lang}/>
    </main>
  );
}
```

---

### 3.2 Il Componente Form (`src/app/widgets/Contact/ContactForm.jsx`)

**Hook di Sottomissione**
Essendo un componente interattivo, dobbiamo usare `'use client'`. Utilizziamo `useActionState` (React 19) per collegare il form alla nostra funzione backend (`submitContactForm`) senza dover gestire manualmente i `fetch`. L'hook ci fornisce `state` (per capire se l'invio è andato a buon fine) e `isPending` (per capire se stiamo caricando).
```jsx
'use client';
import { useActionState } from 'react';
import { submitContactForm } from '@/app/actions/contact';

const initialState = { success: false, error: false };

export default function ContactForm({ content, lang }) {
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState);

  if (!content) return null;
```

**Testi Dinamici (Label) dal punto di vista dello Sviluppatore**
Nel render dell'interfaccia, notiamo che i testi dei campi non sono scritti a mano nel codice (es. `<label>Nome *</label>`), bensì sono stampati leggendo la proprietà dal CMS (es. `<label>{content.firstNameLabel} *</label>`). 
Questo approccio **disaccoppia l'interfaccia dai contenuti (data-driven)**. Se il marketing decide di cambiare la parola "Nome" in "Nome di Battesimo", il developer non dovrà toccare una singola riga di codice né fare un nuovo deploy. Basterà aggiornare il campo su DatoCMS.
```jsx
  return (
    <form action={formAction} className="...">
      {state.success && (
        <div className="bg-green-900/50 text-green-200 p-4 rounded-lg">
          {content.successMessageLabel}
        </div>
      )}
      {/* Esempio di Label Dinamica */}
      <div>
        <label>{content.firstNameLabel} *</label>
        <input type="text" name="firstName" required />
      </div>
```

**Il pulsante disabilitabile**
Il bottone di invio usa la proprietà `disabled={isPending}` per diventare non cliccabile mentre il server sta salvando i dati, evitando che l'utente invii form multipli premendo ripetutamente.
```jsx
      <button type="submit" disabled={isPending}>
        {isPending ? '...' : content.submitButtonLabel}
      </button>
    </form>
  );
}
```

#### Ecco un codice d'esempio completo di `ContactForm.jsx`
```jsx
'use client';

import { useActionState } from 'react';
import { submitContactForm } from '@/app/actions/contact';

const initialState = {
  success: false,
  error: false,
};

export default function ContactForm({ content, lang }) {
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState);

  if (!content) return null;

  return (
    <form action={formAction} className="max-w-xl mx-auto bg-gray-900 p-8 rounded-xl border border-gray-800 space-y-6">
      
      {state.success && (
        <div className="p-4 bg-green-900/50 border border-green-500 text-green-200 rounded-lg text-sm">
          {content.successMessageLabel}
        </div>
      )}

      {state.error && (
        <div className="p-4 bg-red-900/50 border border-red-500 text-red-200 rounded-lg text-sm">
          {lang === 'it' ? 'Si è verificato un errore durante l\'invio.' : 'An error occurred during submission.'}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">{content.firstNameLabel} *</label>
          <input type="text" name="firstName" required className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">{content.lastNameLabel} *</label>
          <input type="text" name="lastName" required className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">{content.emailLabel} *</label>
          <input type="email" name="email" required className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">{content.phoneLabel}</label>
          <input type="tel" name="phone" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{content.topicLabel} *</label>
        <select name="topic" required defaultValue="" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white">
          <option value="" disabled>{lang === 'it' ? 'Seleziona un argomento...' : 'Select a topic...'}</option>
          <option value="commerciale">{lang === 'it' ? 'Informazioni Commerciali' : 'Sales'}</option>
          <option value="preventivo">{lang === 'it' ? 'Richiesta Preventivo' : 'Quote Request'}</option>
          <option value="supporto">{lang === 'it' ? 'Supporto Clienti' : 'Customer Support'}</option>
          <option value="altro">{lang === 'it' ? 'Altro' : 'Other'}</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">{content.messageLabel} *</label>
        <textarea name="message" rows={5} required className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 text-white" />
      </div>

      <button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-lg disabled:opacity-50">
        {isPending ? '...' : content.submitButtonLabel}
      </button>
    </form>
  );
}
```

---

### 3.3 La Logica Server: Routing Email e Archiviazione (`src/app/actions/contact.js`)

**Direttiva Server e Routing Dictionary**
La direttiva `'use server'` in alto assicura che questo codice non venga mai inviato al browser, proteggendo le chiavi API. Creiamo poi un Dizionario (`RECIPIENT_MAP`) che mappa il valore del form (es. `commerciale`) verso l'email aziendale corretta. Questo approccio è estremamente sicuro, poiché un utente malintenzionato non potrà mai ispezionare le vere caselle di posta aziendali manipolando il codice lato client.
```javascript
'use server';
import { buildClient } from '@datocms/cma-client-node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const RECIPIENT_MAP = {
  commerciale: 'la.tua.email.registrata@resend.it',
  preventivo: 'la.tua.email.registrata@resend.it',
  supporto: 'la.tua.email.registrata@resend.it',
  altro: 'la.tua.email.registrata@resend.it',
};
```

**Archiviazione in DatoCMS e l'ID Dinamico (Bypassare il 404)**
Dopo aver estratto i dati digitati nel form (`formData.get`), inizializziamo il client `CMA` passando il token e, fondamentale, specifichiamo l'environment di lavoro (es. `main`).
Per creare il record nel database, DatoCMS esige l'ID tecnico univoco del modello (es. `GlQT...`), non lo slug testuale. Se usassimo il nome testuale incapperemmo in un errore 404. Per risolvere il problema in modo dinamico e pulito, usiamo la funzione `.find('contact_submission')` per farci restituire l'oggetto completo del modello, da cui estraiamo la proprietà corretta `.id`.
```javascript
export async function submitContactForm(prevState, formData) {
  const firstName = formData.get('firstName');
  /* ... estrazione campi ... */

  try {
    const client = buildClient({ 
      apiToken: process.env.DATOCMS_FULL_ACCESS_API_TOKEN,
      environment: process.env.NEXT_DATOCMS_ENVIRONMENT || 'main'
    });
    
    // Cerchiamo il modello dinamicamente per ricavare l'ID Tecnico
    const itemType = await client.itemTypes.find('contact_submission');

    // Salviamo i dati su DatoCMS
    await client.items.create({
      item_type: { type: 'item_type', id: itemType.id }, 
      first_name: firstName,
      /* ... passaggio di tutti i campi testuali ... */
    });
```

**La doppia gestione delle Email tramite Resend**
La parte conclusiva della Server Action si occupa di gestire un **duplice invio asincrono**. Abbiamo architettato il sistema per soddisfare due necessità aziendali distinte:

1. **Ricezione Informazioni Cliente (L'email per l'Azienda):** 
   Il primo blocco invia un'email al reparto di competenza (`to: targetRecipient`). Il corpo HTML di questa email viene interpolato dinamicamente con le variabili fornite dall'utente, assicurando che l'azienda riceva la lead in modo strutturato.
   
2. **Messaggio di Cortesia (L'email per il Cliente):**
   Subito dopo, inneschiamo una seconda chiamata API. Questa volta il destinatario dell'email sarà la variabile `email` (l'indirizzo digitato dal cliente). Il corpo del messaggio conterrà una ricevuta di sistema per rassicurare l'utente.

*(Nota: Per chi effettua test utilizzando un account Sandbox gratuito su Resend, la piattaforma applica policy restrittive per evitare spam. In questa fase di sviluppo, sia il parametro `from:` sia il parametro `to:` devono essere forzati e verificati, altrimenti le API restituiranno errore 403).*

```javascript
    const targetRecipient = RECIPIENT_MAP[topic] || 'la.tua.email.registrata@resend.it';

    // 1. Invio Email Ricezione Lead all'Azienda
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: targetRecipient,
      subject: `Nuovo Contatto da ${firstName}`,
      html: `<p>Dati utente: ${email}, ${message} ...</p>`
    });

    // 2. Invio Email Ricevuta di Conferma al Cliente
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: targetRecipient, // In Produzione sostituire con la variabile estratta: email
      subject: `Conferma ricezione messaggio`,
      html: `<p>Grazie per averci contattato ${firstName} ...</p>`
    });

    return { success: true, error: false };
  } catch (error) {
    return { success: false, error: true };
  }
}
```

#### Ecco un codice d'esempio completo di `contact.js`
```javascript
'use server';

import { buildClient } from '@datocms/cma-client-node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Mappa di routing: (in Sandbox Mode deve puntare all'email registrata su Resend)
const RECIPIENT_MAP = {
  commerciale: 'la.tua.email.registrata@resend.it',
  preventivo: 'la.tua.email.registrata@resend.it',
  supporto: 'la.tua.email.registrata@resend.it',
  altro: 'la.tua.email.registrata@resend.it',
};

export async function submitContactForm(prevState, formData) {
  // 1. Estrazione dati dal FormData nativo
  const firstName = formData.get('firstName');
  const lastName = formData.get('lastName');
  const email = formData.get('email');
  const phone = formData.get('phone') || '';
  const topic = formData.get('topic');
  const message = formData.get('message');

  // Validazione di sicurezza lato server
  if (!firstName || !lastName || !email || !topic || !message) {
    return { success: false, error: true };
  }

  try {
    // 2. Archiviazione su DatoCMS (via Content Management API)
    const client = buildClient({ 
      apiToken: process.env.DATOCMS_FULL_ACCESS_API_TOKEN,
      environment: process.env.NEXT_DATOCMS_ENVIRONMENT || 'main'
    });
    
    // Recupero dinamico dell'ID Tecnico per evitare l'errore "404 Not Found"
    const itemType = await client.itemTypes.find('contact_submission');

    // Creazione del record nella collection
    await client.items.create({
      item_type: { type: 'item_type', id: itemType.id }, 
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      topic: topic,
      message: message,
    });

    // 3. Instradamento Dinamico Email (Routing)
    const targetRecipient = RECIPIENT_MAP[topic] || 'la.tua.email.registrata@resend.it';

    // 4. Invio email formattata all'azienda
    // (Nota: in Sandbox account "from" DEVE essere onboarding@resend.dev)
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: targetRecipient,
      subject: `[Nuovo Contatto - ${topic.toUpperCase()}] da ${firstName} ${lastName}`,
      html: `
        <h2>Nuovo messaggio dal sito web</h2>
        <p><strong>Nome:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefono:</strong> ${phone || 'Non specificato'}</p>
        <p><strong>Argomento:</strong> ${topic}</p>
        <hr />
        <h3>Messaggio:</h3>
        <p style="white-space: pre-line;">${message}</p>
      `,
    });

    // 5. Invio email automatica di conferma al mittente
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: targetRecipient, // N.B. In produzione sostituire con la variabile form estratta: 'email'
      subject: `Conferma ricezione messaggio`,
      html: `
        <h3>Ciao ${firstName},</h3>
        <p>Grazie per averci contattato. Abbiamo preso in carico il tuo messaggio relativo a <strong>${topic}</strong>.</p>
        <p>Un nostro operatore ti risponderà al più presto.</p>
      `,
    });

    return { success: true, error: false };
  } catch (error) {
    console.error('Errore durante il processamento del form:', error);
    return { success: false, error: true };
  }
}
```

---

## 5. Verifica funzionalità 

L'architettura sviluppata soddisfa interamente i punti di verifica seguenti:

1. **Inviare un'email formattata a destinatario definito:** Il pacchetto `Resend` compila un template HTML pulito popolato con i dati estratti dal form.
2. **Inviare un'email di notifica invio al mittente:** La Server Action esegue una seconda chiamata API asincrona. *(NB: Nella demo è configurata per aggirare le restrizioni dell'account Sandbox).*
3. **Verificare cambio mittente in base all'argomento (destinatari condivisi):** Questo requisito è stato realizzato creando un Dictionary (`RECIPIENT_MAP`) lato server. Questo pattern associa dinamicamente le chiavi di selezione (es. sia `commerciale` che `preventivo`) alla medesima casella di posta aziendale protetta.
4. **Memorizzazione del contatto su un archivio dati:** Sfruttando l'API ufficiale `@datocms/cma-client-node` combinata con il recupero dinamico dell'ID di sistema del modello, ogni invio genera un record persistente e consultabile sulla dashboard di DatoCMS (`Contact Submission`).

---

## 6. Consultazione del Database (Il CRM Interno su DatoCMS)

Oltre all'invio delle notifiche tramite email, l'architettura che abbiamo sviluppato utilizza DatoCMS non solo per gestire i testi dell'interfaccia, ma anche come un vero e proprio **database permanente (CRM)** per raccogliere i lead.

Per verificare visivamente che l'archiviazione avvenga correttamente e per consultare lo storico dei messaggi ricevuti:

1. Accedi alla dashboard del tuo progetto su **DatoCMS**.
2. Nel menu principale in alto a sinistra, clicca sulla scheda **Content**.
3. Nella colonna laterale di sinistra, individua e clicca sul modello **Contact Submission**.
4. Ti apparirà una tabella contenente l'elenco di tutte le richieste inviate dal sito web. 
5. Cliccando su ogni singola riga (Record), si aprirà il dettaglio completo con tutti i campi salvati: **Nome**, **Cognome**, **Email**, **Telefono**, l'**Argomento** selezionato e il testo integrale del **Messaggio**.

---

## 7. Recupero dei Dati Archiviati via Codice (Read API / GraphQL)

Oltre alla consultazione manuale tramite l'interfaccia di DatoCMS, un'architettura headless consente allo sviluppatore di interrogare via codice il modello `Contact Submission` per recuperare programmaticamente le richieste salvate nel database (ad esempio per costruire una dashboard interna).

### 7.1 La Query GraphQL per la Lettura delle Submissions

**La Query di Lettura**
Per leggere la lista dei messaggi archiviati, definiamo una query GraphQL che interroga il modello `allContactSubmissions`. Possiamo ordinare i record per data di creazione decrescente (`orderBy: _createdAt_DESC`) e richiedere esattamente le proprietà che ci interessano.
```javascript
const ALL_SUBMISSIONS_QUERY = `
  query AllSubmissionsQuery {
    allContactSubmissions(orderBy: _createdAt_DESC) {
      id
      firstName
      lastName
      email
      phone
      topic
      message
      _createdAt
    }
  }
`;
```

### 7.2 Abilitare la Lettura dei Dati in Bozza (`includeDrafts`)

Quando una Server Action crea un record con la CMA, DatoCMS lo salva in automatico come **Bozza (Draft)**. Poiché le query CDA di default cercano solo contenuti pubblicati, la normale esecuzione della query restituirebbe un array vuoto.

Per permettere a GraphQL di restituire tutti i messaggi archiviati senza doverli pubblicare a mano dal pannello, passiamo l'opzione `includeDrafts: true` direttamente e *solo* alla chiamata specifica, sfruttando il parametro `options` del nostro helper `performRequest`:
```javascript
const data = await performRequest(ALL_SUBMISSIONS_QUERY, {
  includeDrafts: true, // Fondamentale per leggere i messaggi in bozza
});
```
*In questo modo non andiamo a compromettere il resto dell'applicazione mostrando le bozze di altre pagine.*

### 7.3 Esempio 1: Funzione per ritornare solo l'array di dati

Se abbiamo bisogno di estrarre questi dati in modo programmatico (ad esempio per inviarli a un altro gestionale interno o usarli in un'API), possiamo creare una semplice funzione asincrona. Questa funzione esegue la query e restituisce unicamente l'array puro, pronto per essere elaborato.

```javascript
import { performRequest } from '@/lib/datocms';

const ALL_SUBMISSIONS_QUERY = `
  query AllSubmissionsQuery {
    allContactSubmissions(orderBy: _createdAt_DESC) {
      id
      firstName
      lastName
      email
      phone
      topic
      message
      _createdAt
    }
  }
`;

export async function getSubmissionsData() {
  const data = await performRequest(ALL_SUBMISSIONS_QUERY, { includeDrafts: true });
  return data?.allContactSubmissions || [];
}
```

### 7.4 Esempio 2: Implementazione in una Pagina Next.js (`src/app/admin/submissions/page.js`)

**Esecuzione della Chiamata e Rendering**
Se invece il nostro obiettivo è costruire una pagina visiva (una mini-dashboard aziendale), eseguiamo la chiamata all'interno del Server Component. Gestiamo il caso in cui il database sia vuoto mostrando un avviso (`submissions.length === 0`), altrimenti cicliamo l'array stampando a schermo tutti i dettagli ricevuti, convertendo la data in un formato leggibile per gli umani.

```javascript
export default async function SubmissionsDataPage() {
  const data = await performRequest(ALL_SUBMISSIONS_QUERY, { includeDrafts: true });
  const submissions = data?.allContactSubmissions || [];

  return (
    <div className="p-8 max-w-5xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-6">Storico Richieste Ricevute</h1>
      
      {submissions.length === 0 ? (
        <p className="text-gray-400">Nessuna richiesta trovata nel database.</p>
      ) : (
        <ul className="space-y-4">
          {submissions.map((item) => (
            <li key={item.id} className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
              {/* ... rendering dell'elemento ... */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

#### Ecco un codice d'esempio completo per mostrare lo storico richieste
```javascript
import { performRequest } from '@/lib/datocms';

const ALL_SUBMISSIONS_QUERY = `
  query AllSubmissionsQuery {
    allContactSubmissions(orderBy: _createdAt_DESC) {
      id
      firstName
      lastName
      email
      phone
      topic
      message
      _createdAt
    }
  }
`;

export default async function SubmissionsDataPage() {
  // Esecuzione della query per recuperare l'elenco dei dati dal DB DatoCMS (incluse le bozze)
  const data = await performRequest(ALL_SUBMISSIONS_QUERY, {
    includeDrafts: true, // Obbligatorio per recuperare i form archiviati come Draft
  });
  
  const submissions = data?.allContactSubmissions || [];

  return (
    <div className="p-8 max-w-5xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-6">Storico Richieste Ricevute</h1>
      
      {submissions.length === 0 ? (
        <p className="text-gray-400">Nessuna richiesta trovata nel database.</p>
      ) : (
        <ul className="space-y-4">
          {submissions.map((item) => (
            <li key={item.id} className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-blue-400">
                  {item.firstName} {item.lastName} ({item.email})
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(item._createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-gray-300"><strong>Argomento:</strong> {item.topic}</p>
              <p className="text-sm text-gray-400 mt-1">{item.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```