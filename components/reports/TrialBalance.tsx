'use client';
import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Stack,
  Table,
  Sheet,
  Box,
  Chip,
} from '@mui/joy';

interface TrialBalanceEntry {
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
}

interface TrialBalanceData {
  entries: TrialBalanceEntry[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  asOfDate: Date;
}

interface TrialBalanceProps {
  data: TrialBalanceData;
  currency: string;
}

export function TrialBalance({ data, currency }: TrialBalanceProps) {
  const formatCurrency = (amount: number) => {
    if (amount === 0) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  const getAccountTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'asset':
        return 'primary';
      case 'liability':
        return 'danger';
      case 'equity':
        return 'success';
      case 'income':
      case 'revenue':
        return 'success';
      case 'expense':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          {/* Balance Status */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Chip
              size="lg"
              variant="soft"
              color={data.isBalanced ? 'success' : 'danger'}
            >
              {data.isBalanced ? 'Balanced' : 'Unbalanced'}
            </Chip>
          </Box>

          {/* Trial Balance Table */}
          <Sheet sx={{ overflow: 'auto' }}>
            <Table stickyHeader>
              <thead>
                <tr>
                  <th style={{ width: 100 }}>Code</th>
                  <th>Account Name</th>
                  <th style={{ width: 100 }}>Type</th>
                  <th style={{ width: 150, textAlign: 'right' }}>Debit</th>
                  <th style={{ width: 150, textAlign: 'right' }}>Credit</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map((entry, index) => (
                  <tr key={index}>
                    <td>
                      <Typography level="body-sm" fontFamily="monospace">
                        {entry.accountCode}
                      </Typography>
                    </td>
                    <td>
                      <Typography level="body-sm">
                        {entry.accountName}
                      </Typography>
                    </td>
                    <td>
                      <Chip
                        size="sm"
                        variant="soft"
                        color={getAccountTypeColor(entry.accountType)}
                      >
                        {entry.accountType}
                      </Chip>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Typography level="body-sm">
                        {formatCurrency(entry.debit)}
                      </Typography>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Typography level="body-sm">
                        {formatCurrency(entry.credit)}
                      </Typography>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3}>
                    <Typography level="body-sm" fontWeight="bold">
                      Total
                    </Typography>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Typography
                      level="body-sm"
                      fontWeight="bold"
                      sx={{ color: 'primary.600' }}
                    >
                      {formatCurrency(data.totalDebits)}
                    </Typography>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Typography
                      level="body-sm"
                      fontWeight="bold"
                      sx={{ color: 'primary.600' }}
                    >
                      {formatCurrency(data.totalCredits)}
                    </Typography>
                  </td>
                </tr>
              </tfoot>
            </Table>
          </Sheet>

          {/* Difference (if unbalanced) */}
          {!data.isBalanced && (
            <Box sx={{ p: 2, bgcolor: 'danger.softBg', borderRadius: 'md' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography level="body-md" sx={{ color: 'danger.700' }}>
                  Difference
                </Typography>
                <Typography level="title-md" fontWeight="bold" sx={{ color: 'danger.700' }}>
                  {formatCurrency(Math.abs(data.totalDebits - data.totalCredits))}
                </Typography>
              </Stack>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
