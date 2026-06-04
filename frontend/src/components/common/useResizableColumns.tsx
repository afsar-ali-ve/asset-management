import { useEffect, useRef, useState } from 'react';

const MIN_COLUMN_WIDTH = 120;

const useResizableColumns = (initialWidths) => {
  const [columnWidths, setColumnWidths] = useState(initialWidths);
  const resizeStateRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (event) => {
      const resizeState = resizeStateRef.current;
      if (!resizeState) return;

      const nextWidth = Math.max(MIN_COLUMN_WIDTH, resizeState.startWidth + event.clientX - resizeState.startX);
      setColumnWidths((prev) => ({
        ...prev,
        [resizeState.field]: nextWidth,
      }));
    };

    const handleMouseUp = () => {
      if (!resizeStateRef.current) return;

      resizeStateRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  const startColumnResize = (field, event) => {
    event.preventDefault();
    event.stopPropagation();

    const headerCell = event.currentTarget.closest('th');
    resizeStateRef.current = {
      field,
      startX: event.clientX,
      startWidth: columnWidths[field] || headerCell?.getBoundingClientRect().width || MIN_COLUMN_WIDTH,
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const getColumnStyle = (field) => ({
    width: columnWidths[field],
    minWidth: columnWidths[field],
  });

  const renderResizeHandle = (field) => (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize column"
      onMouseDown={(event) => startColumnResize(field, event)}
      className="group absolute right-0 top-0 flex h-full w-3 cursor-col-resize touch-none select-none items-center justify-center"
    >
      <span className="h-5 w-px rounded-full bg-slate-300 transition-colors group-hover:bg-blue-500" />
    </span>
  );

  return {
    getColumnStyle,
    renderResizeHandle,
  };
};

export default useResizableColumns;
