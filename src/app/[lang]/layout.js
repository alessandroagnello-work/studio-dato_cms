import { Geist, Geist_Mono } from "next/font/google";
import { toNextMetadata } from "react-datocms/seo";
import { performRequest } from "@/lib/datocms";
import Link from "next/link";
import "../globals.css";
import { cache } from 'react';
import LanguageSwitcher from "@/app/widgets/Language/languageSwitcher";

const LAYOUT_QUERY = `
  query LayoutQuery($locale: SiteLocale!){
    _site {
      faviconMetaTags {
        attributes
        content
        tag
      }
    }
    
    allMenuItems(locale: $locale) {
      id
      label
      url
    }
  }
`;

const getLayoutData = cache(async (params) => {
  const { lang } = await params;
  try {
    return await performRequest(LAYOUT_QUERY, {
      variables: { locale: lang },
    });
  } catch (error) {
    console.error("Errore nel recupero dati layout:", error);
    return null;
  }
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({ params }) {
  const data = await getLayoutData(params);
  return toNextMetadata(data?._site?.faviconMetaTags || []);
}

export default async function RootLayout({ children, params }) {
  const { lang } = await params;
  const data = await getLayoutData(params);
  const menuItems = data?.allMenuItems || [];

  return (
    <html lang={lang} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <header className="p-4 border-b flex justify-between items-center">
          <nav className="flex gap-4">
            {menuItems.map((item) => (
              <Link className="hover:underline" href={`/${lang}${item.url}`} key={item.id}>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Widget Selettore Lingua Dinamico */}
          <LanguageSwitcher currentLang={lang} />
        </header>

        {children}
      </body>
    </html>
  );
}