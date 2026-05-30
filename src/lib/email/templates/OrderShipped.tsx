import 'server-only';
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Hr,
} from '@react-email/components';
import type { Locale } from '@/types/domain';

interface Props {
  locale: Locale;
  reference: string;
  customerName: string;
  trackingNumber: string | null;
}

const COPY = {
  en: {
    title: 'Order Shipped',
    greeting: (n: string) => `Good news, ${n} — your order is on the way.`,
    referenceLabel: 'Order Reference',
    trackingLabel: 'Tracking',
    footer: 'Questions? Reply to this email or contact support@orki.sa.',
  },
  ar: {
    title: 'تم شحن الطلب',
    greeting: (n: string) => `أخبار سارة يا ${n} — طلبك في الطريق إليك.`,
    referenceLabel: 'رقم الطلب',
    trackingLabel: 'رقم التتبع',
    footer: 'لأي استفسار، يمكنك الرد على هذا البريد أو التواصل مع support@orki.sa.',
  },
} as const;

export default function OrderShippedEmail({
  locale,
  reference,
  customerName,
  trackingNumber,
}: Props) {
  const t = COPY[locale];
  const isRtl = locale === 'ar';
  return (
    <Html lang={locale} dir={isRtl ? 'rtl' : 'ltr'}>
      <Head />
      <Body
        style={{
          fontFamily: isRtl
            ? '"IBM Plex Sans Arabic", sans-serif'
            : '"Space Grotesk", sans-serif',
          backgroundColor: '#000',
          color: '#fff',
          margin: 0,
          padding: '24px',
        }}
      >
        <Container style={{ maxWidth: 560, margin: '0 auto' }}>
          <Heading
            style={{
              color: '#fff',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {t.title}
          </Heading>
          <Text>{t.greeting(customerName)}</Text>
          <Text>
            {t.referenceLabel}: <strong>{reference}</strong>
          </Text>
          {trackingNumber && (
            <Text>
              {t.trackingLabel}: <strong>{trackingNumber}</strong>
            </Text>
          )}
          <Hr style={{ borderColor: '#222' }} />
          <Text style={{ color: '#777', fontSize: 12 }}>{t.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}
