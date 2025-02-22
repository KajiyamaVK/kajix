import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthMiddleware } from './middleware/auth';
import { Login } from './pages/Login';

function App() {
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'pt-BR' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public route - no auth required */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes - require auth */}
        <Route
          path="/*"
          element={
            <AuthMiddleware>
              <div className="p-4">
                <h1 className="text-2xl font-bold mb-4">{t('common.welcome')}</h1>
                
                <button
                  onClick={toggleLanguage}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {t('common.language')}: {i18n.language === 'en' ? 'English' : 'Português'}
                </button>

                <nav className="mt-4">
                  <ul className="flex gap-4">
                    <li>{t('navigation.home')}</li>
                    <li>{t('navigation.settings')}</li>
                  </ul>
                </nav>
              </div>
            </AuthMiddleware>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
