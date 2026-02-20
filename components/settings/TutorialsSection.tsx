'use client';
import { Box, Card, CardContent, Typography, Stack } from '@mui/joy';
import {
  Rocket, Building2, Users, FileText, MessageCircle,
} from 'lucide-react';
import { TUTORIAL_STEPS } from '@/lib/docs';

const STEP_ICONS: Record<string, React.ElementType> = {
  welcome: Rocket, 'create-company': Building2, 'add-customer': Users,
  'create-invoice': FileText, 'try-ai': MessageCircle,
};

export default function TutorialsSection() {
  return (
    <Stack spacing={3}>
      {/* Getting Started */}
      <Card variant="outlined">
        <CardContent sx={{ p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 'md', bgcolor: 'primary.softBg',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Rocket size={16} style={{ color: 'var(--joy-palette-primary-500)' }} />
            </Box>
            <Typography level="title-md" fontWeight={700}>Getting Started</Typography>
          </Stack>
          <Typography level="body-sm" sx={{ color: 'text.secondary', mb: 2.5, pl: 6.5 }}>
            Complete these steps to set up your business.
          </Typography>

          <Stack spacing={1}>
            {TUTORIAL_STEPS.map((step, i) => {
              const Icon = STEP_ICONS[step.id] || Rocket;
              return (
                <Card key={step.id} variant="soft" sx={{ p: 0 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{
                        width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                        bgcolor: 'background.surface', border: '2px solid',
                        borderColor: 'primary.300', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Typography level="body-xs" fontWeight={700} sx={{ color: 'primary.600' }}>{i + 1}</Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography level="body-sm" fontWeight={600}>{step.title}</Typography>
                        <Typography level="body-xs" sx={{ color: 'text.secondary' }}>{step.description}</Typography>
                      </Box>
                      <Icon size={16} style={{ color: 'var(--joy-palette-neutral-400)', flexShrink: 0 }} />
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </CardContent>
      </Card>

      {/* Feature Guides */}
      <Box>
        <Typography level="title-md" fontWeight={700} sx={{ mb: 1.5 }}>Feature Guides</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          {[
            { title: 'Invoicing 101', desc: 'Create, send, and track invoices', icon: FileText, color: 'primary' },
            { title: 'AI Assistant', desc: 'Get insights from your financial data', icon: MessageCircle, color: 'success' },
            { title: 'Financial Reports', desc: 'P&L, Balance Sheet, Cash Flow', icon: Rocket, color: 'warning' },
          ].map(guide => {
            const GIcon = guide.icon;
            return (
              <Card key={guide.title} variant="outlined" sx={{
                flex: 1, transition: 'border-color 0.2s', '&:hover': { borderColor: `${guide.color}.300` },
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: 'md', bgcolor: `${guide.color}.softBg`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5,
                  }}>
                    <GIcon size={16} style={{ color: `var(--joy-palette-${guide.color}-500)` }} />
                  </Box>
                  <Typography level="title-sm" fontWeight={700}>{guide.title}</Typography>
                  <Typography level="body-xs" sx={{ color: 'text.secondary', mt: 0.5 }}>{guide.desc}</Typography>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      </Box>
    </Stack>
  );
}
