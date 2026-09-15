// Creates and appends <style id="landing-theme-style"> to document.head if not already present.
export function InitTheme() {
  if (document.getElementById('landing-theme-style')) return;
  const style = document.createElement('style');
  style.id = 'landing-theme-style';
  style.textContent = `
  :root {
    --bg: #03010a;
    --fg: #e2e8f0;
    --accent: #6b8cff;
    --muted: #475569;
    --border: rgba(107, 140, 255, 0.2);
  }

  body {
    margin: 0;
    padding: 0;
    background-color: var(--bg);
    color: var(--fg);
    font-family: 'Space Grotesk', sans-serif;
  }

  .mono {
    font-family: 'JetBrains Mono', monospace;
  }

  .vignette {
    position: fixed;
    inset: 0;
    z-index: 5;
    pointer-events: none;
    background: radial-gradient(circle at center, transparent 30%, rgba(3, 1, 10, 0.8) 100%);
  }

  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&family=JetBrains+Mono:wght@300;400;600;700&display=swap');
  `;
  document.head.appendChild(style);
}
