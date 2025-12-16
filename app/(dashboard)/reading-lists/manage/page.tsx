import { redirect } from "next/navigation"

// Manage page is no longer needed - redirect to main reading lists page
// All editing features are now inline on the list detail pages
export default function ManageReadingListsPage() {
    redirect("/reading-lists")
}
