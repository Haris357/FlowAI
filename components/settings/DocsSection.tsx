'use client';
import { useState } from 'react';
import {
  Box, Card, Typography, Stack, Chip, Accordion,
  AccordionSummary, AccordionDetails, AccordionGroup, List, ListItem,
} from '@mui/joy';
import {
  FileText, Rocket, Receipt, Landmark, DollarSign, BarChart3,
  MessageCircle, Settings, CreditCard, Building2, ChevronDown,
} from 'lucide-react';
import { DOC_CATEGORIES, DOC_ARTICLES } from '@/lib/docs';

const ICON_MAP: Record<string, React.ElementType> = {
  Rocket, FileText, Receipt, Landmark, DollarSign, BarChart3,
  MessageCircle, Settings, CreditCard, Building2,
};

export default function DocsSection() {
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);

  return (
    <Stack spacing={3}>
      {/* Category quick-nav */}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {DOC_CATEGORIES.map(cat => {
          const Icon = ICON_MAP[cat.icon] || FileText;
          return (
            <Chip key={cat.id} variant="soft" color="neutral" size="sm"
              startDecorator={<Icon size={12} />}
              onClick={() => document.getElementById(`doc-cat-${cat.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'primary.softBg' } }}>
              {cat.label}
            </Chip>
          );
        })}
      </Stack>

      {/* Articles by category */}
      {DOC_CATEGORIES.map(cat => {
        const articles = DOC_ARTICLES.filter(a => a.category === cat.id);
        if (articles.length === 0) return null;
        const CatIcon = ICON_MAP[cat.icon] || FileText;

        return (
          <Box key={cat.id} id={`doc-cat-${cat.id}`}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
              <Box sx={{
                width: 32, height: 32, borderRadius: 'md', bgcolor: 'primary.softBg',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CatIcon size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
              </Box>
              <Typography level="title-md" fontWeight={700}>{cat.label}</Typography>
            </Stack>

            <AccordionGroup sx={{ gap: 0.5 }}>
              {articles.map(article => (
                <Accordion key={article.id}
                  expanded={expandedArticle === article.id}
                  onChange={(_, expanded) => setExpandedArticle(expanded ? article.id : null)}
                  sx={{
                    border: '1px solid', borderColor: 'divider', borderRadius: 'sm',
                    '&:before': { display: 'none' },
                  }}>
                  <AccordionSummary indicator={<ChevronDown size={16} />} sx={{ px: 2, py: 1.5 }}>
                    <Box>
                      <Typography level="body-sm" fontWeight={600}>{article.title}</Typography>
                      <Typography level="body-xs" sx={{ color: 'text.secondary' }}>{article.description}</Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 2, pb: 2 }}>
                    {article.steps && (
                      <List marker="decimal" size="sm" sx={{ pl: 1 }}>
                        {article.steps.map((step, i) => (
                          <ListItem key={i} sx={{ py: 0.5 }}>
                            <Typography level="body-sm">{step}</Typography>
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </AccordionDetails>
                </Accordion>
              ))}
            </AccordionGroup>
          </Box>
        );
      })}
    </Stack>
  );
}
