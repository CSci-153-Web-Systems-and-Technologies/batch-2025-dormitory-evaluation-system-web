"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Dormer } from "@/types"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal, Edit, Delete} from "lucide-react"
import React from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel} from "@/components/ui/dropdown-menu"
import { DormerEditInfo } from "./components/dormer-edit-info"


export const columns: ColumnDef<Dormer>[] = [
  {
    accessorKey: "first_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          First Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    }
  },
  {
    accessorKey: "last_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Last Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    }
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => row.getValue("email"),
  },
  {
    accessorKey: "room",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Room
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => row.getValue("room"),
  },
  {
    accessorKey: "course_year",
    header: "Course & Year Level",
    cell: ({ row }) => row.getValue("course_year"),
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const [open, setOpen] = React.useState(false)
      return (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setOpen(true)}>
                <Edit className="ml-2 h-4 w-4 text-primary" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Delete className="ml-2 h-4 w-4 text-red-500" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DormerEditInfo dormer={row.original} open={open} onOpenChange={setOpen} onSuccess={() => setOpen(false)} />
        </>
      )
    },
  }
]