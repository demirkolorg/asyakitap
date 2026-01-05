"use client"

import { ActivityType } from "@prisma/client"
import { useTimer } from "@/contexts/timer-context"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    BookOpen,
    GraduationCap,
    Search,
    Edit3,
    Headphones,
    Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"

const activityOptions: { value: ActivityType; label: string; icon: React.ReactNode }[] = [
    { value: "READING", label: "Okuma", icon: <BookOpen className="h-4 w-4" /> },
    { value: "STUDYING", label: "Çalışma", icon: <GraduationCap className="h-4 w-4" /> },
    { value: "RESEARCH", label: "Araştırma", icon: <Search className="h-4 w-4" /> },
    { value: "NOTE_TAKING", label: "Not Alma", icon: <Edit3 className="h-4 w-4" /> },
    { value: "LISTENING", label: "Dinleme", icon: <Headphones className="h-4 w-4" /> },
    { value: "OTHER", label: "Diğer", icon: <Clock className="h-4 w-4" /> },
]

interface ActivitySelectorProps {
    disabled?: boolean
    size?: "sm" | "default"
    className?: string
}

export function ActivitySelector({ disabled, size = "default", className }: ActivitySelectorProps) {
    const { state, setActivityType } = useTimer()

    const selectedOption = activityOptions.find(o => o.value === state.activityType)

    return (
        <Select
            value={state.activityType}
            onValueChange={(value) => setActivityType(value as ActivityType)}
            disabled={disabled || state.isRunning}
        >
            <SelectTrigger className={cn(size === "sm" && "h-8 text-xs", className)}>
                <SelectValue>
                    <div className="flex items-center gap-2">
                        {selectedOption?.icon}
                        <span>{selectedOption?.label}</span>
                    </div>
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {activityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                            {option.icon}
                            <span>{option.label}</span>
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )
}

// Aktivite tipi badge'i
export function ActivityBadge({ type, className }: { type: ActivityType; className?: string }) {
    const option = activityOptions.find(o => o.value === type)

    if (!option) return null

    return (
        <div className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
            "bg-muted text-muted-foreground",
            className
        )}>
            {option.icon}
            <span>{option.label}</span>
        </div>
    )
}

// Aktivite ikonu
export function ActivityIcon({ type, className }: { type: ActivityType; className?: string }) {
    const icons: Record<ActivityType, React.ReactNode> = {
        READING: <BookOpen className={cn("h-4 w-4", className)} />,
        STUDYING: <GraduationCap className={cn("h-4 w-4", className)} />,
        RESEARCH: <Search className={cn("h-4 w-4", className)} />,
        NOTE_TAKING: <Edit3 className={cn("h-4 w-4", className)} />,
        LISTENING: <Headphones className={cn("h-4 w-4", className)} />,
        OTHER: <Clock className={cn("h-4 w-4", className)} />,
    }

    return icons[type] || icons.OTHER
}
