'use client';

import React from 'react';
import { Breadcrumbs, Link, Typography, Box } from '@mui/joy';
import { useCompany } from '@/contexts/CompanyContext';
import { useParams } from 'next/navigation';
import { ChevronRight, Building2 } from 'lucide-react';
import NextLink from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface PageBreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function PageBreadcrumbs({ items }: PageBreadcrumbsProps) {
  const { company } = useCompany();
  const params = useParams();
  const companyId = params?.companyId as string | undefined;

  return (
    <Breadcrumbs
      separator={<ChevronRight size={14} />}
      sx={{
        px: 0,
        fontSize: 'sm',
        '--Breadcrumbs-gap': '4px',
      }}
    >
      {/* Company name - only show if in company context */}
      {companyId && (
        <Link
          component={NextLink}
          href={`/companies/${companyId}/dashboard`}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: 'text.secondary',
            textDecoration: 'none',
            '&:hover': {
              color: 'primary.500',
              textDecoration: 'none',
            },
          }}
        >
          <Building2 size={14} />
          <Typography level="body-sm" sx={{ color: 'inherit' }}>
            {company?.name || 'Company'}
          </Typography>
        </Link>
      )}

      {/* Dynamic breadcrumb items */}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (isLast) {
          return (
            <Box
              key={item.label}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              {item.icon}
              <Typography level="body-sm" fontWeight={500} sx={{ color: 'text.primary' }}>
                {item.label}
              </Typography>
            </Box>
          );
        }

        return (
          <Link
            key={item.label}
            component={NextLink}
            href={item.href || '#'}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: 'text.secondary',
              textDecoration: 'none',
              '&:hover': {
                color: 'primary.500',
                textDecoration: 'none',
              },
            }}
          >
            {item.icon}
            <Typography level="body-sm" sx={{ color: 'inherit' }}>
              {item.label}
            </Typography>
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
