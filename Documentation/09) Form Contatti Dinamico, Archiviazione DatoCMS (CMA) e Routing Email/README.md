# Guida Tecnica (Modulo 9): Form Contatti Dinamico CMS-Driven, Archiviazione DatoCMS (CMA) e Routing Email (Workflow Sandbox CLI)

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

## 1. Avvio Workflow: Creazione e Puntamento alla Sandbox `task-contact-form`

Tutto il lavoro di sviluppo (creazione modelli, inserimento dati di test e scrittura del codice Next.js) avverrà in un ambiente isolato per non impattare l'ambiente condiviso `develop`.

### 1.1 Creazione della Sandbox
Dal terminale, crea una copia dell'ambiente `develop` per il nuovo ticket:
```bash
npx datocms environments:fork develop task-contact-form
```

### 1.2 Puntamento dell'Applicazione Locale (Next.js)
Apri il file `.env.local` e forza Next.js a leggere la nuova sandbox:
```env
NEXT_DATOCMS_ENVIRONMENT=task-contact-form
```

---

## 2. Configurazione del Database su DatoCMS (Sulla Sandbox `task-contact-form`)

Assicurati di essere posizionato sull'ambiente **`task-contact-form`** (selezionabile dal menu a tendina in alto a sinistra della Dashboard DatoCMS). Creiamo due "Modelli" separati:

* **Il modello dell'Interfaccia (`Contact Page`)**: Serve ai redattori per cambiare i testi della pagina e tradurli in italiano o inglese.
* **Il modello dell'Archivio (`Contact Submission`)**: Serve all'azienda (come un mini-CRM) per salvare e consultare tutti i messaggi ricevuti dagli utenti.

### 2.1 Creazione del Modello "Contact Page" (Testi dell'Interfaccia)
Questo modello conterrà solo un'istanza (Single Instance).

1. Nella dashboard di DatoCMS, naviga su **Schema** e clicca su **Create new model**.
2. **Model Name**: Inserisci `Contact Page`.
3. **Tipo**: **ATTIVA** la levetta **Single instance?**.
4. Aggiungi i seguenti campi di tipo **Single-line string** (spuntando la casella *"Enable localization on this field?"* per ciascuno):
   * `title` (Titolo principale)
   * `subtitle` (Sottotitolo)
   * `first_name_label` (Etichetta Nome)
   * `last_name_label` (Etichetta Cognome)
   * `email_label` (Etichetta Email)
   * `phone_label` (Etichetta Telefono)
   * `topic_label` (Etichetta Argomento)
   * `message_label` (Etichetta Messaggio)
   * `submit_button_label` (Testo del Bottone)
   * `success_message_label` (Messaggio di Conferma)

> **Cosa fare ora:** Vai nella sezione **Content**, seleziona `Contact page`, compila tutti questi campi sia per l'Italiano che per l'Inglese e premi **Publish**.

### 2.2 Creazione del Modello "Contact Submission" (Archivio Messaggi)
Questo modello raccoglierà le richieste inviate dagli utenti.

1. Torna su **Schema** e clicca su **Create new model**.
2. **Model Name**: Inserisci `Contact Submission` (API Key: `contact_submission`).
3. **Tipo**: Assicurati che la levetta **Single instance?** sia **DISATTIVATA**.
4. Aggiungi i seguenti campi (*NON attivare la localizzazione*):
   * **Nome:** `first_name` (Single-line string, Required)
   * **Cognome:** `last_name` (Single-line string, Required)
   * **Email:** `email` (Single-line string, Required)
   * **Telefono:** `phone` (Single-line string, Opzionale)
   * **Argomento:** `topic` (Single-line string, Required)
   * **Messaggio:** `message` (Multiple-paragraph text, Required)

> **Nota Fondamentale sull'ID del Modello (Evitare errore 404):**
> L'API di scrittura (`cma-client`) esige l'ID Tecnico Univoco del modello. Per ottenerlo in modo pulito e automatico, usiamo `await client.itemTypes.find('contact_submission')` nel codice server.

---

## 3. Setup dell'Ambiente e Gestione delle API Key

### 3.1 Installazione dei Pacchetti
Apri il terminale ed esegui:
```bash
npm install @datocms/cma-client-node resend
```

### 3.2 Creazione Token Separati: Lettura (CDA) vs Scrittura (CMA)
* **Token Read-Only:** Utilizzato dalle query GraphQL per leggere i testi della UI.
* **Token Full-Access:** Necessario per la Server Action per scrivere nel CRM. Generalo da DatoCMS: **Project Settings** -> **API Tokens** -> **New API Token** -> Attiva **Access the Content Management API**.

### 3.3 Configurazione `.env.local`
Aggiungi o aggiorna le chiavi nel progetto:

```env
# Sandbox attiva per la fase di sviluppo
NEXT_DATOCMS_ENVIRONMENT=task-contact-form

# Token Read-Only per le query GraphQL (lettura testi UI)
NEXT_DATOCMS_API_TOKEN=tuo_read_only_api_token_qui

# Token Full-Access (CMA attivata) per scrivere nel CRM via Server Actions
DATOCMS_FULL_ACCESS_API_TOKEN=tuo_full_access_api_token_qui

# Chiave API del servizio Resend per l'invio delle email
RESEND_API_KEY=tuo_resend_api_key_qui
```

---

## 4. Implementazione del Codice Sorgente

### 4.1 La Pagina Server (`src/app/[lang]/contatti/page.js`)

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

      <ContactForm content="{content}" lang="{lang}"/>
    </main>
  );
}
```

---

### 4.2 Il Componente Form (`src/app/widgets/Contact/ContactForm.jsx`)

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

### 4.3 La Logica Server: Routing Email e Archiviazione (`src/app/actions/contact.js`)

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

export async function submitContactForm(prevState, formData) {
  const firstName = formData.get('firstName');
  const lastName = formData.get('lastName');
  const email = formData.get('email');
  const phone = formData.get('phone') || '';
  const topic = formData.get('topic');
  const message = formData.get('message');

  if (!firstName || !lastName || !email || !topic || !message) {
    return { success: false, error: true };
  }

  try {
    const client = buildClient({ 
      apiToken: process.env.DATOCMS_FULL_ACCESS_API_TOKEN,
      environment: process.env.NEXT_DATOCMS_ENVIRONMENT || 'main'
    });
    
    // Recupero dinamico dell'ID Tecnico del modello sulla sandbox attiva
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

    const targetRecipient = RECIPIENT_MAP[topic] || 'la.tua.email.registrata@resend.it';

    // 1. Invio email all'azienda
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: targetRecipient,
      subject: `[Nuovo Contatto - ${topic.toUpperCase()}] da ${firstName}${lastName}`,
      html: `
        <h2>Nuovo messaggio dal sito web</h2>
        <p><strong>Nome:</strong> ${firstName}${lastName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Telefono:</strong> ${phone || 'Non specificato'}</p>
        <p><strong>Argomento:</strong> ${topic}</p>
        <hr />
        <h3>Messaggio:</h3>
        <p style="white-space: pre-line;">${message}</p>
      `,
    });

    // 2. Invio email automatica di conferma al mittente
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: targetRecipient,
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

## 5. Consultazione del Database su Sandbox

Per verificare che l'archiviazione funzioni durante i test:

1. Apri la dashboard su **DatoCMS** assicurandoti di essere sulla sandbox `task-contact-form`.
2. Vai nella sezione **Content** $\rightarrow$ seleziona **Contact Submission**.
3. Clicca sui record creati per verificare che i campi si popolino correttamente.

---

## 6. Recupero dei Dati Archiviati via Codice (Read API / GraphQL)

### 6.1 Codice per mostrare lo storico richieste (`src/app/admin/submissions/page.js`)

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

---

## 7. Fine dei Test: Rilascio su `develop` e Pulizia

Una volta testata la pagina su `localhost:3000` con esito positivo, promuoviamo il lavoro sull'ambiente condiviso `develop`.

### 7.1 Promozione dello Schema su `develop`
Confronta la sandbox con `develop` per generare lo script di migrazione degli schemi (`Contact Page` e `Contact Submission`) e applicalo:

```bash
# 1. Genera lo script di migrazione per gli schemi creati
npx datocms migrations:new "add_contact_form_models" --autogenerate=task-contact-form:develop

# 2. Applica la migrazione sull'ambiente condiviso develop
npx datocms migrations:run --source=develop --in-place
```

### 7.2 Ripristino dell'Ambiente Locale
Nel file `.env.local`, riporta la variabile d'ambiente sul ramo condiviso:
```env
NEXT_DATOCMS_ENVIRONMENT=develop
```

### 7.3 Eliminazione Sandbox
Elimina la sandbox temporanea per liberare risorse sul progetto:
```bash
npx datocms environments:destroy task-contact-form
```