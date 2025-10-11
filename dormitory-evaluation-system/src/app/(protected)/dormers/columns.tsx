"use client"

import { ColumnDef } from "@tanstack/react-table"
import {Dormer} from "@/types"


export const columns: ColumnDef<Dormer>[] = [
  { accessorKey: "full_name", header: "Full Name" },
  { accessorKey: "room", header: "Room" },
  { accessorKey: "course_year", header: "Course and Year Level" },
  { accessorKey: "email", header: "Email" },
]