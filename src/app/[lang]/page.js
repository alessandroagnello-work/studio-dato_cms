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