import React from 'react';
import type { NewsFilters as NewsFiltersType } from '../types/news';

interface NewsFiltersProps {
  filters: NewsFiltersType;
  selectedCountry: string;
  selectedLanguage: string;
  onCountryChange: (country: string) => void;
  onLanguageChange: (language: string) => void;
}

const NewsFilters: React.FC<NewsFiltersProps> = ({
  filters,
  selectedCountry,
  selectedLanguage,
  onCountryChange,
  onLanguageChange,
}) => {
  const getFlagEmoji = (countryCode: string) => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  const getLanguageName = (langCode: string) => {
    const languages: Record<string, string> = {
      pt: 'Português',
      en: 'English',
      es: 'Español',
      fr: 'Français',
      de: 'Deutsch',
      it: 'Italiano',
    };
    return languages[langCode] || langCode.toUpperCase();
  };

  return (
    <div className="flex flex-wrap gap-4 items-center justify-center relative z-[60]">
      {/* Filtro de País */}
      <div className="flex-1 min-w-[200px]">
        <label className="block text-gray-dark text-sm mb-2">País</label>
        <select
          value={selectedCountry}
          onChange={(e) => onCountryChange(e.target.value)}
          className="w-full bg-white border border-gray-light rounded-xl px-4 py-2 text-dark focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue relative z-[61]"
        >
          <option value="">Todos os países</option>
          {filters.countries.map((country) => (
            <option key={country} value={country} className="bg-white">
              {getFlagEmoji(country)} {country.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Filtro de Idioma */}
      <div className="flex-1 min-w-[200px]">
        <label className="block text-gray-dark text-sm mb-2">Idioma</label>
        <select
          value={selectedLanguage}
          onChange={(e) => onLanguageChange(e.target.value)}
          className="w-full bg-white border border-gray-light rounded-xl px-4 py-2 text-dark focus:outline-none focus:ring-2 focus:ring-blue focus:border-blue relative z-[61]"
        >
          <option value="">Todos os idiomas</option>
          {filters.languages.map((lang) => (
            <option key={lang} value={lang} className="bg-white">
              {getLanguageName(lang)}
            </option>
          ))}
        </select>
      </div>

      {/* Botão de Limpar Filtros */}
      {(selectedCountry || selectedLanguage) && (
        <button
          onClick={() => {
            onCountryChange('');
            onLanguageChange('');
          }}
          className="mt-6 px-4 py-2 bg-white hover:bg-light border border-gray-light rounded-xl text-gray-dark hover:text-dark transition-all"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
};

export default NewsFilters;
