'use client';

import { useActionState } from 'react';
import { submitContactForm } from '@/app/actions/contact';

const initialState = {
  success: false,
  error: false,
};

export default function ContactForm({ content, lang }) {
  // Colleghiamo il form alla logica server usando il nuovo hook di React 19
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState);

  if (!content) return null;

  return (
    <form action={formAction} className="max-w-xl mx-auto bg-gray-900 p-8 rounded-xl border border-gray-800 space-y-6">
      
      {/* Messaggi di feedback post-invio */}
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

      {/* Campi Nome e Cognome */}
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

      {/* Campi Email e Telefono */}
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

      {/* Campo Select (Argomento) */}
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

      {/* Campo Messaggio */}
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