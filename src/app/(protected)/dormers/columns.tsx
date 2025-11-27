"use client"

import { ColumnDef, Row } from "@tanstack/react-table"
import { Dormer } from "@/types"
import { Button } from "@/components/ui/button"
import { ArrowUpDown, MoreHorizontal, Edit, Delete} from "lucide-react"
import React from "react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel} from "@/components/ui/dropdown-menu"
import { DormerEditInfo } from "./components/dormer-edit-info"
import { DormerDelete } from "./components/dormer-delete"

const ActionsCell: React.FC<{ dormer: Dormer }> = ({ dormer }) => {
  const [openEdit, setOpenEdit] = React.useState(false)
  const [openDelete, setOpenDelete] = React.useState(false)

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
          <DropdownMenuItem onSelect={() => setOpenEdit(true)}>
            <Edit className="ml-2 h-4 w-4 text-primary" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setOpenDelete(true)}>
            <Delete className="ml-2 h-4 w-4 text-red-500" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DormerEditInfo dormer={dormer} open={openEdit} onOpenChange={setOpenEdit} onSuccess={() => setOpenEdit(false)} />
      <DormerDelete dormer={dormer} open={openDelete} onOpenChange={setOpenDelete} onSuccess={() => setOpenDelete(false)} />
    </>
  )
}

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
    cell: ({ row }: { row: Row<Dormer> }) => {
      return <div className="max-w-[200px] truncate">{row.getValue("email")}</div>
    },
  },
  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }: { row: Row<Dormer> }) => <ActionsCell dormer={row.original} />,
  }
]