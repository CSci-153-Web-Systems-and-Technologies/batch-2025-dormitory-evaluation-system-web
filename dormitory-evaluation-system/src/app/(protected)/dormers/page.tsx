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
    const [dormers, setDormers] = React.useState<Dormer[]>([])
    const [rooms, setRooms] = React.useState<string[]>([])
    const [loading, setLoading] = React.useState(false)

    const fetchRooms = React.useCallback(async () => {
        try {
            const { data, error } = await supabase.from("dormers").select("room")
            if (error) {
                console.error("Error fetching rooms:", error)
                setRooms([])
            } else {
                const roomList = Array.from(
                    new Set(
                        (data ?? [])
                            .map((item) => item.room)
                            .filter((room): room is string => !!room)
                    )
                ).sort()
                setRooms(roomList)
            }
        } catch (error) {
            console.error("Unexpected error fetching rooms:", error)
            setRooms([])
        }
    }, [supabase])

    React.useEffect(() => {
        fetchRooms()
    }, [fetchRooms])

    const fetchDormers = React.useCallback(async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase.from("dormers").select("*")
            if (error) {
                console.error("Error fetching dormers:", error)
                setDormers([])
            } else {
                setDormers((data ?? []) as Dormer[])
            }
        } catch (error) {
            console.error("Unexpected error fetching dormers:", error)
            setDormers([])
        } finally {
            setLoading(false)
        }
    }, [supabase])

    React.useEffect(() => {
        fetchDormers()
    }, [fetchDormers])

    return (
    <div className="p-6 sm:p-8 lg:p-10 w-full space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-primary">Dormers</h1>
                <p className="text-sm text-muted-foreground">List of dormitory residents</p>
            </div>
        </div>
        <div className="flex flex-row justify-between gap-2">
            <Input placeholder="Search dormers..." className="max-w-sm" />
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
                                <DropdownMenuRadioItem key={room} value={room}>
                                    {room}
                                </DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
                <DormerAddForm trigger={
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