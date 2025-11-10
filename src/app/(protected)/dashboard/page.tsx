import React from 'react'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function DashboardPage() {

    return (
            <div className="p-6 sm:p-8 lg:p-10 w-full space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-primary">Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Overview of dormitory evaluations</p>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="w-full h-48 flex flex-col">
                    <CardHeader>
                        <CardTitle>Total Dormers</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-center">
                        <p className="text-3xl md:text-4xl font-bold text-primary">60</p>
                        <p className="text-sm text-muted-foreground">Dormers</p>
                    </CardContent>
                    <CardFooter>
                        <CardAction className="text-primary hover:underline">View Details</CardAction>
                    </CardFooter>
                </Card>

                <Card className="w-full h-48 flex flex-col">
                    <CardHeader>
                        <CardTitle>Dormers Evaluated</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-center">
                        <p className="text-3xl md:text-4xl font-bold text-primary">45</p>
                        <p className="text-sm text-muted-foreground">Dormers</p>
                    </CardContent>
                    <CardFooter>
                        <CardAction className="text-primary hover:underline">View Details</CardAction>
                    </CardFooter>
                </Card>

                <Card className="w-full h-48 flex flex-col">
                    <CardHeader>
                        <CardTitle>Pending Evaluations</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col justify-center">
                        <p className="text-3xl md:text-4xl font-bold text-primary">15</p>
                        <p className="text-sm text-muted-foreground">Dormers</p>
                    </CardContent>
                    <CardFooter>
                        <CardAction className="text-primary hover:underline">View Details</CardAction>
                    </CardFooter>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="w-full h-[22rem] flex flex-col">
                    <CardHeader>
                        <CardTitle>Recent Evaluations</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-auto">
                        <ul className="space-y-2">
                            <li className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">Dormer A</div>
                                    <div className="text-xs text-muted-foreground">Completed 2h ago</div>
                                </div>
                                <div className="text-sm text-muted-foreground">Score: 92</div>
                            </li>
                            <li className="flex items-center justify-between">
                                <div>
                                    <div className="font-medium">Dormer B</div>
                                    <div className="text-xs text-muted-foreground">Completed 1d ago</div>
                                </div>
                                <div className="text-sm text-muted-foreground">Score: 86</div>
                            </li>
                        </ul>
                    </CardContent>
                </Card>

                <Card className="w-full h-[22rem] flex flex-col">
                    <CardHeader>
                        <CardTitle>Evaluation Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex items-center justify-center">
                        <div className="text-muted-foreground">Table Placeholder</div>
                    </CardContent>
                    <CardFooter>
                        <CardAction className="text-primary">Export</CardAction>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
