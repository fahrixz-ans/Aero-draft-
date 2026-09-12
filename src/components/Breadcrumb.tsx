import React, { useEffect } from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export interface BreadcrumbPathItem {
  label: string;
  view?: string;
  slug?: string;
}

interface BreadcrumbProps {
  paths: BreadcrumbPathItem[];
  onNavigate: (view: string, slug?: string) => void;
  className?: string;
}

export default function Breadcrumb({ paths, onNavigate, className = '' }: BreadcrumbProps) {
  const { t } = useLanguage();

  const getTranslatedLabel = (label: string) => {
    const lower = label.toLowerCase().trim();
    if (lower === 'beranda' || lower === 'home') {
      return t('nav.home', 'Beranda');
    }
    if (lower === 'kategori' || lower === 'categories') {
      return t('nav.categories', 'Kategori');
    }
    if (lower === 'developer' || lower === 'developers' || lower === 'pengembang') {
      return t('app.developer', 'Developer');
    }
    if (lower === 'aplikasi' || lower === 'apps') {
      return t('nav.apps', 'Aplikasi');
    }
    if (lower === 'game' || lower === 'games') {
      return t('nav.games', 'Game');
    }
    if (lower === 'blog') {
      return 'Blog';
    }
    return label;
  };

  // Structured Data (JSON-LD BreadcrumbList) for SEO
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const baseUrl = window.location.origin;
    const breadcrumbListItems = [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Beranda',
        item: `${baseUrl}/`
      },
      ...paths.map((item, index) => {
        let itemUrl = `${baseUrl}/`;
        if (item.view === 'apps') itemUrl = `${baseUrl}/#/apps`;
        else if (item.view === 'games') itemUrl = `${baseUrl}/#/games`;
        else if (item.view === 'category' || item.view === 'all-categories' || item.view === 'categories' || item.view === 'category-detail') {
          itemUrl = item.slug ? `${baseUrl}/#/detail${encodeURIComponent(item.slug)}` : `${baseUrl}/#/categories`;
        } else if (item.view === 'developer' || item.view === 'developer-detail') {
          itemUrl = item.slug ? `${baseUrl}/#/developer/${encodeURIComponent(item.slug)}` : `${baseUrl}/#/developers`;
        } else if (item.view === 'blog' || item.view === 'blog-category') {
          itemUrl = item.slug ? `${baseUrl}/#/blog/category/${encodeURIComponent(item.slug)}` : `${baseUrl}/#/blog`;
        } else if (item.view === 'detail' && item.slug) {
          itemUrl = `${baseUrl}/#/apps/${encodeURIComponent(item.slug)}`;
        } else {
          itemUrl = `${baseUrl}/${window.location.hash || ''}`;
        }

        return {
          '@type': 'ListItem',
          position: index + 2,
          name: item.label,
          item: itemUrl
        };
      })
    ];

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbListItems
    };

    let scriptTag = document.getElementById('breadcrumb-jsonld') as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'breadcrumb-jsonld';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(jsonLd);

    return () => {
      const el = document.getElementById('breadcrumb-jsonld');
      if (el) el.remove();
    };
  }, [paths]);

  return (
    <nav 
      className={`flex items-center my-3 text-xs sm:text-sm font-medium ${className}`} 
      aria-label="Breadcrumb" 
      id="breadcrumb-navigation"
    >
      <ol className="inline-flex items-center flex-wrap gap-1 md:gap-1.5">
        <li className="inline-flex items-center">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="inline-flex items-center text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors active:scale-95"
            id="breadcrumb-home"
            title="Kembali ke Beranda"
          >
            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />
            <span>{t('nav.home', 'Beranda')}</span>
          </button>
        </li>
        {paths.map((path, index) => {
          const isLast = index === paths.length - 1;
          return (
            <li key={index} className="inline-flex items-center">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 mx-0.5 sm:mx-1 shrink-0" />
              {isLast ? (
                <span 
                  className="text-slate-900 dark:text-slate-100 font-semibold truncate max-w-[160px] sm:max-w-xs md:max-w-sm"
                  aria-current="page"
                >
                  {getTranslatedLabel(path.label)}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => path.view && onNavigate(path.view, path.slug)}
                  className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors truncate max-w-[140px] sm:max-w-[180px] active:scale-95"
                >
                  {getTranslatedLabel(path.label)}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
