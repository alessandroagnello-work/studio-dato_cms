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

      <ContactForm content={content} lang={lang} />
    </main>
  );
}