import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { AIAssistantProvider } from './context/AIAssistantContext';
import { Toaster } from 'react-hot-toast';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AIAssistantProvider>
          <NotificationProvider>
            <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: '16px',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: '700',
                fontSize: '14px',
              },
            }}
          />
          </NotificationProvider>
        </AIAssistantProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
