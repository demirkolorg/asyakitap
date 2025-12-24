"use client"

import * as React from "react"
import { useState } from "react"
import { Palette, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useColorTheme } from "@/components/color-theme-provider"
import { cn } from "@/lib/utils"

export function ColorThemeSelector() {
  const [open, setOpen] = useState(false)
  const { colorTheme, setColorTheme, themes } = useColorTheme()

  const handleSelectTheme = (themeName: string) => {
    setColorTheme(themeName)
    // Modal'ı hemen kapatma - kullanıcı önizleme yapabilsin
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Palette className="h-5 w-5" />
          <span className="sr-only">Renk teması seç</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Renk Teması</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 py-4 max-h-[70vh] overflow-y-auto">
          {themes.map((theme) => {
            const isSelected = colorTheme === theme.name
            return (
              <button
                key={theme.name}
                onClick={() => handleSelectTheme(theme.name)}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all hover:scale-105",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                {/* Color Preview Card */}
                <div
                  className="w-full aspect-square rounded-md overflow-hidden shadow-sm"
                  style={{ backgroundColor: theme.colors.light.background }}
                >
                  {/* Mini UI Preview */}
                  <div className="h-full p-1.5 flex flex-col gap-1">
                    {/* Header bar */}
                    <div
                      className="h-2 rounded-sm"
                      style={{ backgroundColor: theme.colors.light.primary }}
                    />
                    {/* Content area */}
                    <div className="flex-1 flex gap-1">
                      {/* Sidebar */}
                      <div
                        className="w-1/4 rounded-sm"
                        style={{ backgroundColor: theme.colors.light.muted }}
                      />
                      {/* Main content */}
                      <div className="flex-1 flex flex-col gap-0.5">
                        <div
                          className="h-1.5 w-3/4 rounded-sm"
                          style={{ backgroundColor: theme.colors.light.foreground, opacity: 0.3 }}
                        />
                        <div
                          className="h-1.5 w-1/2 rounded-sm"
                          style={{ backgroundColor: theme.colors.light.foreground, opacity: 0.2 }}
                        />
                        <div
                          className="mt-auto h-2 w-1/3 rounded-sm"
                          style={{ backgroundColor: theme.colors.light.primary }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Theme Name */}
                <span className="text-xs font-medium text-center leading-tight">
                  {theme.label}
                </span>

                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
