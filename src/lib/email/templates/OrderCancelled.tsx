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
import { emailFontFamily, StoreCta } from './_shared';

interface Props {
  locale: Locale;
  reference: string;
  customerName: string;
  reason?: string | null;
}

const COPY = {
  en: {
    title: 'Order Cancelled',
    greeting: (n: string) => `${n}, your order has been cancelled.`,
    referenceLabel: 'Order Reference',
    reasonLabel: 'Reason',
    note: 'Any authorised payment will be released back to your method. This can take a few business days.',
    footer: 'Questions? Reply to this email or contact support@orki.sa.',
  },
  ar: {
    title: 'تم إلغاء الطلب',
    greeting: (n: string) => `${n}، تم إلغاء طلبك.`,
    referenceLabel: 'رقم الطلب',
    reasonLabel: 'السبب',
    note: 'سيتم إرجاع أي مبلغ محجوز إلى وسيلة الدفع خلال أيام عمل قليلة.',
    footer: 'لأي استفسار، يمكنك الرد على هذا البريد أو التواصل مع support@orki.sa.',
  },
} as const;

export default function OrderCancelledEmail({
  locale,
  reference,
  customerName,
  reason,
}: Props) {
  const t = COPY[locale];
  const isRtl = locale === 'ar';
  return (
    <Html lang={locale} dir={isRtl ? 'rtl' : 'ltr'}>
      <Head />
      <Body
        style={{
          fontFamily: emailFontFamily(isRtl),
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
          {reason && (
            <Text>
              {t.reasonLabel}: <strong>{reason}</strong>
            </Text>
          )}
          <Hr style={{ borderColor: '#222' }} />
          <Text style={{ color: '#bbb' }}>{t.note}</Text>
          <StoreCta locale={locale} />
          <Hr style={{ borderColor: '#222' }} />
          <Text style={{ color: '#777', fontSize: 12 }}>{t.footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}
