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

export default function DormersPage()
{
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
                    </DropdownMenuContent>
                </DropdownMenu>
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
            </div>
        </div>
        <div className="w-full">
            <DataTable columns={[]} data={[]} />
        </div>
    </div>
    );
}