import {
  Alert,
  Button,
  Center,
  Container,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconCheck, IconUser } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import useSWR from 'swr';

import { getBaseApiUrl } from '@services/adapter';
import { registerForTournament } from '@services/tournament';
import axios from 'axios';
import dayjs from 'dayjs';

const publicFetcher = (url: string) =>
  axios.get(`${getBaseApiUrl()}/${url}`).then((res) => res.data);

export default function RegisterPage() {
  const { tournament_id } = useParams<{ tournament_id: string }>();
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { data: tournamentResponse, isLoading } = useSWR(
    tournament_id ? `tournaments/${tournament_id}` : null,
    publicFetcher
  );

  const tournament = tournamentResponse?.data ?? null;

  const form = useForm({
    initialValues: { name: '' },
    validate: {
      name: (value) =>
        value.trim().length === 0
          ? t('registration_name_required')
          : value.trim().length > 30
            ? t('registration_name_too_long')
            : null,
    },
  });

  if (isLoading) {
    return (
      <Container size="xs" mt="xl">
        <Center>
          <Text>{t('loading')}</Text>
        </Center>
      </Container>
    );
  }

  if (!tournament) {
    return (
      <Container size="xs" mt="xl">
        <Alert color="red" icon={<IconAlertCircle />}>
          {t('registration_tournament_not_found')}
        </Alert>
      </Container>
    );
  }

  if (!tournament.registration_enabled) {
    return (
      <Container size="xs" mt="xl">
        <Alert color="orange" icon={<IconAlertCircle />}>
          {t('registration_not_open')}
        </Alert>
      </Container>
    );
  }

  if (submitted) {
    return (
      <Container size="xs" mt="xl">
        <Paper shadow="md" p="xl" radius="md" withBorder>
          <Stack align="center" gap="md">
            <IconCheck size={64} color="green" />
            <Title order={2}>{t('registration_success_title')}</Title>
            <Text ta="center">{t('registration_success_description', { name: form.values.name, tournament: tournament.name })}</Text>
          </Stack>
        </Paper>
      </Container>
    );
  }

  return (
    <Container size="xs" mt="xl">
      <Paper shadow="md" p="xl" radius="md" withBorder>
        <Stack gap="md">
          <Title order={2}>{t('registration_page_title')}</Title>
          <Text fw={500} fz="lg">{tournament.name}</Text>
          <Text c="dimmed" fz="sm">
            {t('registration_tournament_starts')}{' '}
            {dayjs(tournament.start_time).format('D MMMM YYYY, HH:mm')}
          </Text>

          {errorMessage && (
            <Alert color="red" icon={<IconAlertCircle />} onClose={() => setErrorMessage(null)} withCloseButton>
              {errorMessage}
            </Alert>
          )}

          <form
            onSubmit={form.onSubmit(async (values) => {
              setErrorMessage(null);
              try {
                await registerForTournament(Number(tournament_id), values.name.trim());
                setSubmitted(true);
              } catch (err: any) {
                const detail =
                  err?.response?.data?.detail ?? t('registration_error_generic');
                setErrorMessage(detail);
              }
            })}
          >
            <Stack gap="md">
              <TextInput
                label={t('registration_name_label')}
                placeholder={t('registration_name_placeholder')}
                leftSection={<IconUser size="1rem" />}
                {...form.getInputProps('name')}
              />
              <Button type="submit" fullWidth size="md" color="green">
                {t('registration_submit_button')}
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Container>
  );
}
