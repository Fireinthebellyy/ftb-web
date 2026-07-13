import * as React from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";

export interface CohortPaymentConfirmationEmailProps {
  buyerName: string;
  buyerEmail: string;
  cohortTitle: string;
  cohortStartDate?: string;
  tierName?: string;
  addonNames?: string[];
  toolkitNames?: string[];
  amountPaidRupees: number;
  orderId: string;
  paymentId?: string;
  registrationUrl: string;
}

const CohortPaymentConfirmationEmail = (
  props: CohortPaymentConfirmationEmailProps
) => {
  const {
    buyerName,
    buyerEmail,
    cohortTitle,
    cohortStartDate,
    tierName,
    addonNames = [],
    toolkitNames = [],
    amountPaidRupees,
    orderId,
    paymentId,
    registrationUrl,
  } = props;

  const hasSelections =
    tierName || addonNames.length > 0 || toolkitNames.length > 0;

  const selectionText = tierName ? `Bundle offer: ${tierName}` : "Individual sessions";

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>Payment Successful! Welcome to FTB&apos;s Cohort: {cohortTitle}</Preview>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] p-[32px] max-w-[600px] mx-auto">
            <Section>
              <Text className="text-[24px] font-bold text-gray-900 mb-[16px] mt-0">
                Payment Confirmed.
              </Text>

              <Text className="text-[16px] text-gray-700 mb-[24px] mt-0 leading-[24px]">
                Hi {buyerName},<br /><br />
                Thank you for joining our cohort : <strong>{cohortTitle}</strong>. Your payment was successful, now you are OFFICIALLY our fam&lt;3! Now, let us brainwash you until you believe in your ambition while Sem-maxxxxing &amp; making a comeback.
              </Text>

              {hasSelections && (
                <Section className="bg-gray-50 rounded-[8px] p-[20px] mb-[24px]">
                  <Text className="text-[14px] font-semibold text-gray-900 mb-[12px] mt-0">
                    What you selected ({selectionText}): {cohortStartDate || "Dates TBD"}
                  </Text>
                </Section>
              )}

              <Section className="bg-gray-50 rounded-[8px] p-[20px] mb-[24px]">
                <Text className="text-[14px] font-semibold text-gray-900 mb-[12px] mt-0">
                  Payment details
                </Text>
                <Text className="text-[14px] text-gray-700 mb-[8px] mt-0 leading-[20px]">
                  Amount paid: ₹{amountPaidRupees.toLocaleString("en-IN")}
                </Text>
                <Text className="text-[14px] text-gray-700 mb-[8px] mt-0 leading-[20px]">
                  Order ID: {orderId}
                </Text>
                {paymentId && (
                  <Text className="text-[14px] text-gray-700 mb-[8px] mt-0 leading-[20px]">
                    Payment ID: {paymentId}
                  </Text>
                )}
                <Text className="text-[14px] text-gray-700 mb-[8px] mt-0 leading-[20px]">
                  Name: {buyerName}
                </Text>
                <Text className="text-[14px] text-gray-700 mb-0 mt-0 leading-[20px]">
                  Email: {buyerEmail}
                </Text>
              </Section>

              <Text className="text-[14px] text-gray-600 mb-[24px] mt-0 leading-[20px]">
                One last step: please complete your registration form so we can get you started with the cohort. Where you come from isn&apos;t the limit- it just helps us understand where you&apos;re starting from and how far we need to go together.
              </Text>

              <Section className="text-center mb-[32px]">
                <Button
                  href={registrationUrl}
                  className="bg-[#ff5e14] text-white px-[32px] py-[12px] rounded-[6px] text-[16px] font-medium no-underline box-border"
                >
                  Complete Registration Form
                </Button>
              </Section>

              <Text className="text-[14px] text-gray-600 mb-[24px] mt-0 leading-[20px]">
                We&apos;ll share cohort updates and next steps over email &amp; on platform. If you have any questions, just reply to this mail or reach out to us at fireinthebellyy@gmail.com.
              </Text>

              <Text className="text-[14px] text-gray-600 mb-[32px] mt-0 leading-[20px]">
                You&apos;ll be added to our WhatsApp community at least 24-36 hours before the cohort begins.
              </Text>

              <Text className="text-[16px] font-bold text-gray-900 mb-[32px] mt-0">
                LESSGOO!
              </Text>

              <Hr className="border-gray-200 my-[24px]" />

              <Text className="text-[12px] text-gray-500 m-0 leading-[16px]">
                Best,
                <br />
                Fire in the Belly Team
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default CohortPaymentConfirmationEmail;
