import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState
} from '@tanstack/react-table';
import mData from '../mock_data.json';
import { DateTime } from 'luxon';

interface Data {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  gender: string;
  dob: string;
}

const BasicTable: React.FC = () => {
  const data = useMemo(() => mData as Data[], []);

  const columns = useMemo<ColumnDef<Data>[]>(
    () => [
      {
        header: 'ID',
        accessorKey: 'id',
        footer: 'ID',
      },
      {
        header: 'Name',
        columns: [
          {
            header: 'First',
            accessorKey: 'first_name',
          },
          {
            header: 'Last',
            accessorKey: 'last_name',
          },
        ],
      },
      {
        header: 'Email',
        accessorKey: 'email',
      },
      {
        header: 'Gender',
        accessorKey: 'gender',
      },
      {
        header: 'Date of birth',
        accessorKey: 'dob',
        cell: (info) => DateTime.fromISO(info.getValue<string>()).toLocaleString(DateTime.DATE_MED),
      },
    ],
    []
  );

  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  return (
    <div className="w3-container">
      <table className="w3-table-all">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder ? null : (
                    <div>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: '🔼',
                        desc: '🔽',
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div>
        <button onClick={() => table.setPageIndex(0)}>First page</button>
        <button
          disabled={!table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          Previous page
        </button>
        <button
          disabled={!table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          Next page
        </button>
        <button onClick={() => table.setPageIndex(table.getPageCount() - 1)}>
          Last page
        </button>
      </div>
    </div>
  );
};

export default BasicTable;
