"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import i18n from "i18next";
import {
  initReactI18next,
  useTranslation as useTranslationOrg,
} from "react-i18next";
import resourcesToBackend from "i18next-resources-to-backend";

// Define the resources type
// interface Resources {
//   [key: string]: {
//     [key: string]: string;
//   };
// }

// Initialize i18next
void i18n
  .use(initReactI18next)
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`./locales/${language}/${namespace}.json`),
    ),
  )
  .init({
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    defaultNS: "common",
    ns: ["common"],
  });

// Create a context for the i18n instance
const I18nContext = createContext<{
  i18n: typeof i18n;
}>({ i18n });

// Provider component
export function I18nProvider({
  children,
  lng = "en",
}: {
  children: ReactNode;
  lng?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (i18n.language !== lng) {
      void i18n.changeLanguage(lng);
    }
    setMounted(true);
  }, [lng]);

  // No SSR for i18n content
  if (!mounted) return null;

  return (
    <I18nContext.Provider value={{ i18n }}>{children}</I18nContext.Provider>
  );
}

// Custom hook to use translation
export function useTranslation() {
  const { i18n } = useContext(I18nContext);
  return {
    ...useTranslationOrg(),
    i18n,
  };
}
