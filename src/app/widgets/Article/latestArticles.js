import ArticleCard from '@/app/widgets/Article/articleCard';

export default function LatestArticles({ articles, lang }) {
  if (!articles || articles.length === 0) return null;

  return (
    <section className="mt-16 border-t border-gray-800 pt-12 text-left">
      <h2 className="text-2xl font-bold mb-6 text-white text-center">
        Ultimi Articoli Pubblicati
      </h2>
      <div className="flex justify-center gap-6 flex-wrap">
        {articles.map((art) => (
          <ArticleCard key={art.id} article={art} lang={lang} />
        ))}
      </div>
    </section>
  );
}