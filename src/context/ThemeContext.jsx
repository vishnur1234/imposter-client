import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const themeColors = {
  light: {
    isDark: false,
    primary: "#1465F1",
    primaryHover: "#1053c2",
    primaryLight: "#e3f0ff",
    secondary: "#3bb6e5",
    background: "#FFFFFF",
    surface: "#f7f9fc",
    border: "#e0e0e0",
    textPrimary: "#1A1A1A",
    textSecondary: "#4A4A4A",
    textDisabled: "#9E9E9E",
    white: "#FFFFFF",
    black: "#000000",
    overlay: "rgba(0, 0, 0, 0.4)",
    primaryOverlay: "rgba(20, 101, 241, 0.15)",
    placeholder: "#e2e2e2",
    success: "#00B96F",
    warning: "#FFA000",
    error: "#D32F2F",
    gradientBg: ["#FFFFFF", "#F7F9FC", "#E2E8F0"],
    gradientBtn: ["#1465F1", "#3E88FC"],
    gradientSuccess: ["#00B96F", "#10B981"],
    gradientDanger: ["#D32F2F", "#EF4444"],
  },
  dark: {
    isDark: true,
    primary: "#1465F1",
    primaryHover: "#3E88FC",
    primaryLight: "#235CEB",
    secondary: "#3bb6e5",
    background: "#000000",
    surface: "#0a0a0a",
    border: "#1f1f1f",
    textPrimary: "#ffffff",
    textSecondary: "#cccccc",
    textDisabled: "#777777",
    white: "#FFFFFF",
    black: "#000000",
    overlay: "rgba(0, 0, 0, 0.8)",
    primaryOverlay: "rgba(20, 101, 241, 0.15)",
    placeholder: "#121212",
    success: "#00B96F",
    warning: "#FFA000",
    error: "#D32F2F",
    gradientBg: ["#051532", "#000000", "#000000"],
    gradientBtn: ["#1465F1", "#3E88FC"],
    gradientSuccess: ["#00B96F", "#10B981"],
    gradientDanger: ["#D32F2F", "#EF4444"],
  }
};

export const typography = {
  h1: { fontFamily: "'Orbitron', sans-serif", fontSize: "32px", fontWeight: "900" },
  h2: { fontFamily: "'Orbitron', sans-serif", fontSize: "28px", fontWeight: "800" },
  h3: { fontFamily: "'Inter', sans-serif", fontSize: "24px", fontWeight: "700" },
  h4: { fontFamily: "'Inter', sans-serif", fontSize: "20px", fontWeight: "700" },
  h5: { fontFamily: "'Inter', sans-serif", fontSize: "18px", fontWeight: "600" },
  h6: { fontFamily: "'Inter', sans-serif", fontSize: "16px", fontWeight: "600" },
  h7: { fontFamily: "'Inter', sans-serif", fontSize: "14px", fontWeight: "500" },
  h8: { fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: "700" },
  sub1: { fontFamily: "'Inter', sans-serif", fontSize: "18px", fontWeight: "600" },
  sub2: { fontFamily: "'Orbitron', sans-serif", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: "700" },
  sub3: { fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: "400" },
  sub4: { fontFamily: "'Orbitron', sans-serif", fontSize: "10px", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: "700" },
  sub5: { fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: "400" },
  sub6: { fontFamily: "'Inter', sans-serif", fontSize: "15px", fontWeight: "400" },
  sub7: { fontFamily: "'Inter', sans-serif", fontSize: "14px", fontWeight: "500" },
  sub8: { fontFamily: "'Orbitron', sans-serif", fontSize: "9px", letterSpacing: "2px", textTransform: "uppercase", fontWeight: "900" },
  body1: { fontFamily: "'Inter', sans-serif", fontSize: "15px", fontWeight: "400" },
  body2: { fontFamily: "'Inter', sans-serif", fontSize: "14px", fontWeight: "400" },
  body3: { fontFamily: "'Inter', sans-serif", fontSize: "13px", fontWeight: "400" },
  body4: { fontFamily: "'Inter', sans-serif", fontSize: "11px", fontWeight: "400" },
  body5: { fontFamily: "'Inter', sans-serif", fontSize: "12px", letterSpacing: "1.5px", textTransform: "uppercase", fontWeight: "400" },
  btn1: { fontFamily: "'Orbitron', sans-serif", fontSize: "16px", letterSpacing: "1px", fontWeight: "800" },
  btn2: { fontFamily: "'Orbitron', sans-serif", fontSize: "14px", letterSpacing: "1px", fontWeight: "700" },
  btn3: { fontFamily: "'Inter', sans-serif", fontSize: "12px", fontWeight: "400" },
  score: { fontFamily: "'Orbitron', sans-serif", fontSize: "64px", fontWeight: "900" },
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark"); // Default to dark for premium feel

  useEffect(() => {
    const storedTheme = localStorage.getItem("@app_theme");
    if (storedTheme) {
      setTheme(storedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("@app_theme", nextTheme);
  };

  const colors = themeColors[theme];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors, typography }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
