"use client"

import * as React from "react"
import { Moon, Sun, Palette, Check } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useColorTheme } from "@/components/color-theme-provider"
import { cn } from "@/lib/utils"

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const { colorTheme, setColorTheme, themes } = useColorTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Tema seç</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Mode Section */}
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Görünüm
        </DropdownMenuLabel>
        <div className="flex gap-1 px-2 pb-2">
          <Button
            variant={theme === "light" ? "default" : "outline"}
            size="sm"
            className="flex-1 h-8"
            onClick={() => setTheme("light")}
          >
            <Sun className="h-4 w-4 mr-1" />
            Açık
          </Button>
          <Button
            variant={theme === "dark" ? "default" : "outline"}
            size="sm"
            className="flex-1 h-8"
            onClick={() => setTheme("dark")}
          >
            <Moon className="h-4 w-4 mr-1" />
            Koyu
          </Button>
        </div>

        <DropdownMenuSeparator />

        {/* Color Themes Section */}
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Renk Teması
        </DropdownMenuLabel>
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.name}
            onClick={() => setColorTheme(t.name)}
            className="cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-full border"
                style={{ backgroundColor: t.colors.light.primary }}
              />
              <span>{t.label}</span>
            </div>
            {colorTheme === t.name && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
