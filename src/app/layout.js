import { Geist, Geist_Mono } from "next/font/google";
import { toNextMetadata } from "react-datocms/seo";
import { performRequest } from "@/lib/datocms";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const LAYOUT_QUERY = `
  query {
    _site {
      faviconMetaTags {
        attributes
        content
        tag
      }
    }
    
    allMenuItems {
      id
      label
      url
    }
  }
`;

export async function generateMetadata() {
  const data = await performRequest(LAYOUT_QUERY);

  return toNextMetadata(data?._site?.faviconMetaTags || []);
}

export default async function RootLayout({ children }) {
  let menuItems = [];

  try {
    const data = await performRequest(LAYOUT_QUERY);
    menuItems = data?.allMenuItems || [];
  } catch (error) {
    console.error("Errore nel recupero del menu:", error);
  }

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
}
