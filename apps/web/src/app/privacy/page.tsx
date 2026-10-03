import type { Metadata } from "next";
import { LegalDocument } from "@/features/legal/LegalDocument";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn what information KujiLingo collects, how it is used, and how to make a privacy request.",
};

const supportEmail = "REPLACE_WITH_SUPPORT_EMAIL";

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      description="This policy explains how KujiLingo handles information when you use our Japanese learning website and services."
      sections={[
        {
          title: "Who we are and scope",
          content: <p>KujiLingo ("we", "us", or "our") provides online tools for studying Japanese, including lessons, vocabulary practice, learning progress, achievements, and multiplayer activities. This policy applies to the KujiLingo website and related services that link to it.</p>,
        },
        {
          title: "Information we collect",
          content: <>
            <p>Depending on how you use KujiLingo, we may collect:</p>
            <ul>
              <li><strong>Account information:</strong> email address, display name, profile image, account status, and authentication data. Passwords are stored as password hashes, not as readable passwords.</li>
              <li><strong>Learning and service activity:</strong> lessons completed, vocabulary and study progress, goals, streaks, achievements, game activity, and leaderboard or PvP results.</li>
              <li><strong>Transactions:</strong> purchase and payment status, package selected, amounts, and transaction references. Payments are handled by payment providers; KujiLingo does not need your full payment card number to provide the service.</li>
              <li><strong>Communications:</strong> information you include when you contact support and records needed to send account verification, password reset, and security emails.</li>
              <li><strong>Technical data:</strong> information your browser or device sends when connecting to the service, such as basic request and diagnostic data needed to operate, protect, and troubleshoot the website.</li>
            </ul>
          </>,
        },
        {
          title: "How we use information",
          content: <p>We use information to create and secure accounts, provide learning and multiplayer features, save progress, operate purchases and virtual items, send essential account emails, respond to support requests, prevent abuse, maintain the service, and meet legal obligations. We do not sell personal information.</p>,
        },
        {
          title: "Google API and Gmail data",
          content: <>
            <p>KujiLingo may connect an authorized service operator’s Google account to Gmail using the <code>gmail.send</code> permission. We use this permission only to send KujiLingo account and service emails, such as verification, password reset, and security notices.</p>
            <p>KujiLingo does not use this permission to read, search, or manage Gmail messages, contacts, or mailbox contents. Google user data obtained through the API is not sold, used for advertising, or shared with third parties except as needed to provide the email-sending function, comply with law, or protect the service. OAuth credentials are kept in restricted server-side configuration and are not exposed to website visitors.</p>
            <p>Our use and transfer of information received from Google APIs will comply with the Google API Services User Data Policy, including its Limited Use requirements.</p>
          </>,
        },
        {
          title: "When information is shared",
          content: <p>We share information only where needed to run KujiLingo: with our hosting and infrastructure providers (Vercel, Render, and Supabase), email delivery through Gmail, and payment providers such as PayOS when you make a purchase. These providers process information to provide their services to us. We may also disclose information when required by law, to protect users or the service, or as part of a business transfer. We do not allow service providers to use account information for their own advertising.</p>,
        },
        {
          title: "Cookies, storage, and security",
          content: <p>KujiLingo stores account state and authentication tokens in your browser's local storage so you can stay signed in. This storage is necessary for the web app to work. We apply reasonable technical and organizational safeguards, including access controls and protected authentication data. No internet service can guarantee absolute security, so please keep your credentials private and contact us if you suspect unauthorized access.</p>,
        },
        {
          title: "Retention and deletion requests",
          content: <p>We keep account and learning information while it is needed to provide the service. You may request access, correction, or deletion by emailing <a href={`mailto:${supportEmail}`}>{supportEmail}</a>. We will verify the request and respond within a reasonable period. Some transaction or security records may be retained where required by law or needed to resolve disputes and prevent fraud.</p>,
        },
        {
          title: "Your choices and rights",
          content: <p>You can update available profile details in your account settings, choose whether to continue using the service, and ask us to access, correct, or delete your personal information. You can revoke Google account access at any time from your Google Account permissions page. Revoking access prevents future Gmail sending through that connection.</p>,
        },
        {
          title: "Children and international processing",
          content: <p>KujiLingo is a general learning service and is not designed to knowingly collect personal information from children where parental consent is required. Our service providers may process information in countries other than yours, with safeguards appropriate to the service and applicable law.</p>,
        },
        {
          title: "Changes and contact",
          content: <p>We may update this policy as KujiLingo changes. We will publish the current version on this page and update the date above. For privacy questions or requests, contact <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>,
        },
      ]}
    />
  );
}
