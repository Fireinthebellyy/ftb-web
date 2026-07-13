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
  cohortTitle: string;
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
    cohortTitle,
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

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>Your registration for {cohortTitle} is confirmed</Preview>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] p-[32px] max-w-[600px] mx-auto">
            <Section>
              <Text className="text-[24px] font-bold text-gray-900 mb-[16px] mt-0">
                Payment Confirmed
              </Text>

              <Text className="text-[16px] text-gray-700 mb-[24px] mt-0 leading-[24px]">
                Hi {buyerName}, thank you for registering for{" "}
                <strong>{cohortTitle}</strong>. Your payment was successful.
              </Text>

              {hasSelections && (
                <Section className="bg-gray-50 rounded-[8px] p-[20px] mb-[24px]">
                  <Text className="text-[14px] font-semibold text-gray-900 mb-[12px] mt-0">
                    What you selected
                  </Text>

                  {tierName && (
                    <Text className="text-[14px] text-gray-700 mb-[8px] mt-0 leading-[20px]">
                      Bundle: {tierName}
                    </Text>
                  )}

                  {addonNames.map((name) => (
                    <Text
                      key={name}
                      className="text-[14px] text-gray-700 mb-[8px] mt-0 leading-[20px]"
                    >
                      Session: {name}
                    </Text>
                  ))}

                  {toolkitNames.map((name) => (
                    <Text
                      key={name}
                      className="text-[14px] text-gray-700 mb-[8px] mt-0 leading-[20px]"
                    >
                      Toolkit add-on: {name}
                    </Text>
                  ))}
                </Section>
              )}

              <Section className="bg-gray-50 rounded-[8px] p-[20px] mb-[24px]">
                <Text className="text-[14px] text-gray-700 mb-[8px] mt-0 leading-[20px]">
                  Amount paid: ₹{amountPaidRupees.toLocaleString("en-IN")}
                </Text>
                <Text className="text-[14px] text-gray-700 mb-[8px] mt-0 leading-[20px]">
                  Order ID: {orderId}
                </Text>
                {paymentId && (
                  <Text className="text-[14px] text-gray-700 mb-0 mt-0 leading-[20px]">
                    Payment ID: {paymentId}
                  </Text>
                )}
              </Section>

              <Text className="text-[14px] text-gray-600 mb-[24px] mt-0 leading-[20px]">
                One last step: please complete your registration form so we can
                get you started with the cohort.
              </Text>

              <Section className="text-center mb-[32px]">
                <Button
                  href={registrationUrl}
                  className="bg-[#ff5e14] text-white px-[32px] py-[12px] rounded-[6px] text-[16px] font-medium no-underline box-border"
                >
                  Complete Registration Form
                </Button>
              </Section>

              <Text className="text-[14px] text-gray-600 mb-[32px] mt-0 leading-[20px]">
                We will share cohort updates and next steps over email. If you
                have any questions, reply to this email or contact our support
                team.
              </Text>

              <Hr className="border-gray-200 my-[24px]" />

              <Text className="text-[12px] text-gray-500 m-0 leading-[16px]">
                Best regards,
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
