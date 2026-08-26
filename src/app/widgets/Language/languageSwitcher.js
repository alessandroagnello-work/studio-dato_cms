'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function LanguageSwitcher({ currentLang }) {
  const pathname = usePathname();

  const getPathForLang = (targetLang) => {
    if (!pathname) return `/${targetLang}`;
    return pathname.replace(`/${currentLang}`, `/${targetLang}`);
  };

  return (
    <div className="flex gap-2 text-sm font-semibold">
      <Link 
        href={getPathForLang('it')} 
        className={`px-2 py-1 rounded ${currentLang === 'it' ? 'bg-white text-black' : 'text-gray-400'}`}
      >
        IT
      </Link>
      <Link 
        href={getPathForLang('en')} 
        className={`px-2 py-1 rounded ${currentLang === 'en' ? 'bg-white text-black' : 'text-gray-400'}`}
      >
        EN
      </Link>
    </div>
  );
}