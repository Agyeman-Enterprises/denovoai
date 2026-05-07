import { MfaEnrollForm } from '@/components/mfa-enroll-form'

export default function MfaEnrollPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <MfaEnrollForm />
      </div>
    </div>
  )
}
