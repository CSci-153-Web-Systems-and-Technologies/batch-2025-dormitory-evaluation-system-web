"use client"
import React from "react";
import { DataTable } from "./data-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dormer } from "@/types";
import { createClient } from "@/lib/supabase/client"
import { columns } from "./columns";
import { DormerAddForm } from "./components/dormer-add-form";
export default function DormersPage() {
    const supabase = React.useMemo(() => createClient(), [])
    const [dormersAll, setDormersAll] = React.useState<Dormer[]>([])
    const [dormers, setDormers] = React.useState<Dormer[]>([])
    const [loading, setLoading] = React.useState(false)
    const [selectedRoom, setSelectedRoom] = React.useState<string | null>(null)
    const [searchTerm, setSearchTerm] = React.useState("")
    const [debouncedSearch, setDebouncedSearch] = React.useState("")

    const rooms = React.useMemo(() => {
        return Array.from(
            new Set(dormersAll.map((d) => d.room).filter((r): r is string => !!r))
        ).sort()
    }, [dormersAll])

    const fetchDormers = React.useCallback(async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase.from("dormers").select("*")
            if (error) {
                console.error("Error fetching dormers:", error)
                setDormersAll([])
            } else {
                const all = (data ?? []) as Dormer[]
                setDormersAll(all)
            }
        } catch (error) {
            console.error("Unexpected error fetching dormers:", error)
            setDormersAll([])
        } finally {
            setLoading(false)
        }
    }, [supabase])

    React.useEffect(() => {
        fetchDormers()
    }, [fetchDormers])

    const displayedDormers = React.useMemo(() => {
        if (!selectedRoom) return dormersAll
        return dormersAll.filter((d) => d.room === selectedRoom)
    }, [dormersAll, selectedRoom])

    React.useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(searchTerm.trim().toLowerCase()), 300)
        return () => clearTimeout(t)
    }, [searchTerm])

    const finalDormers = React.useMemo(() => {
        if (!debouncedSearch) return displayedDormers
        return displayedDormers.filter((d) => {
            const fullName = `${d.first_name ?? ""} ${d.last_name ?? ""}`.toLowerCase()
            const email = (d.email ?? "").toLowerCase()
            const room = (d.room ?? "").toLowerCase()
            return (
                fullName.includes(debouncedSearch) ||
                email.includes(debouncedSearch) ||
                room.includes(debouncedSearch)
            )
        })
    }, [displayedDormers, debouncedSearch])

    React.useEffect(() => {
        setDormers(finalDormers)
    }, [finalDormers])

    return (
    <div className="p-6 sm:p-8 lg:p-10 w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-primary">Dormers</h1>
                <p className="text-sm text-muted-foreground">List of dormitory residents</p>
            </div>
        </div>
        <div className="flex flex-row justify-between gap-2">
            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search dormers..." className="max-w-sm" />
            <div className="grid grid-cols-2 gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            className="flex items-center gap-1 justify-center"
                            aria-label="Room Number"
                        >
                            <span className="hidden sm:inline text-xs sm:text-base">
                                Room No.
                            </span>
                            <svg
                                className="h-4 w-4"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuLabel>Room No.</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup>
                            {rooms.map((room) => (
                                <DropdownMenuRadioItem key={room} value={room} onSelect={() => setSelectedRoom(room)}>
                                    {room}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
                <DormerAddForm onSuccess={fetchDormers} trigger={
                <Button className="w-full sm:w-auto flex items-center justify-center gap-1">
                    <span className="block sm:hidden">
                        <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                    </span>
                    <span className="hidden sm:block">Add Dormer</span>
                </Button>
                }/>
            </div>
        </div>
        <div className="w-full">
            <div className="flex items-center justify-between mb-2">
                <div className="text-sm text-muted-foreground">{loading ? "Loading..." : `${dormers.length} dormers`}</div>
                <div>
                    <Button onClick={fetchDormers} variant="ghost" className="text-sm">
                        Refresh
                    </Button>
                </div>
            </div>
            <DataTable columns={columns} data={dormers} />
        </div>
    </div>
    );
}