import { useState } from "react";
import {
  FaStepBackward,
  FaStepForward,
  FaChevronLeft,
  FaChevronRight,
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
import jsPDF from 'jspdf';
import 'jspdf-autotable';


declare module 'jspdf' {
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
    return doc.output('blob');
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
    <div className="w3-container">
      <p>Click headers for sorting values</p>

      <div style={{ display: "flex", marginBlock: "20px" }}>
        <select
          className="w3-select w3-border"
          style={{ width: "30%", marginRight: "10px" }}
          value={filterColumn}
          onChange={(e) => setFilterColumn(e.target.value)}
        >
          {columns.map((column) => (
            <option key={column.accessorKey as string} value={column.accessorKey as string}>
              {column.header as string}
            </option>
          ))}
        </select>

        <input
          placeholder="Search here..."
          className="w3-input w3-border"
          style={{ width: "70%" }}
          type="text"
          value={
            (columnFilters.find((filter) => filter.id === filterColumn)?.value as string | readonly string[] | number | undefined) ?? ""
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

      <table className="w3-table-all w3-hoverable">
        {/* Table header */}
        <thead className="w3-light-grey">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  onClick={header.column.getToggleSortingHandler()}
                  className="w3-hoverable"
                >
                  {!header.isPlaceholder && (
                    <div>
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
              <td colSpan={columns.length}>
                {columnFilters.length > 0 ? "No data found" : "Loading..."}
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="w3-bar w3-center">
        <button
          onClick={() => {
            table.setPageIndex(0);
            setPageIndex(0);
          }}
          className="w3-button"
          disabled={!table.getCanPreviousPage()}
        >
          <FaStepBackward />
        </button>
        {/* Previous page button */}
        <button
          onClick={() => {
            table.previousPage();
            setPageIndex(table.getState().pagination.pageIndex - 1);
          }}
          className="w3-button"
          disabled={!table.getCanPreviousPage()}
        >
          <FaChevronLeft />
        </button>
        {/* Next page button */}
        <button
          onClick={() => {
            table.nextPage();
            setPageIndex(table.getState().pagination.pageIndex + 1);
          }}
          className="w3-button"
          disabled={!table.getCanNextPage()}
        >
          <FaChevronRight />
        </button>
        {/* Last page button */}
        <button
          onClick={() => {
            const lastPage = table.getPageCount() - 1;
            table.setPageIndex(lastPage);
            setPageIndex(lastPage);
          }}
          className="w3-button"
          disabled={!table.getCanNextPage()}
        >
          <FaStepForward />
        </button>
        {/* Page info */}
        <span className="w3-margin-left">
          Page{" "}
          <strong>
            {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </strong>{" "}
        </span>
        {/* Page size dropdown */}
        <select
          className="w3-select w3-border w3-margin-left"
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
      <div className="w3-margin-top">
        <select
          className="w3-select w3-border w3-margin-right"
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
          className="w3-button w3-blue"
          onClick={() => downloadFile(selectedFormat)}
        >
          Download
        </button>
      </div>
    </div>
  ); 
};

export default BasicTable;



