import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// #region agent log
// H1: Check if global is defined before imports
fetch('http://127.0.0.1:7242/ingest/6a246eaa-59bb-4532-828f-3f2f38f2a0df',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:6',message:'Global check before imports',data:{globalDefined:typeof global !== 'undefined',globalThisDefined:typeof globalThis !== 'undefined',windowDefined:typeof window !== 'undefined'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
// #endregion

// #region agent log
// H2, H3, H4, H5: Log initial DOM state before React render
fetch('http://127.0.0.1:7242/ingest/6a246eaa-59bb-4532-828f-3f2f38f2a0df',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:10',message:'DOM state before render',data:{htmlHeight:document.documentElement.offsetHeight,htmlComputedHeight:window.getComputedStyle(document.documentElement).height,bodyHeight:document.body.offsetHeight,bodyComputedHeight:window.getComputedStyle(document.body).height,htmlDisplay:window.getComputedStyle(document.documentElement).display,bodyDisplay:window.getComputedStyle(document.body).display},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2,H3,H4,H5'})}).catch(()=>{});
// #endregion

// Ensure root element exists
const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found')
}

// #region agent log
// H1, H2, H3, H4, H5: Log root element state
fetch('http://127.0.0.1:7242/ingest/6a246eaa-59bb-4532-828f-3f2f38f2a0df',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:22',message:'Root element found',data:{rootHeight:rootElement.offsetHeight,rootClasses:rootElement.className},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H3,H4,H5'})}).catch(()=>{});
// #endregion

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// #region agent log
// H1: Log successful render initiation
fetch('http://127.0.0.1:7242/ingest/6a246eaa-59bb-4532-828f-3f2f38f2a0df',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:27',message:'React render initiated successfully',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
// #endregion

// #region agent log
// H1, H2, H3, H4, H5: Log DOM state after React render (use setTimeout to ensure render completes)
setTimeout(() => {
  fetch('http://127.0.0.1:7242/ingest/6a246eaa-59bb-4532-828f-3f2f38f2a0df',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.jsx:28',message:'DOM state after render',data:{htmlHeight:document.documentElement.offsetHeight,htmlComputedHeight:window.getComputedStyle(document.documentElement).height,htmlMinHeight:window.getComputedStyle(document.documentElement).minHeight,bodyHeight:document.body.offsetHeight,bodyComputedHeight:window.getComputedStyle(document.body).height,bodyMinHeight:window.getComputedStyle(document.body).minHeight,rootHeight:rootElement.offsetHeight,appContainerHeight:document.querySelector('.min-h-screen')?.offsetHeight},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H3,H4,H5'})}).catch(()=>{});
}, 100);
// #endregion

