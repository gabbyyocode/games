import { useEffect, useId, useState } from "react";
import "./App.css";
import FlyingDragonGame from "./FlyingDragonGame";
import MathicDriverGame from "./MathicDriverGame";

function DragonArtwork() {
  const id = useId().replace(/:/g, "");

  return (
    <svg
      className="dragon-art"
      viewBox="0 0 640 480"
      role="img"
      aria-labelledby={`${id}-title`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id={`${id}-title`}>A little dragon soaring through a sunset sky</title>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8a17e" />
          <stop offset="0.52" stopColor="#f6c18c" />
          <stop offset="1" stopColor="#f8dfac" />
        </linearGradient>
        <linearGradient id={`${id}-wing`} x1="0" y1="0" x2="0.9" y2="1">
          <stop offset="0" stopColor="#8978ef" />
          <stop offset="1" stopColor="#5549ba" />
        </linearGradient>
        <filter id={`${id}-soft-shadow`} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#68456c" floodOpacity=".18" />
        </filter>
      </defs>
      <rect width="640" height="480" rx="28" fill={`url(#${id}-sky)`} />
      <circle cx="488" cy="104" r="52" fill="#fff1bd" opacity=".92" />
      <path d="M0 308c74-48 141-21 213 1 77 23 144-17 215-3 79 16 132 2 212-28v202H0z" fill="#e69a86" opacity=".55" />
      <path d="M0 365c83-33 150-10 222 10 92 25 172-26 259-6 55 13 107 7 159-9v120H0z" fill="#c77d91" opacity=".55" />
      <g fill="#fff4dd" opacity=".8">
        <path d="M110 133c5-17 21-27 39-25 12-24 48-22 56 5 17 1 29 13 29 27H110z" />
        <path d="M366 218c4-13 17-21 31-19 10-19 38-17 44 4 14 1 23 10 23 22H366z" opacity=".75" />
      </g>
      <g filter={`url(#${id}-soft-shadow)`} transform="translate(0 3)">
        <path d="M280 242c-15-75-69-104-119-82 19 24 31 52 28 83-1 16-8 30-20 41 45 4 82-8 111-42z" fill={`url(#${id}-wing)`} />
        <path d="M269 239c-25-37-54-56-87-63 23 22 35 46 36 73" fill="none" stroke="#b9afff" strokeWidth="5" strokeLinecap="round" opacity=".8" />
        <path d="M355 242c8-65 50-100 100-91-14 21-20 46-13 72 4 15 13 27 27 36-44 13-83 8-114-17z" fill={`url(#${id}-wing)`} />
        <path d="M371 237c19-32 44-53 77-66-18 25-26 49-22 74" fill="none" stroke="#b9afff" strokeWidth="5" strokeLinecap="round" opacity=".8" />
        <path d="M247 250c18-35 47-53 83-52 36 1 63 21 75 55 9 25 2 52-20 69-22 18-68 23-98 8-30-14-48-45-40-80z" fill="#7373de" />
        <path d="M278 203c-3-18 4-33 20-42 2 16 12 27 27 32m45 9c5-17 17-27 34-29-5 16-2 29 9 41" fill="#6664cf" stroke="#514eb4" strokeWidth="7" strokeLinejoin="round" />
        <path d="M280 284c-30 4-54 19-72 47 37 6 65-1 85-22" fill="none" stroke="#7373de" strokeWidth="16" strokeLinecap="round" />
        <path d="M206 331c-19 1-27-7-25-24" fill="none" stroke="#f08e78" strokeWidth="9" strokeLinecap="round" />
        <path d="M343 319c28 17 44 35 45 59m-80-57c-4 24-1 42 10 55" fill="none" stroke="#514eb4" strokeWidth="12" strokeLinecap="round" />
        <path d="M346 333l13 3m-45 8 13 4" stroke="#f3bd82" strokeWidth="5" strokeLinecap="round" />
        <ellipse cx="382" cy="255" rx="31" ry="27" fill="#7778e0" />
        <path d="M402 256c19 2 31 10 35 22-18 12-36 11-50-1" fill="#8587e8" />
        <circle cx="390" cy="249" r="5" fill="#27233e" />
        <circle cx="391" cy="247" r="1.7" fill="white" />
        <path d="M420 270c-6 7-14 9-22 7" fill="none" stroke="#4d4a9d" strokeWidth="3" strokeLinecap="round" />
        <path d="M410 256l6 1" stroke="#f4d28f" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g fill="#fff5df" opacity=".8">
        <path d="M121 243l5 12 12 5-12 5-5 12-5-12-12-5 12-5z" />
        <path d="M501 296l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" />
        <circle cx="173" cy="185" r="4" />
        <circle cx="465" cy="165" r="4" />
      </g>
    </svg>
  );
}

function App() {
  const game = new URLSearchParams(window.location.search).get("game");
  const homePath = window.location.pathname;
  const isDragonPage = game === "flying-dragon";
  const isMathicPage = game === "mathic-driver";
  const isGamePage = isDragonPage || isMathicPage;
  const [visitCount, setVisitCount] = useState<string | null>(null);

  useEffect(() => {
    if (isDragonPage) {
      document.title = "Flying Dragon — Gabby Yo Games";
    } else if (isMathicPage) {
      document.title = "Mathic Driver — Gabby Yo Games";
    } else {
      document.title = "Gabby Yo Games — Little worlds, big adventures";
    }
  }, [isDragonPage, isMathicPage]);

  useEffect(() => {
    let cancelled = false;

    fetch("https://gabbyyocode.goatcounter.com/counter/TOTAL.json")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`GoatCounter returned ${response.status}`);
        }
        return response.json() as Promise<{ count: string }>;
      })
      .then(({ count }) => {
        if (!cancelled) {
          setVisitCount(count);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          console.error("Failed to load the GoatCounter visitor total.", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href={homePath} aria-label="Gabby Yo Games home">
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span>gabby yo <strong>games</strong></span>
        </a>
        <nav aria-label="Main navigation">
          <a href={isGamePage ? `${homePath}#games` : "#games"}>{isGamePage ? "All games" : "The games"}</a>
          <a className="nav-cta" href={isGamePage ? homePath : "#about"}>{isGamePage ? "Home" : "A little about"}</a>
        </nav>
      </header>

      <main id="top">
        {isGamePage ? (
          <section className="game-page" aria-labelledby="game-page-title">
            <a className="text-link game-page-back" href={`${homePath}#games`}>
              <span aria-hidden="true">←</span> All games
            </a>
            <div className="game-page-heading">
              <p className="eyebrow">{isDragonPage ? "GAME NO. 001" : "GAME NO. 002"}</p>
              <h1 id="game-page-title">{isDragonPage ? "Flying Dragon" : "Mathic Driver"}</h1>
              <p>
                {isDragonPage
                  ? "Fly over the whales, then stop tapping to dive under lightning after 10 points. How far can you fly?"
                  : "Look through the windshield, remember the problem, then steer into the right answer."}
              </p>
            </div>
            {isDragonPage ? (
              <article className="game-card game-feature game-page-card">
                <FlyingDragonGame />
              </article>
            ) : (
              <article className="game-card mathic-game-card game-page-card">
                <MathicDriverGame />
              </article>
            )}
          </section>
        ) : (
          <>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="eyebrow-dot" /> A tiny indie game corner</p>
            <h1 id="hero-title">Little worlds.<br /><span>Big adventures.</span></h1>
            <p className="hero-description">
              A home for the games I dream up, make, and can’t wait to share. Pick a world and come play.
            </p>
            <a className="button button-primary" href="?game=flying-dragon">
              Play Flying Dragon <span aria-hidden="true">↓</span>
            </a>
            <div className="hero-note">
              <span className="note-sparkle" aria-hidden="true">✳</span>
              <span>Made with curiosity <span className="note-heart">♥</span> and a little bit of magic</span>
            </div>
          </div>
          <div className="hero-art-wrap" aria-hidden="true">
            <div className="hero-art-halo" />
            <div className="hero-art-frame"><DragonArtwork /></div>
            <span className="floaty floaty-star">✳</span>
            <span className="floaty floaty-sparkle">✦</span>
            <span className="art-caption">a new adventure is hatching</span>
          </div>
          <span className="hero-doodle" aria-hidden="true">✳</span>
        </section>

        <section className="games-section" id="games" aria-labelledby="games-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">The little game shelf</p>
              <h2 id="games-title">Pick a game. <span>Hit the road.</span></h2>
            </div>
            <p className="section-aside">Two little games.<br />A whole lot to play.</p>
          </div>

          <div className="game-shelf">
            <article className="game-card game-shelf-card">
              <div className="game-info">
                <div className="game-meta">
                  <span className="status"><span /> NOW PLAYABLE</span>
                  <span className="game-number">NO. 001</span>
                </div>
                <h3>Flying Dragon</h3>
                <p>Fly over the whales, then stop tapping to dive under lightning after 10 points. How far can you fly?</p>
                <a className="button button-outline" href="?game=flying-dragon">Play Flying Dragon <span aria-hidden="true">→</span></a>
              </div>
            </article>

            <article className="game-card game-shelf-card">
              <div className="game-info">
                <div className="game-meta">
                  <span className="status"><span /> NOW PLAYABLE</span>
                  <span className="game-number">NO. 002</span>
                </div>
                <h3>Mathic Driver</h3>
                <p>Remember the math question, then steer into the right answer as it comes down the road.</p>
                <a className="button button-outline" href="?game=mathic-driver">Play Mathic Driver <span aria-hidden="true">→</span></a>
              </div>
            </article>
          </div>

          <div className="coming-soon">
            <span className="coming-icon" aria-hidden="true">＋</span>
            <p><strong>More little worlds are on the way.</strong> The next idea could be anything.</p>
            <span className="coming-doodle" aria-hidden="true">✦</span>
          </div>
        </section>

        <section className="about-section" id="about">
          <div className="about-stamp" aria-hidden="true">
            <span>MADE OF</span><strong>✳</strong><span>IMAGINATION</span>
          </div>
          <div className="about-copy">
            <p className="eyebrow">A little about this place</p>
            <h2>Hi, I’m Gabby.<br /><span>I make games.</span></h2>
            <p>This is my little corner of the internet for playful ideas and the worlds they grow into. I’m building one game at a time—starting with a dragon who’s ready to fly.</p>
          </div>
          <a className="button button-outline" href="#top">Back to the top <span aria-hidden="true">↑</span></a>
        </section>
          </>
        )}
      </main>

      <footer className="site-footer">
        <a className="brand footer-brand" href={homePath}>
          <span className="brand-mark" aria-hidden="true"><span /><span /><span /><span /></span>
          <span>gabby yo <strong>games</strong></span>
        </a>
        <p>Made with a little magic <span aria-hidden="true">♥</span> © 2026 Gabby Yo Games</p>
        {visitCount !== null && <p className="footer-counter">Site visits: {visitCount}</p>}
        <a className="footer-top" href={isGamePage ? `${homePath}#games` : "#top"}>{isGamePage ? "All games ↑" : "Back to top ↑"}</a>
      </footer>
    </div>
  );
}

export default App;
