import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import 'lenis/dist/lenis.css'
import { ReactLenis } from 'lenis/react'
import App from './App.jsx'

const lenisOptions = {
  autoRaf: true,
  anchors: true,
  smoothWheel: true,
  lerp: 0.1,
  respectReducedMotion: true,
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ReactLenis root options={lenisOptions}>
      <App />
    </ReactLenis>
  </StrictMode>,
)
