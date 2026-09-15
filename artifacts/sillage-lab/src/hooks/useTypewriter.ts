import { useEffect, useState } from "react";

export function useTypewriter(phrases: string[]): string {
  const [displayed, setDisplayed] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");

  useEffect(() => {
    const current = phrases[phraseIdx] ?? "";
    let timeout: ReturnType<typeof setTimeout>;
    if (phase === "typing") {
      if (charIdx < current.length) {
        timeout = setTimeout(() => {
          setDisplayed(current.slice(0, charIdx + 1));
          setCharIdx((c) => c + 1);
        }, 38);
      } else {
        timeout = setTimeout(() => setPhase("pausing"), 1800);
      }
    } else if (phase === "pausing") {
      timeout = setTimeout(() => setPhase("deleting"), 400);
    } else if (charIdx > 0) {
      timeout = setTimeout(() => {
        setDisplayed(current.slice(0, charIdx - 1));
        setCharIdx((c) => c - 1);
      }, 18);
    } else {
      setPhraseIdx((i) => (i + 1) % Math.max(phrases.length, 1));
      setPhase("typing");
    }
    return () => clearTimeout(timeout);
  }, [phase, charIdx, phraseIdx, phrases]);

  return displayed;
}