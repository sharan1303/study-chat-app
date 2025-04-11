import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ui/theme-toggle";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function PrivacyPolicy() {
  return (
    <div className="h-full flex flex-col py-3">
      {/* Top navigation bar */}
      <div className="flex justify-between items-center mt-0.5 ml-5 pr-6">
        <Button
          variant="ghost"
          size="sm" asChild
          className="flex addmarginforheaders items-center">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Chat
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    <div className="h-[calc(100vh-1px)] overflow-y-auto pb-8">
      <div className="max-w-4xl mx-auto p-6 mt-10">
        <div className="text-foreground/90">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-4">
              PRIVACY NOTICE
            </h1>
          </div>

          <div>
            <p className="text-muted-foreground font-medium text-sm">
              Last updated April 05, 2025
            </p>
          </div>

          <div className="space-y-4 mt-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              This Privacy Notice for Study Chat (&quot;we&quot;,
              &quot;us&quot;, or &quot;our&quot;), describes how and why we
              might access, collect, store, use, and/or share
              (&quot;process&quot;) your personal information when you use our
              services (&quot;Services&quot;), including when you:
            </p>

            <ul className="list-disc pl-10 text-sm text-muted-foreground space-y-2">
              <li>
                Visit our website at{" "}
                <a
                  href="https://mystudy.chat"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  mystudy.chat
                </a>
                , or any website of ours that links to this Privacy Notice
              </li>
              <li>
                Use Study Chat. An AI Chat app developed for students to bring
                AI into their learning routine
              </li>
              <li>
                Engage with us in other related ways, including any sales,
                marketing, or events
              </li>
            </ul>

            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>Questions or concerns?</strong> Reading this Privacy
              Notice will help you understand your privacy rights and choices.
              We are responsible for making decisions about how your personal
              information is processed. If you do not agree with our policies
              and practices, please do not use our Services.
            </p>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight mb-4">
              SUMMARY OF KEY POINTS
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>
                <em>
                  This summary provides key points from our Privacy Notice, but
                  you can find out more details about any of these topics by
                  clicking the link following each key point or by using our{" "}
                </em>
              </strong>
              <a href="#toc" className="text-primary hover:underline">
                <strong>
                  <em>table of contents</em>
                </strong>
              </a>
              <strong>
                <em> below to find the section you are looking for.</em>
              </strong>
            </p>

            <div className="space-y-4 mt-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>What personal information do we process?</strong> When
                you visit, use, or navigate our Services, we may process
                personal information depending on how you interact with us and
                the Services, the choices you make, and the products and
                features you use. Learn more about
                <a
                  href="#personalinfo"
                  className="text-primary hover:underline"
                >
                  {" "}
                  personal information you disclose to us
                </a>
                .
              </p>

              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>
                  Do we process any sensitive personal information?
                </strong>{" "}
                Some of the information may be considered &quot;special&quot; or
                &quot;sensitive&quot; in certain jurisdictions, for example your
                racial or ethnic origins, sexual orientation, and religious
                beliefs. We do not process sensitive personal information.
              </p>

              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>
                  Do we collect any information from third parties?
                </strong>{" "}
                We do not collect any information from third parties.
              </p>

              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>How do we process your information?</strong> We process
                your information to provide, improve, and administer our
                Services, communicate with you, for security and fraud
                prevention, and to comply with law. We may also process your
                information for other purposes with your consent. We process
                your information only when we have a valid legal reason to do
                so. Learn more about
                <a href="#infouse" className="text-primary hover:underline">
                  {" "}
                  how we process your information
                </a>
                .
              </p>
            </div>
          </div>

          <div id="toc" className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight mb-4">
              TABLE OF CONTENTS
            </h2>
            <ul className="list-disc pl-10 text-sm text-primary space-y-2">
              <li>
                <a href="#infocollect" className="hover:underline">
                  1. WHAT INFORMATION DO WE COLLECT?
                </a>
              </li>
              <li>
                <a href="#infouse" className="hover:underline">
                  2. HOW DO WE PROCESS YOUR INFORMATION?
                </a>
              </li>
              <li>
                <a href="#legalbases" className="hover:underline">
                  3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL
                  INFORMATION?
                </a>
              </li>
              <li>
                <a href="#whoshare" className="hover:underline">
                  4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?
                </a>
              </li>
              <li>
                <a href="#cookies" className="hover:underline">
                  5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?
                </a>
              </li>
              <li>
                <a href="#ai" className="hover:underline">
                  6. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?
                </a>
              </li>
              <li>
                <a href="#sociallogins" className="hover:underline">
                  7. HOW DO WE HANDLE YOUR SOCIAL LOGINS?
                </a>
              </li>
              <li>
                <a href="#intltransfers" className="hover:underline">
                  8. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?
                </a>
              </li>
              <li>
                <a href="#inforetain" className="hover:underline">
                  9. HOW LONG DO WE KEEP YOUR INFORMATION?
                </a>
              </li>
              <li>
                <a href="#infosafe" className="hover:underline">
                  10. HOW DO WE KEEP YOUR INFORMATION SAFE?
                </a>
              </li>
              <li>
                <a href="#infominors" className="hover:underline">
                  11. DO WE COLLECT INFORMATION FROM MINORS?
                </a>
              </li>
              <li>
                <a href="#privacyrights" className="hover:underline">
                  12. WHAT ARE YOUR PRIVACY RIGHTS?
                </a>
              </li>
              <li>
                <a href="#DNT" className="hover:underline">
                  13. CONTROLS FOR DO-NOT-TRACK FEATURES
                </a>
              </li>
              <li>
                <a href="#policyupdates" className="hover:underline">
                  14. DO WE MAKE UPDATES TO THIS NOTICE?
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:underline">
                  15. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?
                </a>
              </li>
              <li>
                <a href="#request" className="hover:underline">
                  16. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT
                  FROM YOU?
                </a>
              </li>
            </ul>
          </div>

          <div id="infocollect" className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight mb-4">
              1. WHAT INFORMATION DO WE COLLECT?
            </h2>

            <h3
              className="text-lg font-medium tracking-tight mb-2"
              id="personalinfo"
            >
              Personal information you disclose to us
            </h3>

            <p className="text-sm text-muted-foreground leading-relaxed italic mb-4">
              <strong>In Short:</strong>{" "}
              <em>We collect personal information that you provide to us.</em>
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed">
              We collect personal information that you voluntarily provide to us
              when you register on the Services, express an interest in
              obtaining information about us or our products and Services, when
              you participate in activities on the Services, or otherwise when
              you contact us.
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              <strong>Personal Information Provided by You.</strong> The
              personal information that we collect depends on the context of
              your interactions with us and the Services, the choices you make,
              and the products and features you use. The personal information we
              collect may include the following:
            </p>

            <ul className="list-disc pl-10 text-sm text-muted-foreground space-y-2 mt-2">
              <li>names</li>
              <li>email addresses</li>
              <li>usernames</li>
            </ul>

            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              <strong>Sensitive Information.</strong> We do not process
              sensitive information.
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              <strong>Social Media Login Data.</strong> We may provide you with
              the option to register with us using your existing social media
              account details, like your Facebook, X, or other social media
              account. If you choose to register in this way, we will collect
              certain profile information about you from the social media
              provider, as described in the section called{" "}
              <a href="#sociallogins" className="text-primary hover:underline">
                &apos;HOW DO WE HANDLE YOUR SOCIAL LOGINS?&apos;
              </a>{" "}
              below.
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              All personal information that you provide to us must be true,
              complete, and accurate, and you must notify us of any changes to
              such personal information.
            </p>

            <h3 className="text-lg font-medium tracking-tight mb-2 mt-6">
              Information automatically collected
            </h3>

            <p className="text-sm text-muted-foreground leading-relaxed italic mb-4">
              <strong>In Short:</strong>{" "}
              <em>
                Some information — such as your Internet Protocol (IP) address
                and/or browser and device characteristics — is collected
                automatically when you visit our Services.
              </em>
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed">
              We automatically collect certain information when you visit, use,
              or navigate the Services. This information does not reveal your
              specific identity (like your name or contact information) but may
              include device and usage information, such as your IP address,
              browser and device characteristics, operating system, language
              preferences, referring URLs, device name, country, location,
              information about how and when you use our Services, and other
              technical information. This information is primarily needed to
              maintain the security and operation of our Services, and for our
              internal analytics and reporting purposes.
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              Like many businesses, we also collect information through cookies
              and similar technologies. You can find out more about this in our
              Cookie Notice:{" "}
              <a
                href="https://mystudy.chat/cookie-policy"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                mystudy.chat/cookie-policy
              </a>
              .
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              The information we collect includes:
            </p>

            <ul className="list-disc pl-10 text-sm text-muted-foreground space-y-2 mt-2">
              <li>
                <strong>Log and Usage Data.</strong> Log and usage data is
                service-related, diagnostic, usage, and performance information
                our servers automatically collect when you access or use our
                Services and which we record in log files. Depending on how you
                interact with us, this log data may include your IP address,
                device information, browser type, and settings and information
                about your activity in the Services (such as the date/time
                stamps associated with your usage, pages and files viewed,
                searches, and other actions you take such as which features you
                use), device event information (such as system activity, error
                reports (sometimes called &apos;crash dumps&apos;), and hardware
                settings).
              </li>
            </ul>

            <h3 className="text-lg font-medium tracking-tight mb-2 mt-6">
              Google API
            </h3>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Our use of information received from Google APIs will adhere to{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google API Services User Data Policy
              </a>
              , including the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy#limited-use"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Limited Use requirements
              </a>
              .
            </p>
          </div>

          <div id="infouse" className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight mb-4">
              2. HOW DO WE PROCESS YOUR INFORMATION?
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed italic mb-4">
              <strong>In Short:</strong>{" "}
              <em>
                We process your information to provide, improve, and administer
                our Services, communicate with you, for security and fraud
                prevention, and to comply with law. We may also process your
                information for other purposes with your consent.
              </em>
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed">
              We process your personal information for a variety of reasons,
              depending on how you interact with our Services, including:
            </p>

            <ul className="list-disc pl-10 text-sm text-muted-foreground space-y-2 mt-2">
              <li>
                <strong>
                  To facilitate account creation and authentication and
                  otherwise manage user accounts.
                </strong>{" "}
                We may process your information so you can create and log in to
                your account, as well as keep your account in working order.
              </li>
              <li>
                <strong>
                  To save or protect an individual&apos;s vital interest.
                </strong>{" "}
                We may process your information when necessary to save or
                protect an individual&apos;s vital interest, such as to prevent
                harm.
              </li>
            </ul>
          </div>

          <div id="legalbases" className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight mb-4">
              3. WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL
              INFORMATION?
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed italic mb-4">
              <strong>In Short:</strong>{" "}
              <em>
                We only process your personal information when we believe it is
                necessary and we have a valid legal reason (i.e. legal basis) to
                do so under applicable law, like with your consent, to comply
                with laws, to provide you with services to enter into or fulfil
                our contractual obligations, to protect your rights, or to
                fulfil our legitimate business interests.
              </em>
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed">
              The General Data Protection Regulation (GDPR) and UK GDPR require
              us to explain the valid legal bases we rely on in order to process
              your personal information. As such, we may rely on the following
              legal bases to process your personal information:
            </p>

            <ul className="list-disc pl-10 text-sm text-muted-foreground space-y-2 mt-2">
              <li>
                <strong>Consent.</strong> We may process your information if you
                have given us permission (i.e. consent) to use your personal
                information for a specific purpose. You can withdraw your
                consent at any time. Learn more about{" "}
                <a
                  href="#withdrawconsent"
                  className="text-primary hover:underline"
                >
                  withdrawing your consent
                </a>
                .
              </li>
              <li>
                <strong>Legal Obligations.</strong> We may process your
                information where we believe it is necessary for compliance with
                our legal obligations, such as to cooperate with a law
                enforcement body or regulatory agency, exercise or defend our
                legal rights, or disclose your information as evidence in
                litigation in which we are involved.
              </li>
              <li>
                <strong>Vital Interests.</strong> We may process your
                information where we believe it is necessary to protect your
                vital interests or the vital interests of a third party, such as
                situations involving potential threats to the safety of any
                person.
              </li>
            </ul>
          </div>

          <div id="whoshare" className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight mb-4">
              4. WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL INFORMATION?
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed italic mb-4">
              <strong>In Short:</strong>{" "}
              <em>
                We may share information in specific situations described in
                this section and/or with the following third parties.
              </em>
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed">
              We may need to share your personal information in the following
              situations:
            </p>

            <ul className="list-disc pl-10 text-sm text-muted-foreground space-y-2 mt-2">
              <li>
                <strong>Business Transfers.</strong> We may share or transfer
                your information in connection with, or during negotiations of,
                any merger, sale of company assets, financing, or acquisition of
                all or a portion of our business to another company.
              </li>
            </ul>
          </div>

          <div id="cookies" className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight mb-4">
              5. DO WE USE COOKIES AND OTHER TRACKING TECHNOLOGIES?
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed italic mb-4">
              <strong>In Short:</strong>{" "}
              <em>
                We may use cookies and other tracking technologies to collect
                and store your information.
              </em>
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed">
              We may use cookies and similar tracking technologies (like web
              beacons and pixels) to gather information when you interact with
              our Services. Some online tracking technologies help us maintain
              the security of our Services and your account, prevent crashes,
              fix bugs, save your preferences, and assist with basic site
              functions.
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              We also permit third parties and service providers to use online
              tracking technologies on our Services for analytics and
              advertising, including to help manage and display advertisements,
              to tailor advertisements to your interests, or to send abandoned
              shopping cart reminders (depending on your communication
              preferences). The third parties and service providers use their
              technology to provide advertising about products and services
              tailored to your interests which may appear either on our Services
              or on other websites.
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              Specific information about how we use such technologies and how
              you can refuse certain cookies is set out in our Cookie Notice:{" "}
              <a
                href="https://mystudy.chat/cookie-policy"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                mystudy.chat/cookie-policy
              </a>
              .
            </p>
          </div>

          <div id="ai" className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight mb-4">
              6. DO WE OFFER ARTIFICIAL INTELLIGENCE-BASED PRODUCTS?
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed italic mb-4">
              <strong>In Short:</strong>{" "}
              <em>
                We offer products, features, or tools powered by artificial
                intelligence, machine learning, or similar technologies.
              </em>
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed">
              As part of our Services, we offer products, features, or tools
              powered by artificial intelligence, machine learning, or similar
              technologies (collectively, &apos;AI Products&apos;). These tools
              are designed to enhance your experience and provide you with
              innovative solutions. The terms in this Privacy Notice govern your
              use of the AI Products within our Services.
            </p>

            <h3 className="text-lg font-medium tracking-tight mb-2 mt-6">
              Use of AI Technologies
            </h3>

            <p className="text-sm text-muted-foreground leading-relaxed">
              We provide the AI Products through third-party service providers
              (&apos;AI Service Providers&apos;), including Perplexity, Google
              Cloud AI, OpenAI, Microsoft Azure AI, NVIDIA AI, Anthropic, Groq
              and Hugging Face. As outlined in this Privacy Notice, your input,
              output, and personal information will be shared with and processed
              by these AI Service Providers to enable your use of our AI
              Products for purposes outlined in{" "}
              <a href="#legalbases" className="text-primary hover:underline">
                &apos;WHAT LEGAL BASES DO WE RELY ON TO PROCESS YOUR PERSONAL
                INFORMATION?&apos;
              </a>{" "}
              You must not use the AI Products in any way that violates the
              terms or policies of any AI Service Provider.
            </p>

            <h3 className="text-lg font-medium tracking-tight mb-2 mt-6">
              Our AI Products
            </h3>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Our AI Products are designed for the following functions:
            </p>

            <ul className="list-disc pl-10 text-sm text-muted-foreground space-y-2 mt-2">
              <li>AI applications</li>
            </ul>

            <h3 className="text-lg font-medium tracking-tight mb-2 mt-6">
              How We Process Your Data Using AI
            </h3>

            <p className="text-sm text-muted-foreground leading-relaxed">
              All personal information processed using our AI Products is
              handled in line with our Privacy Notice and our agreement with
              third parties. This ensures high security and safeguards your
              personal information throughout the process, giving you peace of
              mind about your data&apos;s safety.
            </p>
          </div>

          <div id="sociallogins" className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight mb-4">
              7. HOW DO WE HANDLE YOUR SOCIAL LOGINS?
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed italic mb-4">
              <strong>In Short:</strong>{" "}
              <em>
                If you choose to register or log in to our Services using a
                social media account, we may have access to certain information
                about you.
              </em>
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Our Services offer you the ability to register and log in using
              your third-party social media account details (like your Facebook
              or X logins). Where you choose to do this, we will receive certain
              profile information about you from your social media provider. The
              profile information we receive may vary depending on the social
              media provider concerned, but will often include your name, email
              address, friends list, and profile picture, as well as other
              information you choose to make public on such a social media
              platform.
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              We will use the information we receive only for the purposes that
              are described in this Privacy Notice or that are otherwise made
              clear to you on the relevant Services. Please note that we do not
              control, and are not responsible for, other uses of your personal
              information by your third-party social media provider. We
              recommend that you review their privacy notice to understand how
              they collect, use, and share your personal information, and how
              you can set your privacy preferences on their sites and apps.
            </p>
          </div>

          <div id="intltransfers" className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight mb-4">
              8. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed italic mb-4">
              <strong>In Short:</strong>{" "}
              <em>
                We may transfer, store, and process your information in
                countries other than your own.
              </em>
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Our servers are located in. If you are accessing our Services from
              outside, please be aware that your information may be transferred
              to, stored by, and processed by us in our facilities and in the
              facilities of the third parties with whom we may share your
              personal information (see{" "}
              <a href="#whoshare" className="text-primary hover:underline">
                &apos;WHEN AND WITH WHOM DO WE SHARE YOUR PERSONAL
                INFORMATION?&apos;
              </a>{" "}
              above), in and other countries.
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              If you are a resident in the European Economic Area (EEA), United
              Kingdom (UK), or Switzerland, then these countries may not
              necessarily have data protection laws or other similar laws as
              comprehensive as those in your country. However, we will take all
              necessary measures to protect your personal information in
              accordance with this Privacy Notice and applicable law.
            </p>
          </div>

          <div id="inforetain" className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight mb-4">
              9. HOW LONG DO WE KEEP YOUR INFORMATION?
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed italic mb-4">
              <strong>In Short:</strong>{" "}
              <em>
                We keep your information for as long as necessary to fulfil the
                purposes outlined in this Privacy Notice unless otherwise
                required by law.
              </em>
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed">
              We will only keep your personal information for as long as it is
              necessary for the purposes set out in this Privacy Notice, unless
              a longer retention period is required or permitted by law (such as
              tax, accounting, or other legal requirements). No purpose in this
              notice will require us keeping your personal information for
              longer than the period of time in which users have an account with
              us.
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              When we have no ongoing legitimate business need to process your
              personal information, we will either delete or anonymise such
              information, or, if this is not possible (for example, because
              your personal information has been stored in backup archives),
              then we will securely store your personal information and isolate
              it from any further processing until deletion is possible.
            </p>
          </div>

          <div id="infosafe" className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight mb-4">
              10. HOW DO WE KEEP YOUR INFORMATION SAFE?
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed italic mb-4">
              <strong>In Short:</strong>{" "}
              <em>
                We aim to protect your personal information through a system of
                organisational and technical security measures.
              </em>
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed">
              We have implemented appropriate and reasonable technical and
              organisational security measures designed to protect the security
              of any personal information we process. However, despite our
              safeguards and efforts to secure your information, no electronic
              transmission over the Internet or information storage technology
              can be guaranteed to be 100% secure, so we cannot promise or
              guarantee that hackers, cybercriminals, or other unauthorised
              third parties will not be able to defeat our security and
              improperly collect, access, steal, or modify your information.
              Although we will do our best to protect your personal information,
              transmission of personal information to and from our Services is
              at your own risk. You should only access the Services within a
              secure environment.
            </p>
          </div>

          <div id="infominors" className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight mb-4">
              11. DO WE COLLECT INFORMATION FROM MINORS?
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed italic mb-4">
              <strong>In Short:</strong>{" "}
              <em>
                We do not knowingly collect data from or market to children
                under 18 years of age.
              </em>
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed">
              We do not knowingly collect, solicit data from, or market to
              children under 18 years of age, nor do we knowingly sell such
              personal information. By using the Services, you represent that
              you are at least 18 or that you are the parent or guardian of such
              a minor and consent to such minor dependent&apos;s use of the
              Services. If we learn that personal information from users less
              than 18 years of age has been collected, we will deactivate the
              account and take reasonable measures to promptly delete such data
              from our records. If you become aware of any data we may have
              collected from children under age 18, please contact us at
              __________.
            </p>
          </div>

          <div id="privacyrights" className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight mb-4">
              12. WHAT ARE YOUR PRIVACY RIGHTS?
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed italic mb-4">
              <strong>In Short:</strong>{" "}
              <em>
                In some regions, such as the European Economic Area (EEA),
                United Kingdom (UK), and Switzerland, you have rights that allow
                you greater access to and control over your personal
                information. You may review, change, or terminate your account
                at any time, depending on your country, province, or state of
                residence.
              </em>
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed">
              In some regions (like the EEA, UK, and Switzerland), you have
              certain rights under applicable data protection laws. These may
              include the right (i) to request access and obtain a copy of your
              personal information, (ii) to request rectification or erasure;
              (iii) to restrict the processing of your personal information;
              (iv) if applicable, to data portability; and (v) not to be subject
              to automated decision-making. In certain circumstances, you may
              also have the right to object to the processing of your personal
              information. You can make such a request by contacting us by using
              the contact details provided in the section{" "}
              <a href="#contact" className="text-primary hover:underline">
                &apos;HOW CAN YOU CONTACT US ABOUT THIS NOTICE?&apos;
              </a>{" "}
              below.
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              We will consider and act upon any request in accordance with
              applicable data protection laws.
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              If you are located in the EEA or UK and you believe we are
              unlawfully processing your personal information, you also have the
              right to complain to your{" "}
              <a
                href="https://ec.europa.eu/justice/data-protection/bodies/authorities/index_en.htm"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Member State data protection authority
              </a>{" "}
              or{" "}
              <a
                href="https://ico.org.uk/make-a-complaint/data-protection-complaints/data-protection-complaints/"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                UK data protection authority
              </a>
              .
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              If you are located in Switzerland, you may contact the{" "}
              <a
                href="https://www.edoeb.admin.ch/edoeb/en/home.html"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Federal Data Protection and Information Commissioner
              </a>
              .
            </p>

            <div id="withdrawconsent" className="mt-6">
              <h3 className="text-lg font-medium tracking-tight mb-2">
                Withdrawing your consent
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed">
                If we are relying on your consent to process your personal
                information, you have the right to withdraw your consent at any
                time. You can withdraw your consent at any time by contacting us
                by using the contact details provided in the section{" "}
                <a href="#contact" className="text-primary hover:underline">
                  &apos;HOW CAN YOU CONTACT US ABOUT THIS NOTICE?&apos;
                </a>{" "}
                below.
              </p>

              <p className="text-sm text-muted-foreground leading-relaxed mt-4">
                However, please note that this will not affect the lawfulness of
                the processing before its withdrawal nor, will it affect the
                processing of your personal information conducted in reliance on
                lawful processing grounds other than consent.
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium tracking-tight mb-2">
                Account Information
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed">
                If you would at any time like to review or change the
                information in your account or terminate your account, you can:
              </p>

              <ul className="list-disc pl-10 text-sm text-muted-foreground space-y-2 mt-2">
                <li>
                  Log in to your account settings and update your user account.
                </li>
              </ul>

              <p className="text-sm text-muted-foreground leading-relaxed mt-4">
                Upon your request to terminate your account, we will deactivate
                or delete your account and information from our active
                databases. However, we may retain some information in our files
                to prevent fraud, troubleshoot problems, assist with any
                investigations, enforce our legal terms and/or comply with
                applicable legal requirements.
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-medium tracking-tight mb-2">
                Cookies and similar technologies
              </h3>

              <p className="text-sm text-muted-foreground leading-relaxed">
                Most Web browsers are set to accept cookies by default. If you
                prefer, you can usually choose to set your browser to remove
                cookies and to reject cookies. If you choose to remove cookies
                or reject cookies, this could affect certain features or
                services of our Services. For further information, please see
                our Cookie Notice:{" "}
                <a
                  href="https://mystudy.chat/cookie-policy"
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  mystudy.chat/cookie-policy
                </a>
                .
              </p>
            </div>
          </div>

          <div id="DNT" className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight mb-4">
              13. CONTROLS FOR DO-NOT-TRACK FEATURES
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Most web browsers and some mobile operating systems and mobile
              applications include a Do-Not-Track (&apos;DNT&apos;) feature or
              setting you can activate to signal your privacy preference not to
              have data about your online browsing activities monitored and
              collected. At this stage, no uniform technology standard for
              recognising and implementing DNT signals has been finalised. As
              such, we do not currently respond to DNT browser signals or any
              other mechanism that automatically communicates your choice not to
              be tracked online. If a standard for online tracking is adopted
              that we must follow in the future, we will inform you about that
              practice in a revised version of this Privacy Notice.
            </p>
          </div>

          <div id="policyupdates" className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight mb-4">
              14. DO WE MAKE UPDATES TO THIS NOTICE?
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed italic mb-4">
              <strong>In Short:</strong>{" "}
              <em>
                Yes, we will update this notice as necessary to stay compliant
                with relevant laws.
              </em>
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed">
              We may update this Privacy Notice from time to time. The updated
              version will be indicated by an updated &apos;Revised&apos; date
              at the top of this Privacy Notice. If we make material changes to
              this Privacy Notice, we may notify you either by prominently
              posting a notice of such changes or by directly sending you a
              notification. We encourage you to review this Privacy Notice
              frequently to be informed of how we are protecting your
              information.
            </p>
          </div>

          <div id="contact" className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight mb-4">
              15. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed">
              If you have questions or comments about this notice, you may
              contact us by post at:
            </p>

            <p className="text-sm text-muted-foreground leading-relaxed mt-4">
              __________
              <br />
              __________
              <br />
              __________
            </p>
          </div>

          <div id="request" className="mt-8">
            <h2 className="text-xl font-semibold tracking-tight mb-4">
              16. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM
              YOU?
            </h2>

            <p className="text-sm text-muted-foreground leading-relaxed">
              Based on the applicable laws of your country, you may have the
              right to request access to the personal information we collect
              from you, details about how we have processed it, correct
              inaccuracies, or delete your personal information. You may also
              have the right to withdraw your consent to our processing of your
              personal information. These rights may be limited in some
              circumstances by applicable law. To request to review, update, or
              delete your personal information, please fill out and submit a{" "}
              <a
                href="https://app.termly.io/notify/eb018a53-f7df-4a67-947b-b3f51ce79c7c"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                data subject access request
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
