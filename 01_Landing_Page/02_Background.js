// Generates the animated space background (blurred radial nebula gradient + twinkling starfield) for the landing page.
export function InitBackground(container) {
  container.innerHTML = `
  <style>
    .nebula {
      position: fixed;
      inset: 0;
      z-index: 1;
      background:
        radial-gradient(circle at 20% 30%, rgba(107, 140, 255, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 80% 70%, rgba(0, 212, 132, 0.05) 0%, transparent 40%);
      filter: blur(40px);
      pointer-events: none;
    }

    #starfield {
      position: fixed;
      inset: 0;
      z-index: 2;
      pointer-events: none;
    }

    .star {
      position: absolute;
      background: white;
      border-radius: 50%;
      animation: twinkle infinite ease-in-out;
    }

    @keyframes twinkle {
      0%,
      100% {
        opacity: 0.2;
        transform: scale(0.8);
      }

      50% {
        opacity: 1;
        transform: scale(1.2);
      }
    }
  </style>
  <div class="nebula"></div>
  <div id="starfield"></div>
  `;

  const starfield = document.getElementById('starfield');
  const count = Math.floor((window.innerWidth * window.innerHeight) / 1000);
  for (let i = 0; i < count; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    const size = Math.random() * 2 + 0.5;
    star.style.width = `${size}px`;
    star.style.height = `${size}px`;
    star.style.animationDuration = `${Math.random() * 3 + 2}s`;
    star.style.animationDelay = `${Math.random() * 5}s`;
    starfield.appendChild(star);
  }
}
