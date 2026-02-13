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

interface BalanceSheetData {
  assets: {
    current: { [account: string]: number };
    fixed: { [account: string]: number };
    totalCurrent: number;
    totalFixed: number;
    total: number;
  };
  liabilities: {
    current: { [account: string]: number };
    longTerm: { [account: string]: number };
    totalCurrent: number;
    totalLongTerm: number;
    total: number;
  };
  equity: {
    accounts: { [account: string]: number };
    total: number;
  };
  asOfDate: Date;
}

interface BalanceSheetProps {
  data: BalanceSheetData;
  currency: string;
}

export function BalanceSheet({ data, currency }: BalanceSheetProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const renderSection = (
    title: string,
    items: { [key: string]: number },
    total: number,
    color: string
  ) => (
    <Box>
      <Typography level="title-md" sx={{ mb: 1, color }}>
        {title}
      </Typography>
      <Sheet sx={{ overflow: 'auto' }}>
        <Table size="sm">
          <tbody>
            {Object.entries(items).map(([account, amount]) => (
              <tr key={account}>
                <td style={{ paddingLeft: 16 }}>
                  <Typography level="body-sm">{account}</Typography>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Typography level="body-sm">
                    {formatCurrency(amount)}
                  </Typography>
                </td>
              </tr>
            ))}
            <tr>
              <td style={{ paddingLeft: 16 }}>
                <Typography level="body-sm" fontWeight="bold">
                  Total {title}
                </Typography>
              </td>
              <td style={{ textAlign: 'right' }}>
                <Typography level="body-sm" fontWeight="bold">
                  {formatCurrency(total)}
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
          {/* Assets */}
          <Box>
            <Typography level="title-lg" sx={{ mb: 2, color: 'primary.600' }}>
              Assets
            </Typography>
            <Stack spacing={2}>
              {renderSection('Current Assets', data.assets.current, data.assets.totalCurrent, 'primary.500')}
              {renderSection('Fixed Assets', data.assets.fixed, data.assets.totalFixed, 'primary.500')}
            </Stack>
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'primary.softBg', borderRadius: 'sm' }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography level="title-md" fontWeight="bold">Total Assets</Typography>
                <Typography level="title-md" fontWeight="bold" sx={{ color: 'primary.700' }}>
                  {formatCurrency(data.assets.total)}
                </Typography>
              </Stack>
            </Box>
          </Box>

          <Divider />

          {/* Liabilities */}
          <Box>
            <Typography level="title-lg" sx={{ mb: 2, color: 'danger.600' }}>
              Liabilities
            </Typography>
            <Stack spacing={2}>
              {renderSection('Current Liabilities', data.liabilities.current, data.liabilities.totalCurrent, 'danger.500')}
              {renderSection('Long-term Liabilities', data.liabilities.longTerm, data.liabilities.totalLongTerm, 'danger.500')}
            </Stack>
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'danger.softBg', borderRadius: 'sm' }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography level="title-md" fontWeight="bold">Total Liabilities</Typography>
                <Typography level="title-md" fontWeight="bold" sx={{ color: 'danger.700' }}>
                  {formatCurrency(data.liabilities.total)}
                </Typography>
              </Stack>
            </Box>
          </Box>

          <Divider />

          {/* Equity */}
          <Box>
            <Typography level="title-lg" sx={{ mb: 2, color: 'success.600' }}>
              Equity
            </Typography>
            {renderSection("Owner's Equity", data.equity.accounts, data.equity.total, 'success.500')}
            <Box sx={{ mt: 2, p: 1.5, bgcolor: 'success.softBg', borderRadius: 'sm' }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography level="title-md" fontWeight="bold">Total Equity</Typography>
                <Typography level="title-md" fontWeight="bold" sx={{ color: 'success.700' }}>
                  {formatCurrency(data.equity.total)}
                </Typography>
              </Stack>
            </Box>
          </Box>

          <Divider />

          {/* Total Liabilities + Equity */}
          <Box sx={{ p: 2, bgcolor: 'neutral.softBg', borderRadius: 'md' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography level="title-lg">Total Liabilities + Equity</Typography>
              <Typography level="h4" fontWeight="bold">
                {formatCurrency(data.liabilities.total + data.equity.total)}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
