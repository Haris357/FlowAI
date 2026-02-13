'use client';
import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Table,
  Sheet,
  Divider,
} from '@mui/joy';

interface CashFlowData {
  operating: {
    inflows: { [source: string]: number };
    outflows: { [source: string]: number };
    totalInflows: number;
    totalOutflows: number;
    net: number;
  };
  investing: {
    inflows: { [source: string]: number };
    outflows: { [source: string]: number };
    totalInflows: number;
    totalOutflows: number;
    net: number;
  };
  financing: {
    inflows: { [source: string]: number };
    outflows: { [source: string]: number };
    totalInflows: number;
    totalOutflows: number;
    net: number;
  };
  openingBalance: number;
  closingBalance: number;
  netChange: number;
  startDate: Date;
  endDate: Date;
}

interface CashFlowProps {
  data: CashFlowData;
  currency: string;
}

export function CashFlow({ data, currency }: CashFlowProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const renderFlowSection = (
    title: string,
    section: {
      inflows: { [source: string]: number };
      outflows: { [source: string]: number };
      totalInflows: number;
      totalOutflows: number;
      net: number;
    },
    color: string
  ) => (
    <Box>
      <Typography level="title-lg" sx={{ mb: 2, color }}>
        {title}
      </Typography>
      <Sheet sx={{ overflow: 'auto' }}>
        <Table size="sm">
          <tbody>
            {/* Inflows */}
            {Object.keys(section.inflows).length > 0 && (
              <>
                <tr>
                  <td colSpan={2}>
                    <Typography level="body-sm" fontWeight="bold" sx={{ color: 'success.600' }}>
                      Cash Inflows
                    </Typography>
                  </td>
                </tr>
                {Object.entries(section.inflows).map(([source, amount]) => (
                  <tr key={source}>
                    <td style={{ paddingLeft: 24 }}>
                      <Typography level="body-sm">{source}</Typography>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Typography level="body-sm" sx={{ color: 'success.600' }}>
                        {formatCurrency(amount)}
                      </Typography>
                    </td>
                  </tr>
                ))}
              </>
            )}

            {/* Outflows */}
            {Object.keys(section.outflows).length > 0 && (
              <>
                <tr>
                  <td colSpan={2}>
                    <Typography level="body-sm" fontWeight="bold" sx={{ color: 'danger.600' }}>
                      Cash Outflows
                    </Typography>
                  </td>
                </tr>
                {Object.entries(section.outflows).map(([source, amount]) => (
                  <tr key={source}>
                    <td style={{ paddingLeft: 24 }}>
                      <Typography level="body-sm">{source}</Typography>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Typography level="body-sm" sx={{ color: 'danger.600' }}>
                        ({formatCurrency(amount)})
                      </Typography>
                    </td>
                  </tr>
                ))}
              </>
            )}

            {/* Net */}
            <tr>
              <td>
                <Typography level="body-sm" fontWeight="bold">
                  Net Cash from {title}
                </Typography>
              </td>
              <td style={{ textAlign: 'right' }}>
                <Typography
                  level="body-sm"
                  fontWeight="bold"
                  sx={{ color: section.net >= 0 ? 'success.600' : 'danger.600' }}
                >
                  {formatCurrency(section.net)}
                </Typography>
              </td>
            </tr>
          </tbody>
        </Table>
      </Sheet>
    </Box>
  );

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          {/* Opening Balance */}
          <Box sx={{ p: 2, bgcolor: 'neutral.softBg', borderRadius: 'md' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography level="body-md">Opening Cash Balance</Typography>
              <Typography level="title-md" fontWeight="bold">
                {formatCurrency(data.openingBalance)}
              </Typography>
            </Stack>
          </Box>

          <Divider />

          {/* Operating Activities */}
          {renderFlowSection('Operating Activities', data.operating, 'primary.600')}

          <Divider />

          {/* Investing Activities */}
          {renderFlowSection('Investing Activities', data.investing, 'warning.600')}

          <Divider />

          {/* Financing Activities */}
          {renderFlowSection('Financing Activities', data.financing, 'neutral.600')}

          <Divider />

          {/* Net Change in Cash */}
          <Box sx={{
            p: 2,
            bgcolor: data.netChange >= 0 ? 'success.softBg' : 'danger.softBg',
            borderRadius: 'md'
          }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography level="body-md">Net Change in Cash</Typography>
              <Typography
                level="title-md"
                fontWeight="bold"
                sx={{ color: data.netChange >= 0 ? 'success.700' : 'danger.700' }}
              >
                {formatCurrency(data.netChange)}
              </Typography>
            </Stack>
          </Box>

          {/* Closing Balance */}
          <Box sx={{ p: 2, bgcolor: 'primary.softBg', borderRadius: 'md' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography level="title-lg">Closing Cash Balance</Typography>
              <Typography level="h4" fontWeight="bold" sx={{ color: 'primary.700' }}>
                {formatCurrency(data.closingBalance)}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
