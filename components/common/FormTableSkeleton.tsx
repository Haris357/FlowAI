'use client';

import { Sheet, Table, Skeleton, Box } from '@mui/joy';

interface FormTableSkeletonProps {
  columns: number;
  rows?: number;
}

// Predefined width patterns for natural-looking skeleton rows
const COLUMN_WIDTHS = ['60%', '75%', '50%', '65%', '45%', '70%', '55%', '40%', '80%'];

export default function FormTableSkeleton({ columns, rows = 8 }: FormTableSkeletonProps) {
  return (
    <Sheet sx={{ overflow: 'auto' }}>
      <Table
        sx={{
          '--TableCell-headBackground': 'var(--joy-palette-background-level1)',
          '& thead th': {
            borderBottom: '2px solid',
            borderColor: 'divider',
          },
          '& tbody tr:last-child td': {
            borderBottom: 'none',
          },
        }}
      >
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i}>
                <Skeleton variant="text" width={COLUMN_WIDTHS[i % COLUMN_WIDTHS.length]} sx={{ maxWidth: 100 }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx}>
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={colIdx}>
                  <Skeleton
                    variant="rectangular"
                    width={COLUMN_WIDTHS[(colIdx + rowIdx) % COLUMN_WIDTHS.length]}
                    height={20}
                    sx={{ borderRadius: 'xs', maxWidth: colIdx === columns - 1 ? 36 : 120 }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
    </Sheet>
  );
}
