import React, { useMemo } from "react";
import "./App.css";
import BasicTable from "./components/BasicTable";
import { ColumnDef, CellContext } from "@tanstack/react-table";
import mData from "./movie_data1.json";

interface Data {
  id: number;
  movie_name: string;
  movie_type: string;
  earning: number;
  directer_name: string;
}

const App: React.FC = () => {
  const data = useMemo(() => mData as unknown as Data[], []);

  const earningCellRenderer = ({ getValue }: CellContext<Data, number>) => {
    return <span style={{ color: "green" }}>{getValue()}</span>;
  };

  const columns = useMemo<ColumnDef<Data>[]>(
    () => [
      {
        header: "ID",
        accessorKey: "id",
      },
      {
        header: "Movies Name",
        accessorKey: "movie_name",
      },
      {
        header: "Movies Type",
        accessorKey: "movie_type",
      },
      {
        header: "Earning",
        accessorKey: "earning",
        cell: earningCellRenderer,
      },
      {
        header: "Director Name",
        accessorKey: "directer_name",
      },
    ],
    []
  );

  return (
    <div>
      <h1 className="text-center text-3xl font-bold underline mb-4">
        Hello TanStack
      </h1>
      <BasicTable data={data} columns={columns} />
    </div>
  );
};

export default App;
