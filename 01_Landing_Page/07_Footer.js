import { GetLogoHTML } from './04_Save_Icon_Logo.js';

export function InitFooter(container) {
  // We've moved the layout entirely to traditional CSS here so you can easily control it.
  // Tailwind is only used on the outer container to pin it to the bottom of the screen.
  container.innerHTML = `
    <style>
      :root {
        /* Distance from the left edge of the screen */
        --footer-left-padding: -50px;
        /* Distance between the round logo icon and the text block */
        --logo-icon-spacing: -50px;
      }

      .footer-left {
        display: flex;
        align-items: flex-end;
        gap: var(--logo-icon-spacing);
        padding-left: var(--footer-left-padding);
        padding-bottom: 40px;
        pointer-events: auto;
        user-select: none;
      }

      /* The SVG Logo */
      .logo-icon {
        flex-shrink: 0;
      }

      /* The Text Group */
      .logo-title-group {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      }

      .logo-title {
        font-size: 2.5rem;
        font-weight: 300;
        letter-spacing: -0.02em;
        line-height: 1;
        margin-bottom: 8px;
        font-family: 'Space Grotesk', sans-serif;
      }

      .logo-sub {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.65rem;
        letter-spacing: 0.2em;
        color: var(--muted);
        text-transform: uppercase;
        /* It will naturally flex within its column */
      }

      .logo-line {
        /* Set to 100% so it stretches (flexes) across the entire width of the text block */
        width: 50%;
        max-width: flex;
        /*Optional: cap how far it can stretch */
        height: 2px;
        background: var(--accent);
        margin-top: 15px;
        opacity: 0.5;
      }
    </style>

    <div class="fixed bottom-0 left-0 w-full z-20 pointer-events-none">

      <div class="footer-left">
        <div class="logo-icon">
          ${GetLogoHTML()}
        </div>

        <div class="logo-title-group">
          <div class="logo-title">
            <span style="color:#ffffff;">Local</span><span style="color:#6b8cff;"> HUB</span>
          </div>
          <div class="logo-sub">A multi-tool workspace for research and personal use.</div>
          <div class="logo-line"></div>
        </div>
      </div>

    </div>
  `;
}
