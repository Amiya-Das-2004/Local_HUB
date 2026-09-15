export function GetFooterHTML() {
  return `
    <style>
      .app-footer {
        width: 100%;
        margin-top: auto;
        box-sizing: border-box;
      }

      .footer-inner {
        max-width: 800px;
        width: 100%;
        margin: 0 auto;
        padding: 24px 16px;
        border-top: 1px solid var(--border, #2a2e40);
        text-align: center;
        color: var(--text-dim, #6b7088);
        font-size: 11px;
        letter-spacing: 0.05em;
        user-select: none;
        box-sizing: border-box;
        transition: border-color var(--transition, 0.2s);
      }

      @media (max-width: 600px) {
        .footer-inner {
          padding: 18px 12px;
          font-size: 10.5px;
        }
      }
    </style>

    <footer class="app-footer">
      <div class="footer-inner">
        <div>Local HUB &copy; ${new Date().getFullYear()} &mdash; Personal Research Workspace</div>
      </div>
    </footer>
  `;
}
