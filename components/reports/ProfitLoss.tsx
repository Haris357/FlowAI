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

interface ProfitLossData {
  income: { [category: string]: number };
  expenses: { [category: string]: number };
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  startDate: Date;
  endDate: Date;
}

interface ProfitLossProps {
  data: ProfitLossData;
  currency: string;
}

export function ProfitLoss({ data, currency }: ProfitLossProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          {/* Income Section */}
          <Box>
            <Typography level="title-lg" sx={{ mb: 2, color: 'success.600' }}>
              Income
            </Typography>
            <Sheet sx={{ overflow: 'auto' }}>
              <Table>
                <tbody>
                  {Object.entries(data.income).map(([category, amount]) => (
                    <tr key={category}>
                      <td>
                        <Typography level="body-sm">{category}</Typography>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Typography level="body-sm">
                          {formatCurrency(amount)}
                        </Typography>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <Typography level="body-sm" fontWeight="bold">
                        Total Income
                      </Typography>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Typography level="body-sm" fontWeight="bold" sx={{ color: 'success.600' }}>
                        {formatCurrency(data.totalIncome)}
                      </Typography>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Sheet>
          </Box>

          <Divider />

          {/* Expenses Section */}
          <Box>
            <Typography level="title-lg" sx={{ mb: 2, color: 'danger.600' }}>
              Expenses
            </Typography>
            <Sheet sx={{ overflow: 'auto' }}>
              <Table>
                <tbody>
                  {Object.entries(data.expenses).map(([category, amount]) => (
                    <tr key={category}>
                      <td>
                        <Typography level="body-sm">{category}</Typography>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Typography level="body-sm">
                          {formatCurrency(amount)}
                        </Typography>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td>
                      <Typography level="body-sm" fontWeight="bold">
                        Total Expenses
                      </Typography>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Typography level="body-sm" fontWeight="bold" sx={{ color: 'danger.600' }}>
                        {formatCurrency(data.totalExpenses)}
                      </Typography>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Sheet>
          </Box>

          <Divider />

          {/* Net Profit */}
          <Box sx={{
            p: 2,
            borderRadius: 'md',
            bgcolor: data.netProfit >= 0 ? 'success.softBg' : 'danger.softBg'
          }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography level="title-lg">
                Net {data.netProfit >= 0 ? 'Profit' : 'Loss'}
              </Typography>
              <Typography
                level="h3"
                fontWeight="bold"
                sx={{ color: data.netProfit >= 0 ? 'success.700' : 'danger.700' }}
              >
                {formatCurrency(Math.abs(data.netProfit))}
              </Typography>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
