import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnResizeMode,
  type VisibilityState
} from '@tanstack/react-table'

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[]
  data: TData[]
  className?: string
}

export function DataTable<TData>({
  columns,
  data,
  className
}: DataTableProps<TData>) {
  const [columnResizeMode] = React.useState<ColumnResizeMode>('onChange')
  const [columnVisibility] = React.useState<VisibilityState>({})

  const table = useReactTable({
    data,
    columns,
    state: {
      columnVisibility,
    },
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode,
  })

  return (
    <div className={`rounded-lg border border-gray-700 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th 
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-medium text-gray-100"
                    style={{ width: header.getSize() }}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-gray-700">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-gray-800/50">
                {row.getVisibleCells().map(cell => (
                  <td 
                    key={cell.id} 
                    className="px-4 py-3 text-sm text-gray-300"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
