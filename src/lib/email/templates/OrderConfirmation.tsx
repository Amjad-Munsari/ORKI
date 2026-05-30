import 'server-only';
import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Hr,
  Section,
} from '@react-email/components';
import type { Locale } from '@/types/domain';

interface Props {
  locale: Locale;
  reference: string;
  customerName: string;
  items: Array<{ name: string; qty: number; lineTotal: string }>;
  totalFormatted: string;
}

const COPY = {
  en: {
    title: 'Order Confirmed',
    greeting: (n: string) => `Thanks for your order, ${n}.`,
    referenceLabel: 'Order Reference',
    totalLabel: 'Total',
    footer: 'Questions? Reply to this email or contact support@orki.sa.',
  },
  ar: {
    title: 'تم تأكيد طلبك',
    greeting: (n: string) => `شكراً لطلبك يا ${n}.`,
    referenceLabel: 'رقم الطلب',
    totalLabel: 'الإجمالي',
    footer: 'لأي استفسار، يمكنك الرد على هذا البريد أو التواصل مع support@orki.sa.',
  },
} as const;

const bodyStyle = (isRtl: boolean) => ({
  fontFamily: isRtl
    ? '"IBM Plex Sans Arabic", sans-serif'
    : '"Space Grotesk", sans-serif',
  backgroundColor: '#000',
  color: '#fff',
  margin: 0,
  padding: '24px',
});

export default function OrderConfirmationEmail({
  locale,
  reference,
  customerName,
  items,
  totalFormatted,
}: Props) {
  const t = COPY[locale];
  const isRtl = locale === 'ar';
  return (
    <Html lang={locale} dir={isRtl ? 'rtl' : 'ltr'}>
      <Head />
      <Body style={bodyStyle(isRtl)}>
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
          <Hr style={{ borderColor: '#222' }} />
          <Section>
            {items.map((i, idx) => (
              <Text key={idx} style={{ color: '#bbb', margin: '4px 0' }}>
                {i.qty} × {i.name} — {i.lineTotal}
              </Text>
            ))}
          </Section>
          <Hr style={{ borderColor: '#222' }} />
          <Text>
            {t.totalLabel}: <strong>{totalFormatted}</strong>
          </Text>
          <Hr style={{ borderColor: '#222' }} />
          <Text style={{ color: '#777', fontSize: 12 }}>{t.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}
