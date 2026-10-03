import type { Metadata } from "next";
import { LegalDocument } from "@/features/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms for creating an account and using KujiLingo Japanese learning services.",
};

const supportEmail = "REPLACE_WITH_SUPPORT_EMAIL";

export default function TermsOfServicePage() {
  return (
    <LegalDocument
      title="Terms of Service"
      description="These terms apply when you access or use KujiLingo. By creating an account or using the service, you agree to them."
      sections={[
        {
          title: "Using KujiLingo",
          content: <p>KujiLingo provides Japanese language learning features, including lessons, vocabulary tools, progress tracking, achievements, and online activities. You must provide accurate account information, keep your sign-in credentials secure, and use the service in accordance with applicable laws.</p>,
        },
        {
          title: "Accounts",
          content: <p>You are responsible for activity on your account and for notifying us if you believe it has been accessed without permission. We may limit or suspend access when reasonably necessary to protect users, investigate abuse, maintain service security, or comply with law.</p>,
        },
        {
          title: "Acceptable use",
          content: <p>You may not disrupt or attack the service, bypass security or access controls, cheat or manipulate rankings, use another person’s account without permission, upload unlawful or harmful material, or use KujiLingo in a way that infringes another person’s rights. You may not copy, resell, or exploit the service except as permitted by law or with our written permission.</p>,
        },
        {
          title: "Learning content and intellectual property",
          content: <p>KujiLingo and its original content, software, branding, and design are owned by KujiLingo or its licensors and are protected by applicable intellectual property laws. We grant you a limited, personal, non-exclusive, revocable right to use the service for its intended learning purpose. Japanese language material and third-party resources may carry separate rights or attribution terms.</p>,
        },
        {
          title: "Purchases and virtual items",
          content: <p>Some features or virtual items may be offered for payment. The price, package, and applicable payment terms will be shown before you confirm a purchase. Payments may be processed by a third-party provider under that provider’s terms. Virtual items and balances are for use within KujiLingo, have no cash value, and may not be transferred or redeemed for money unless applicable law requires otherwise. Refunds are handled under applicable law and the terms presented at purchase.</p>,
        },
        {
          title: "Availability and changes",
          content: <p>We may update, suspend, or discontinue features to maintain or improve KujiLingo. We aim to keep the service available but do not promise uninterrupted access. We may revise these terms when needed; the current version and update date will be posted on this page. Continued use after an update means you accept the revised terms.</p>,
        },
        {
          title: "Termination",
          content: <p>You may stop using KujiLingo at any time. We may suspend or end access if you materially violate these terms or if needed to protect the service or comply with law. Account and personal information are handled according to our <a href="/privacy">Privacy Policy</a>.</p>,
        },
        {
          title: "Disclaimers and liability",
          content: <p>KujiLingo is provided for learning and informational purposes. To the extent permitted by law, the service is provided without warranties beyond those that cannot legally be excluded. Nothing in these terms limits rights or remedies that applicable law does not allow us to limit. To the extent permitted by law, KujiLingo is not liable for indirect or consequential losses arising from use of the service.</p>,
        },
        {
          title: "Contact",
          content: <p>For questions about these terms, contact <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>,
        },
      ]}
    />
  );
}
