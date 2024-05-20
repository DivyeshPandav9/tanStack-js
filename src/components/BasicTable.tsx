import React, { useMemo, useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  SortingState,
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
  const [pageSize, setPageSize] = useState<number>(10); // Default page size to 10
  const [pageIndex, setPageIndex] = useState<number>(0); // Default page index to 0

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      pagination: {
        pageSize: pageSize,
        pageIndex: pageIndex,
      },
    },
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({ pageIndex, pageSize });
        setPageIndex(newState.pageIndex);
        setPageSize(newState.pageSize);
      } else {
        setPageIndex(updater.pageIndex);
        setPageSize(updater.pageSize);
      }
    },
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
        <button onClick={() => {
          table.setPageIndex(0);
          setPageIndex(0);
        }} disabled={!table.getCanPreviousPage()}>
          First page
        </button>
        <button onClick={() => {
          table.previousPage();
          setPageIndex(table.getState().pagination.pageIndex - 1);
        }} disabled={!table.getCanPreviousPage()}>
          Previous page
        </button>
        <button onClick={() => {
          table.nextPage();
          setPageIndex(table.getState().pagination.pageIndex + 1);
        }} disabled={!table.getCanNextPage()}>
          Next page
        </button>
        <button onClick={() => {
          const lastPage = table.getPageCount() - 1;
          table.setPageIndex(lastPage);
          setPageIndex(lastPage);
        }} disabled={!table.getCanNextPage()}>
          Last page
        </button>
        <span>
          Page{' '}
          <strong>
            {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </strong>{' '}
        </span>
        {/* <span>
          | Go to page:{' '}
          <input
            type="number"
            defaultValue={table.getState().pagination.pageIndex + 1}
            onChange={(e) => {
              const page = e.target.value ? Number(e.target.value) - 1 : 0;
              table.setPageIndex(page);
              setPageIndex(page);
            }}
            style={{ width: '50px' }}
          />
        </span> */}
        <select
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            const size = Number(e.target.value);
            setPageSize(size);
            table.setPageSize(size);
          }}
        >
          {[10, 20, 30, 40, 50].map((size) => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default BasicTable;
