import { SignUp } from '@clerk/nextjs'

import { PrivacyNotice } from '@/components/privacy-notice'

export default function SignUpPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <SignUp />
      <PrivacyNotice />
    </div>
  )
}
