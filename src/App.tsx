import React, { useMemo } from 'react';
import './App.css';
import BasicTable from './components/BasicTable';
import { ColumnDef } from '@tanstack/react-table';
import mData from './movie_data1.json'

interface Data {
  id: number;
  movie_name: string;
  movie_type: string;
  earning: number;
  directer_name: string;
  accessorKey: string;
}

const App: React.FC = () => {
  const data = useMemo(() => mData as unknown as Data[], []);

  const columns = useMemo<ColumnDef<Data>[]>(
    () => [
      {
        header: "ID",
        accessorKey: "id",
      },
      {
        header: "Movies Name",
        accessorKey: 'movie_name',
      },
      {
        header: "Movies Type",
        accessorKey: "movie_type",
      },
      {
        header: "Earning",
        accessorKey: "earning",
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
      <h1 style={{textAlign:'center',textDecoration:'underline'}}>Hello tanStack</h1>
      <BasicTable data={data} columns={columns}/>
    </div>
  );
};

export default App;
