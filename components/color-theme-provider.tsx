"use client"

import * as React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { colorThemes, DEFAULT_COLOR_THEME, getThemeByName, type ColorTheme } from "@/lib/themes"
import { useTheme } from "next-themes"
import { updateFavicon } from "@/lib/favicon-generator"

type ColorThemeProviderProps = {
  children: React.ReactNode
  defaultColorTheme?: string
  storageKey?: string
}

type ColorThemeProviderState = {
  colorTheme: string
  setColorTheme: (theme: string) => void
  themes: ColorTheme[]
}

const ColorThemeProviderContext = createContext<ColorThemeProviderState | undefined>(undefined)

export function ColorThemeProvider({
  children,
  defaultColorTheme = DEFAULT_COLOR_THEME,
  storageKey = "asyakitap-color-theme",
  ...props
}: ColorThemeProviderProps) {
  const [colorTheme, setColorTheme] = useState<string>(defaultColorTheme)
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  // Load theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored && getThemeByName(stored)) {
      setColorTheme(stored)
    }
    setMounted(true)
  }, [storageKey])

  // Apply theme CSS variables
  useEffect(() => {
    if (!mounted) return

    const theme = getThemeByName(colorTheme)
    if (!theme) return

    const isDark = resolvedTheme === "dark"
    const colors = isDark ? theme.colors.dark : theme.colors.light

    const root = document.documentElement

    // Apply all CSS variables
    root.style.setProperty("--background", colors.background)
    root.style.setProperty("--foreground", colors.foreground)
    root.style.setProperty("--card", colors.card)
    root.style.setProperty("--card-foreground", colors.cardForeground)
    root.style.setProperty("--popover", colors.popover)
    root.style.setProperty("--popover-foreground", colors.popoverForeground)
    root.style.setProperty("--primary", colors.primary)
    root.style.setProperty("--primary-foreground", colors.primaryForeground)
    root.style.setProperty("--secondary", colors.secondary)
    root.style.setProperty("--secondary-foreground", colors.secondaryForeground)
    root.style.setProperty("--muted", colors.muted)
    root.style.setProperty("--muted-foreground", colors.mutedForeground)
    root.style.setProperty("--accent", colors.accent)
    root.style.setProperty("--accent-foreground", colors.accentForeground)
    root.style.setProperty("--destructive", colors.destructive)
    root.style.setProperty("--border", colors.border)
    root.style.setProperty("--input", colors.input)
    root.style.setProperty("--ring", colors.ring)
    root.style.setProperty("--chart-1", colors.chart1)
    root.style.setProperty("--chart-2", colors.chart2)
    root.style.setProperty("--chart-3", colors.chart3)
    root.style.setProperty("--chart-4", colors.chart4)
    root.style.setProperty("--chart-5", colors.chart5)
    root.style.setProperty("--sidebar", colors.sidebar)
    root.style.setProperty("--sidebar-foreground", colors.sidebarForeground)
    root.style.setProperty("--sidebar-primary", colors.sidebarPrimary)
    root.style.setProperty("--sidebar-primary-foreground", colors.sidebarPrimaryForeground)
    root.style.setProperty("--sidebar-accent", colors.sidebarAccent)
    root.style.setProperty("--sidebar-accent-foreground", colors.sidebarAccentForeground)
    root.style.setProperty("--sidebar-border", colors.sidebarBorder)
    root.style.setProperty("--sidebar-ring", colors.sidebarRing)

    // Update favicon with primary color
    updateFavicon(colors.primary)
  }, [colorTheme, resolvedTheme, mounted])

  const value = {
    colorTheme,
    setColorTheme: (theme: string) => {
      localStorage.setItem(storageKey, theme)
      setColorTheme(theme)
    },
    themes: colorThemes,
  }

  return (
    <ColorThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ColorThemeProviderContext.Provider>
  )
}

export function useColorTheme() {
  const context = useContext(ColorThemeProviderContext)
  if (context === undefined) {
    throw new Error("useColorTheme must be used within a ColorThemeProvider")
  }
  return context
}
