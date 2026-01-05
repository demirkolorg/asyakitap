import { ActivityType } from "@prisma/client"

export function getActivityTypeLabel(type: ActivityType): string {
    const labels: Record<ActivityType, string> = {
        READING: "Okuma",
        STUDYING: "Çalışma",
        RESEARCH: "Araştırma",
        NOTE_TAKING: "Not Alma",
        LISTENING: "Dinleme",
        OTHER: "Diğer",
    }
    return labels[type]
}

export function getActivityTypeIcon(type: ActivityType): string {
    const icons: Record<ActivityType, string> = {
        READING: "BookOpen",
        STUDYING: "GraduationCap",
        RESEARCH: "Search",
        NOTE_TAKING: "Edit3",
        LISTENING: "Headphones",
        OTHER: "Clock",
    }
    return icons[type]
}

export function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
        return `${hours}s ${minutes}dk`
    }
    return `${minutes}dk`
}

export function formatDurationLong(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0 && minutes > 0) {
        return `${hours} saat ${minutes} dakika`
    } else if (hours > 0) {
        return `${hours} saat`
    }
    return `${minutes} dakika`
}
