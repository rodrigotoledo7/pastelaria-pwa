import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
// Registro imediato do Service Worker PWA
import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Novo conteúdo disponível. O PWA será atualizado automaticamente.');
  },
  onOfflineReady() {
    console.log('App pronto para funcionar offline.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
