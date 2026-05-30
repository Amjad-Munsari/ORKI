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
  totalFormatted?: string;
}

const COPY = {
  en: {
    title: 'Order Refunded',
    greeting: (n: string) => `${n}, your refund has been processed.`,
    referenceLabel: 'Order Reference',
    amountLabel: 'Refunded',
    note: 'Refunds typically settle to your original payment method within a few business days.',
    footer: 'Questions? Reply to this email or contact support@orki.sa.',
  },
  ar: {
    title: 'تم استرداد المبلغ',
    greeting: (n: string) => `${n}، تمت معالجة استرداد مبلغك.`,
    referenceLabel: 'رقم الطلب',
    amountLabel: 'المبلغ المسترد',
    note: 'عادةً ما يصل المبلغ المسترد إلى وسيلة الدفع الأصلية خلال أيام عمل قليلة.',
    footer: 'لأي استفسار، يمكنك الرد على هذا البريد أو التواصل مع support@orki.sa.',
  },
} as const;

export default function OrderRefundedEmail({
  locale,
  reference,
  customerName,
  totalFormatted,
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
          {totalFormatted && (
            <Text>
              {t.amountLabel}: <strong>{totalFormatted}</strong>
            </Text>
          )}
          <Hr style={{ borderColor: '#222' }} />
          <Text style={{ color: '#bbb' }}>{t.note}</Text>
          <Hr style={{ borderColor: '#222' }} />
          <Text style={{ color: '#777', fontSize: 12 }}>{t.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}
