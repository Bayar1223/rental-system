import { useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const IDLE_TIMEOUT     = 30 * 60 * 1000; // 30 минут
const WARNING_BEFORE   = 2  * 60 * 1000; // 2 минутын өмнө сануулах

const ACTIVITY_EVENTS = [
  "mousemove", "mousedown", "keydown",
  "touchstart", "scroll", "click",
];

export function useIdleTimeout(enabled = true) {
  const navigate      = useNavigate();
  const timerRef      = useRef(null);
  const warningRef    = useRef(null);
  const warningShown  = useRef(false);
  const resetTimerRef = useRef(null);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { state: { reason: "idle" } });
  }, [navigate]);

  const resetTimer = useCallback(() => {
    clearTimeout(timerRef.current);
    clearTimeout(warningRef.current);
    warningShown.current = false;

    // 28 минутад сануулга
    warningRef.current = setTimeout(() => {
      if (warningShown.current) return;
      warningShown.current = true;
      const stay = window.confirm(
        "⚠️ 2 минутын дараа автоматаар гарна.\nҮргэлжлүүлэх үү?"
      );
      if (stay) {
        resetTimerRef.current?.();
      } else {
        logout();
      }
    }, IDLE_TIMEOUT - WARNING_BEFORE);

    // 30 минутад автомат гаргах
    timerRef.current = setTimeout(() => {
      logout();
    }, IDLE_TIMEOUT);
  }, [logout]);

  // resetTimer-г ref-д хадгалах
  useEffect(() => {
    resetTimerRef.current = resetTimer;
  }, [resetTimer]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token || !enabled) return;

    resetTimer();

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, resetTimer, { passive: true });
    });

    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(warningRef.current);
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [enabled, resetTimer]);
}