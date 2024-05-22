import { useState } from "react";
import {
  FaStepBackward,
  FaStepForward,

} from "react-icons/fa";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnDef,
  ColumnFiltersState,
} from "@tanstack/react-table";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

declare module "jspdf" {
  interface jsPDF {
    autoTable: (config: any) => jsPDF;
  }
}
interface BasicTableProps<Data> {
  data: Data[];
  columns: ColumnDef<Data>[];
}

const BasicTable = <Data,>({ data, columns }: BasicTableProps<Data>) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pageSize, setPageSize] = useState<number>(10);
  const [pageIndex, setPageIndex] = useState<number>(0);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [filterColumn, setFilterColumn] = useState<string>(
    columns[0].accessorKey as string
  );
  const [selectedFormat, setSelectedFormat] = useState<string>("csv");

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
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newState = updater({ pageIndex, pageSize });
        setPageIndex(newState.pageIndex);
        setPageSize(newState.pageSize);
      } else {
        setPageIndex(updater.pageIndex);
        setPageSize(updater.pageSize);
      }
    },
    getFilteredRowModel: getFilteredRowModel(),
    // columnFilters,
  });

  const downloadFile = async (format: string) => {
    if (format === "csv") {
      const csvContent = await convertToCSV(data, columns);
      downloadBlob(csvContent, "text/csv", "table_data.csv");
    } else if (format === "xlsx") {
      const xlsxBlob = await convertToXLSX(data, columns);
      downloadBlob(xlsxBlob, "application/octet-stream", "table_data.xlsx");
    } else if (format === "json") {
      const jsonContent = JSON.stringify(data, null, 2);
      downloadBlob(jsonContent, "application/json", "table_data.json");
    } else if (format === "pdf") {
      const pdfContent = await convertToPDF(data, columns);
      downloadBlob(pdfContent, "application/pdf", "table_data.pdf");
    }
  };

  const downloadBlob = (
    content: string | Blob,
    mimeType: string,
    fileName: string
  ) => {
    const blob =
      typeof content === "string"
        ? new Blob([content], { type: mimeType })
        : content;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  const convertToPDF = async (data: Data[], columns: ColumnDef<Data>[]) => {
    const doc = new jsPDF();
    const headers = columns.map((col) => col.header as string);
    const rows = data.map((row) =>
      columns.map((col) => {
        const accessorKey = col.accessorKey as keyof Data;
        return row[accessorKey] || "";
      })
    );
    doc.autoTable({
      head: [headers],
      body: rows,
    });
    return doc.output("blob");
  };

  const convertToCSV = async (data: Data[], columns: ColumnDef<Data>[]) => {
    const headers = columns.map((col) => col.header as string);
    const rows = data.map((row) =>
      columns.map((col) => {
        const accessorKey = col.accessorKey as keyof Data;
        return row[accessorKey] || "";
      })
    );
    const csvContent = [headers, ...rows].map((e) => e.join(",")).join("\n");
    return csvContent;
  };

  const convertToXLSX = async (data: Data[], columns: ColumnDef<Data>[]) => {
    const headers = columns.map((col) => col.header as string);
    const jsonArray = data.map((row) =>
      columns.reduce((acc, column) => {
        const accessorKey = column.accessorKey as keyof Data;
        acc[column.header as string] = row[accessorKey] || "";
        return acc;
      }, {} as { [key: string]: any })
    );

    const worksheet = XLSX.utils.json_to_sheet(jsonArray);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    return blob;
  };



  return (



    <div className="container mx-auto">
      <p className="mb-4">Click headers for sorting values</p>

      <div className="flex items-center mb-4">
        <select
          className="border w-1/3 mr-2 p-2"
          value={filterColumn}
          onChange={(e) => setFilterColumn(e.target.value)}
        >
          {columns.map((column) => (
            <option
              key={column.accessorKey as string}
              value={column.accessorKey as string}
            >
              {column.header as string}
            </option>
          ))}
        </select>

        <input
          placeholder="Search here..."
          className="border w-2/3 p-2"
          type="text"
          value={
            (columnFilters.find((filter) => filter.id === filterColumn)
              ?.value as string | readonly string[] | number | undefined) ?? ""
          }
          onChange={(e) =>
            setColumnFilters((filters) => {
              const newFilters = filters.filter((f) => f.id !== filterColumn);
              if (e.target.value) {
                newFilters.push({ id: filterColumn, value: e.target.value });
              }
              return newFilters;
            })
          }
        />
      </div>

      <table className="w-full border-collapse">
      {/* Table header */}
      <thead className="bg-gray-200">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <th
                key={header.id}
                onClick={header.column.getToggleSortingHandler()}
                className="cursor-pointer p-2"
              >
                {!header.isPlaceholder && (
                  <div className="flex items-center justify-between">
                    {typeof header.column.columnDef.header === "function"
                      ? flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      : header.column.columnDef.header}
                    {header.column.getIsSorted() ? (
                      header.column.getIsSorted() === "desc" ? (
                        "🔽"
                      ) : (
                        "🔼"
                      )
                    ) : (
                      // Default sorting icon here
                      <span>⇅</span>
                    )}
                  </div>
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>

      {/* Table body */}
      <tbody>
        {table.getRowModel().rows.length === 0 ? (
          <tr>
            <td colSpan={columns.length} className="p-2">
              {table.getState().columnFilters.length > 0 ? "No data found" : "Loading..."}
            </td>
          </tr>
        ) : (
          table.getRowModel().rows.map((row, index) => (
            <tr
              key={row.id}
              className={
                index % 2 === 0
                  ? "bg-gray-100 hover:bg-gray-200"
                  : "hover:bg-gray-200"
              }
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border p-2">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>

      {/* Pagination */}
      <div className="flex justify-center items-center my-4">
        <button
          onClick={() => {
            table.setPageIndex(0);
            setPageIndex(0);
          }}
          className="btn mr-2"
          disabled={!table.getCanPreviousPage()}
        >
          <FaStepBackward
            className={
              table.getCanPreviousPage() ? "text-black" : "text-gray-400"
            }
          />
        </button>
        {/* Previous page button */}
        <button
          onClick={() => {
            table.previousPage();
            setPageIndex(table.getState().pagination.pageIndex - 1);
          }}
          className="btn mr-2"
          disabled={!table.getCanPreviousPage()}
        >
          {/* <FaChevronLeft
            className={
              table.getCanPreviousPage() ? "text-black" : "text-gray-400"
            }
          /> */}
          <div style={{ border: "1px solid black", padding: "5px",color:'gray'}}>
            {table.getState().pagination.pageIndex}
          </div>
        </button>
        {/* Next page button */}
        <button
          onClick={() => {
            table.nextPage();
            setPageIndex(table.getState().pagination.pageIndex + 1);
          }}
          className="btn mr-2"
          disabled={!table.getCanNextPage()}
        >
          {/* <FaChevronRight
            className={table.getCanNextPage() ? "text-black" : "text-gray-400"}
          /> */}
          <div style={{ border: "1px solid black" ,padding:'5px'}}>
            {table.getState().pagination.pageIndex + 1}
          </div>
        </button>
        {/* Last page button */}
        <button
          onClick={() => {
            const lastPage = table.getPageCount() - 1;
            table.setPageIndex(lastPage);
            setPageIndex(lastPage);
          }}
          className="btn mr-2"
          disabled={!table.getCanNextPage()}
        >
          <FaStepForward
            className={table.getCanNextPage() ? "text-black" : "text-gray-400"}
          />
        </button>
        {/* Page info */}
        <span className="mr-2">
          Page{" "}
          <strong>
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </strong>{" "}
        </span>
        {/* Page size dropdown */}
        <select
          className="border p-2"
          style={{ width: "auto" }}
          value={table.getState().pagination.pageSize}
          onChange={(e) => {
            const size = Number(e.target.value);
            setPageSize(size);
            table.setPageSize(size);
          }}
        >
          {[10, 20, 30, 40, 50, 100].map((size) => (
            <option key={size} value={size}>
              Show {size}
            </option>
          ))}
        </select>
      </div>

      {/* Download dropdown */}
      <div className="mb-4 flex">
        <select
          className="border mr-4 border-gray-300 bg-white text-gray-700 py-2 px-4 pr-8 rounded leading-tight focus:outline-none focus:border-blue-500 focus:bg-white focus:text-gray-900"
          style={{ width: "auto" }}
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value)}
        >
          <option value="csv">CSV</option>
          <option value="xlsx">XLSX</option>
          <option value="json">JSON</option>
          <option value="pdf">PDF</option>
        </select>
        <button
          className="bg-blue-400 text-white font-bold py-2 px-4 rounded hover:bg-blue-700 hover:text-white focus:outline-none"
          onClick={() => downloadFile(selectedFormat)}
        >
          Download
        </button>
      </div>
    </div>
  );
};

export default BasicTable;
