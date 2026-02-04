import { forwardRef, useState, useImperativeHandle, useRef } from 'react';
import { AgGridReact, AgGridReactProps } from 'ag-grid-react';
import { AgGridPagination } from './AgGridPagination';

interface AgGridWrapperProps<TData = any> extends AgGridReactProps<TData> {
  showCustomPagination?: boolean;
}

export const AgGridWrapper = forwardRef<AgGridReact, AgGridWrapperProps>((props, ref) => {
  const { showCustomPagination = true, ...agGridProps } = props;
  const gridRef = useRef<AgGridReact>(null);
  const [gridApi, setGridApi] = useState<any>(null);
  const [pageSize, setPageSize] = useState(100);

  // Forward ref to expose grid instance
  useImperativeHandle(ref, () => gridRef.current as AgGridReact, []);

  // Merge gridOptions with suppressPaginationPanel if custom pagination is enabled
  const mergedGridOptions = showCustomPagination
    ? {
        ...agGridProps,
        suppressPaginationPanel: true,
        paginationPageSize: pageSize,
        onGridReady: (params: any) => {
          setGridApi(params.api);
          agGridProps.onGridReady?.(params);
        },
      }
    : {
        ...agGridProps,
        onGridReady: (params: any) => {
          setGridApi(params.api);
          agGridProps.onGridReady?.(params);
        },
      };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <AgGridReact ref={gridRef} {...mergedGridOptions} />
      </div>
      {showCustomPagination && (
        <AgGridPagination
          api={gridApi}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
});

AgGridWrapper.displayName = 'AgGridWrapper';
