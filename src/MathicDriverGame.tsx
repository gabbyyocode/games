import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";

type Difficulty = "easy" | "medium" | "hard" | "times-table";
type GamePhase = "ready" | "drive" | "question" | "recall" | "answers" | "crash" | "over";

type MathProblem = {
  prompt: string;
  answer: number;
  step: number;
};

const PHASE_DURATIONS: Partial<Record<GamePhase, number>> = {
  drive: 5000,
  question: 3000,
  recall: 3000,
  answers: 8000,
  crash: 3000,
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function shuffle<T>(values: T[]): T[] {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function createProblem(difficulty: Difficulty): MathProblem {
  if (difficulty === "times-table") {
    const a = randomInt(1, 10);
    const b = randomInt(1, 10);
    return { prompt: `${a} × ${b}`, answer: a * b, step: 1 };
  }

  if (difficulty === "easy") {
    const kind = randomInt(0, 3);
    if (kind === 0) {
      const a = randomInt(120, 690);
      const b = randomInt(110, 309);
      return { prompt: `${a} + ${b}`, answer: a + b, step: 1 };
    }
    if (kind === 1) {
      const a = randomInt(240, 999);
      const b = randomInt(110, a - 1);
      return { prompt: `${a} − ${b}`, answer: a - b, step: 1 };
    }
    if (kind === 2) {
      const a = randomInt(12, 49);
      const b = randomInt(2, 9);
      return { prompt: `${a} × ${b}`, answer: a * b, step: 1 };
    }
    const divisor = randomInt(2, 12);
    const quotient = randomInt(3, 12);
    return { prompt: `${divisor * quotient} ÷ ${divisor}`, answer: quotient, step: 1 };
  }

  if (difficulty === "medium") {
    const kind = randomInt(0, 3);
    if (kind === 0 || kind === 1) {
      const a = randomInt(12, 85) / 10;
      const b = randomInt(10, kind === 0 ? 48 : Math.floor((a - 0.1) * 10)) / 10;
      const answer = kind === 0 ? a + b : a - b;
      return {
        prompt: `${formatNumber(a)} ${kind === 0 ? "+" : "−"} ${formatNumber(b)}`,
        answer: Number(answer.toFixed(1)),
        step: 0.1,
      };
    }
    if (kind === 2) {
      const a = randomInt(13, 69);
      const b = randomInt(3, 12);
      return { prompt: `${a} × ${b}`, answer: a * b, step: 1 };
    }
    const divisor = randomInt(3, 15);
    const quotient = randomInt(12, 48);
    return { prompt: `${divisor * quotient} ÷ ${divisor}`, answer: quotient, step: 1 };
  }

  const kind = randomInt(0, 2);
  if (kind === 0) {
    const signed = randomInt(-38, 38);
    const other = randomInt(12, 48);
    return {
      prompt: `${signed < 0 ? `(${signed})` : signed} ${signed < 0 ? "+" : "−"} ${other}`,
      answer: signed < 0 ? signed + other : signed - other,
      step: 1,
    };
  }
  if (kind === 1) {
    const percent = [10, 15, 20, 25, 30][randomInt(0, 4)];
    const amount = randomInt(2, 20) * 20;
    return {
      prompt: `${percent}% of ${amount}`,
      answer: (percent * amount) / 100,
      step: 1,
    };
  }
  const a = randomInt(2, 18);
  const b = randomInt(2, 9);
  const c = randomInt(2, 9);
  return { prompt: `${a} + ${b} × ${c}`, answer: a + b * c, step: 1 };
}

function createChoices(problem: MathProblem) {
  const offsets = shuffle([-3, -2, -1, 1, 2, 3]);
  const answers = [problem.answer];
  for (const offset of offsets) {
    const value = Number((problem.answer + problem.step * offset).toFixed(1));
    if (!answers.includes(value)) answers.push(value);
    if (answers.length === 4) break;
  }
  return shuffle(answers).map(formatNumber);
}

function GameHearts({ lives }: { lives: number }) {
  return (
    <span className="mathic-hearts" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <span className={`mathic-heart${index >= lives ? " is-empty" : ""}`} key={index} />
      ))}
    </span>
  );
}

function MathicDriverGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [phase, setPhase] = useState<GamePhase>("ready");
  const [problem, setProblem] = useState<MathProblem | null>(null);
  const [choices, setChoices] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [selectedLane, setSelectedLane] = useState(1);
  const [lastCrash, setLastCrash] = useState("");
  const pointerStartX = useRef<number | null>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const selectedLaneRef = useRef(selectedLane);
  selectedLaneRef.current = selectedLane;

  const resolveLane = (lane: number) => {
    if (phase !== "answers" || !problem) return;
    setSelectedLane(lane);
    if (choices[lane] === formatNumber(problem.answer)) {
      setScore((current) => current + 1);
      setProblem(null);
      setPhase("drive");
    } else {
      setLastCrash(`The answer was ${formatNumber(problem.answer)}.`);
      setLives((current) => current - 1);
      setPhase("crash");
    }
  };

  const steerLane = (direction: -1 | 1) => {
    const nextLane = Math.max(0, Math.min(3, selectedLaneRef.current + direction));
    selectedLaneRef.current = nextLane;
    setSelectedLane(nextLane);
  };

  const handleLaneKey = (key: string, preventDefault: () => void) => {
    if (key === "ArrowLeft" || key === "ArrowRight") {
      preventDefault();
      steerLane(key === "ArrowLeft" ? -1 : 1);
    } else if (phase === "answers" && key === "Enter") {
      preventDefault();
      resolveLane(selectedLaneRef.current);
    } else if (phase === "answers" && key >= "1" && key <= "4") {
      preventDefault();
      resolveLane(Number(key) - 1);
    }
  };

  const handleGameKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" && event.target instanceof HTMLButtonElement) return;
    handleLaneKey(event.key, () => event.preventDefault());
  };

  useEffect(() => {
    const duration = PHASE_DURATIONS[phase];
    if (!duration) return;

    const startedAt = performance.now();
    setTimeLeft(duration);
    const intervalId = window.setInterval(() => {
      const remaining = Math.max(0, duration - (performance.now() - startedAt));
      setTimeLeft(remaining);
    }, 100);

    const timeoutId = window.setTimeout(() => {
      if (phase === "drive") {
        const nextProblem = createProblem(difficulty);
        setProblem(nextProblem);
        setPhase("question");
      } else if (phase === "question") {
        setPhase("recall");
      } else if (phase === "recall") {
        if (problem) {
          setChoices(createChoices(problem));
        }
        setPhase("answers");
      } else if (phase === "answers") {
        resolveLane(selectedLaneRef.current);
      } else if (phase === "crash") {
        setPhase(lives <= 0 ? "over" : "drive");
      }
    }, duration);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [difficulty, lives, phase, problem]);

  useEffect(() => {
    if (phase === "ready" || phase === "over") return;

    const handleWindowKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.target instanceof Node && sceneRef.current?.contains(event.target)) return;
      if (event.target instanceof HTMLElement && event.target.matches("input, textarea, select, [contenteditable=true]")) return;
      handleLaneKey(event.key, () => event.preventDefault());
    };

    window.addEventListener("keydown", handleWindowKeyDown);
    return () => window.removeEventListener("keydown", handleWindowKeyDown);
  }, [phase]);

  const startGame = () => {
    setScore(0);
    setLives(3);
    setProblem(null);
    setChoices([]);
    setSelectedLane(1);
    setLastCrash("");
    setPhase("drive");
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (phase === "ready" || phase === "over") return;
    pointerStartX.current = event.clientX;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const startX = pointerStartX.current;
    pointerStartX.current = null;
    if (phase === "ready" || phase === "over" || startX === null) return;

    const distance = event.clientX - startX;
    if (Math.abs(distance) < 30) return;
    event.preventDefault();
    const sceneWidth = sceneRef.current?.getBoundingClientRect().width ?? 0;
    if (sceneWidth === 0) return;
    const laneSteps = Math.max(1, Math.round((Math.abs(distance) / sceneWidth) * 4));
    for (let step = 0; step < laneSteps; step += 1) {
      steerLane(distance < 0 ? -1 : 1);
    }
  };

  const timerSeconds = Math.ceil(timeLeft / 1000);
  const progress = PHASE_DURATIONS[phase]
    ? 1 - timeLeft / PHASE_DURATIONS[phase]!
    : 0;

  return (
    <div className="mathic-game" onKeyDownCapture={handleGameKeyDownCapture}>
      <div className="mathic-game-header">
        <div className="mathic-game-title">
          <span className="mathic-car-mark" aria-hidden="true">✦</span>
          <div>
            <p className="mathic-kicker">GAME NO. 002</p>
            <h4>Mathic Driver</h4>
          </div>
        </div>
        <div className="mathic-scoreboard" aria-live="polite">
          <span><small>SCORE</small><strong>{score}</strong></span>
          <span className="mathic-lives" aria-label={`${lives} lives remaining`}>
            <small>LIVES</small>
            <GameHearts lives={lives} />
          </span>
        </div>
      </div>

      <div
        className={`mathic-scene mathic-phase-${phase}`}
        ref={sceneRef}
        tabIndex={phase === "answers" ? 0 : -1}
        style={{
          "--mathic-car-shift": `${(selectedLane - 1.5) * 5}%`,
          "--mathic-steer-shift": `${(1.5 - selectedLane) * 9}%`,
        } as CSSProperties}
        aria-keyshortcuts="ArrowLeft ArrowRight Enter"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={() => {
          pointerStartX.current = null;
        }}
        aria-label="Mathic Driver. Look through the windshield and steer into an answer lane."
      >
        <div
          className="mathic-world"
          style={{
            rotate: `y ${(selectedLane - 1.5) * 1.3}deg`,
            translate: `${(1.5 - selectedLane) * 2.5}% 0`,
            transform: `perspective(1100px) rotateZ(${(1.5 - selectedLane) * 0.45}deg)`,
          }}
        >
          <div className="mathic-sky">
            <span className="mathic-sun" />
            <span className="mathic-cloud mathic-cloud-one" />
            <span className="mathic-cloud mathic-cloud-two" />
          </div>
          <div className="mathic-water" aria-hidden="true" />
          <div className="mathic-bridge" aria-hidden="true">
            <span className="mathic-bridge-supports" />
            <span className="mathic-bridge-rail mathic-bridge-rail-left" />
            <span className="mathic-bridge-rail mathic-bridge-rail-right" />
          </div>
          <div className="mathic-road">
            <span className="mathic-road-line mathic-road-line-left" />
            <span className="mathic-road-line mathic-road-line-right" />
            <span className="mathic-center-dashes" />
          </div>
        </div>
        <div className="mathic-windshield-frame" aria-hidden="true">
          <span className="mathic-windshield-roof" />
          <span className="mathic-windshield-pillar mathic-windshield-pillar-left" />
          <span className="mathic-windshield-pillar mathic-windshield-pillar-right" />
        </div>
        <div className="mathic-dash">
          <div className="mathic-dash-score"><span>POINTS</span><strong>{score.toString().padStart(2, "0")}</strong></div>
          <div className="mathic-speed"><strong>{phase === "crash" || phase === "over" ? "0" : "42"}</strong><span>KM/H</span></div>
          <div className="mathic-dash-lives" aria-label={`${lives} lives`}>
            <GameHearts lives={lives} />
          </div>
          {phase !== "ready" && phase !== "over" && (
            <div className="mathic-steering-controls" aria-label="Steer between answer lanes">
              <button type="button" aria-label="Steer left" onClick={() => steerLane(-1)}>←</button>
              <button type="button" aria-label="Steer right" onClick={() => steerLane(1)}>→</button>
            </div>
          )}
          <div
            className="mathic-steering-wheel"
            style={{ transform: `translateX(calc(-50% + var(--mathic-car-shift))) rotate(${(selectedLane - 1.5) * 24}deg)` }}
            aria-hidden="true"
          >
            <span />
          </div>
        </div>

        {phase === "question" && problem && (
          <div className="mathic-question-sign" aria-live="assertive">
            <span>QUICK! SOLVE THIS</span>
            <strong>{problem.prompt} = ?</strong>
            <small>Remember it!</small>
          </div>
        )}
        {phase === "recall" && (
          <div className="mathic-recall-sign">
            <span>THE SIGN DISAPPEARS...</span>
            <strong>Keep the answer in mind!</strong>
            <small>Answers in {timerSeconds}</small>
          </div>
        )}
        {phase === "drive" && (
          <div className="mathic-driving-sign">
            <span>{score === 0 ? "THE ROAD IS CLEAR" : "NICE DRIVING!"}</span>
            <strong>Next question in {timerSeconds}</strong>
          </div>
        )}

        {phase === "answers" && (
          <>
            <div className="mathic-answer-signs" role="group" aria-label="Choose the correct answer lane">
              {choices.map((choice, index) => (
                <button
                  className={`mathic-answer-sign${selectedLane === index ? " is-selected" : ""}`}
                  key={`${choice}-${index}`}
                  onClick={() => resolveLane(index)}
                  aria-label={`Lane ${index + 1}: ${choice}`}
                >
                  <span>{index + 1}</span>
                  <strong>{choice}</strong>
                </button>
              ))}
            </div>
            <p className="mathic-steer-hint">STEER INTO A LANE BEFORE IT REACHES YOU</p>
          </>
        )}

        {(phase === "ready" || phase === "over") && (
          <div className="mathic-overlay">
            <div className="mathic-prompt">
              <span className="mathic-prompt-spark" aria-hidden="true">✦</span>
              <p className="mathic-prompt-kicker">{phase === "ready" ? "EYES ON THE ROAD" : "PIT STOP"}</p>
              <h5>{phase === "ready" ? "Ready to drive?" : "Out of lives!"}</h5>
              {phase === "ready" ? (
                <>
                  <p className="mathic-prompt-copy">Pick your math level, remember the question, then steer into its answer as the signs rush toward you.</p>
                  <div className="mathic-level-picker" aria-label="Choose difficulty">
                    {(["easy", "medium", "hard", "times-table"] as const).map((level) => (
                      <button
                        key={level}
                        className={difficulty === level ? "is-selected" : ""}
                        onClick={() => setDifficulty(level)}
                        aria-pressed={difficulty === level}
                      >
                        <strong>{level === "times-table" ? "Gangetabellen" : level}</strong>
                        <span>
                          {level === "easy" ? "Grade 4" :
                            level === "medium" ? "Grades 5–6" :
                              level === "hard" ? "Grade 7" : "1–10 × 1–10"}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button className="mathic-start-button" onClick={startGame}>Start your engine <span aria-hidden="true">→</span></button>
                  <p className="mathic-control-hint">← → OR SWIPE TO STEER · ENTER / TAP TO HIT</p>
                </>
              ) : (
                <>
                  <p className="mathic-prompt-copy">You scored {score} {score === 1 ? "point" : "points"}. {lastCrash}</p>
                  <button className="mathic-start-button" onClick={startGame}>Drive again <span aria-hidden="true">→</span></button>
                </>
              )}
            </div>
          </div>
        )}

        {phase === "crash" && (
          <div className="mathic-windshield-splash" aria-hidden="true">
            <img src="IMG_0853.png" alt="" />
          </div>
        )}
        {phase === "crash" && (
          <div className="mathic-crash-message" role="status">
            <strong>SPLAT!</strong>
            <span>{lastCrash}</span>
            <small>Wiping the windshield in {timerSeconds}…</small>
          </div>
        )}
        {PHASE_DURATIONS[phase] && (
          <div className="mathic-timer-track" aria-hidden="true">
            <span style={{ transform: `scaleX(${progress})` }} />
          </div>
        )}
      </div>

      <div className="mathic-game-footer">
        <span>
          {phase === "question" ? "Memorize the problem!" :
            phase === "recall" ? "The answer choices are coming..." :
              phase === "answers" ? "Steer with ← → or swipe; hit Enter or tap to choose early." :
                phase === "crash" ? "Take a breath. You’ll be back on the road soon." :
                  phase === "over" ? "Every great driver gets another try." :
                    phase === "drive" ? "Enjoy the drive. A question is coming up!" :
                      "Three lives. One road. How far can you get?"}
        </span>
        {phase !== "ready" && phase !== "over" && (
          <span className="mathic-key-hint">
            {phase === "answers" ? "← → STEER · ENTER TO HIT" : "← → STEER ANYTIME"}
          </span>
        )}
      </div>
    </div>
  );
}

export default MathicDriverGame;
