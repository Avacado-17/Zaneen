import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import zaneenIcon from './icon.svg';

// Dynamically ensure Zaneen logo is applied to the browser tab header
if (typeof document !== 'undefined') {
  const existingFavicons = document.querySelectorAll("link[rel*='icon']");
  existingFavicons.forEach(el => el.remove());

  const link = document.createElement('link');
  link.type = 'image/svg+xml';
  link.rel = 'icon';
  link.href = zaneenIcon;
  document.head.appendChild(link);

  const shortcutLink = document.createElement('link');
  shortcutLink.rel = 'shortcut icon';
  shortcutLink.href = zaneenIcon;
  document.head.appendChild(shortcutLink);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
