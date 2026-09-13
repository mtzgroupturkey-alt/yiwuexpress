'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowRightLeft,
  Truck,
  RefreshCw,
  Loader2,
  CheckCircle,
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function StockTransfersPage() {
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ['admin-stock-transfers'],
    queryFn: async () => {
      const res = await fetch('/api/admin/stock-transfers')
      if (!res.ok) throw new Error('Failed to fetch transfers')
      return res.json()
    },
  })

  const dispatchMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/stock-transfers/${id}/dispatch`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to dispatch transfer')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stock-transfers'] })
      toast.success('Transfer dispatched (stock deducted from source warehouse)')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const receiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/stock-transfers/${id}/receive`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to receive transfer')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stock-transfers'] })
      toast.success('Transfer received into destination warehouse stock')
    },
    onError: (err: any) => toast.error(err.message),
  })

  const transfers = data?.data || []

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2 text-foreground">
            <ArrowRightLeft className="w-7 h-7 text-indigo-600" />
            Inter-Warehouse Stock Transfers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dispatch and receive inventory balance movements between warehouses with full ledger audit.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="h-9 gap-1.5">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transfer #</TableHead>
                <TableHead>Source Warehouse</TableHead>
                <TableHead>Destination Warehouse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600" />
                  </TableCell>
                </TableRow>
              ) : transfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                    No inter-warehouse stock transfers found.
                  </TableCell>
                </TableRow>
              ) : (
                transfers.map((tr) => (
                  <TableRow key={tr.id}>
                    <TableCell className="font-mono font-bold text-xs">{tr.transferNumber}</TableCell>
                    <TableCell className="text-xs">
                      <span className="font-semibold text-foreground">{tr.sourceWarehouse?.code}</span>
                      <span className="text-muted-foreground block text-[11px]">{tr.sourceWarehouse?.name}</span>
                    </TableCell>
                    <TableCell className="text-xs">
                      <span className="font-semibold text-foreground">{tr.destinationWarehouse?.code}</span>
                      <span className="text-muted-foreground block text-[11px]">{tr.destinationWarehouse?.name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[11px]">
                        {tr.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-mono">{tr.items?.length || 0} items</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(tr.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {tr.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          onClick={() => dispatchMutation.mutate(tr.id)}
                          disabled={dispatchMutation.isPending}
                          className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white gap-1"
                        >
                          <Truck className="w-3 h-3" />
                          Dispatch
                        </Button>
                      )}
                      {tr.status === 'IN_TRANSIT' && (
                        <Button
                          size="sm"
                          onClick={() => receiveMutation.mutate(tr.id)}
                          disabled={receiveMutation.isPending}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                        >
                          <CheckCircle className="w-3 h-3" />
                          Receive
                        </Button>
                      )}
                      {tr.status === 'COMPLETED' && (
                        <span className="text-xs text-emerald-600 font-semibold">Completed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
