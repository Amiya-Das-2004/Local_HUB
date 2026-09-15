export function InitLoading(container, state) {
  const tabCount = state.tabs ? state.tabs.length : 0;
  
  container.innerHTML = `
        <style>
      #intro {
        position: fixed;
        inset: 0;
        z-index: 50;
        background: var(--bg);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
        gap: 24px;
        transition: opacity 0.8s ease;
      }

      #intro.hide {
        opacity: 0;
        pointer-events: none;
      }

      .loader-orb {
        width: 56px;
        height: 56px;
        position: relative;
      }

      .loader-orb::before,
      .loader-orb::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        border: 1px solid transparent;
        border-top-color: var(--accent);
        animation: spin 1.4s linear infinite;
      }

      .loader-orb::after {
        inset: 10px;
        border-top-color: var(--accent-3);
        animation-duration: 1s;
        animation-direction: reverse;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    </style>

    <div id="intro">
      <div class="loader-orb"></div>
      <div class="text-center" style="text-align: center;">
        <div class="mono text-[10px] tracking-[0.4em] text-[--muted] mb-2" style="margin-bottom: 8px;">INITIALIZING LOCAL HUB
        </div>
        <div class="mono text-[10px] tracking-[0.3em] text-[--accent]">${tabCount} TABS</div>
      </div>
    </div>
  `;

  // Hide the loader after 1200ms
  setTimeout(() => {
    const intro = document.getElementById('intro');
    if (intro) intro.classList.add('hide');
  }, 1200);
}
