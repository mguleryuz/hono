import { useState } from 'react'
import { useAuthWhatsapp } from '@c/hooks'
import { MessageCircle } from 'lucide-react'

import { Alert, AlertDescription } from './ui/alert'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Input } from './ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp'
import { Spinner } from './ui/spinner'

interface WhatsAppLoginProps {
  className?: string
  'data-whatsapp-login-trigger'?: boolean
}

export function WhatsAppLogin({
  className = '',
  'data-whatsapp-login-trigger': dataWhatsappLoginTrigger,
}: WhatsAppLoginProps) {
  const {
    user,
    isLoading,
    sendOtp,
    sendOtpLoading,
    sendOtpError,
    verifyOtp,
    verifyOtpLoading,
    verifyOtpError,
    signOut,
    signOutLoading,
  } = useAuthWhatsapp()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [success, setSuccess] = useState('')
  const [showTroubleshooting, setShowTroubleshooting] = useState(false)

  const resetDialog = () => {
    setStep('phone')
    setPhoneNumber('')
    setOtpCode('')
    setSuccess('')
    setShowTroubleshooting(false)
  }

  const handleOpenDialog = () => {
    setIsDialogOpen(true)
    resetDialog()
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    resetDialog()
  }

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const result = await sendOtp({ payload: { phone_number: phoneNumber } })
      setSuccess(result.message)
      setStep('otp')
    } catch (error) {
      // Error is handled by the hook
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    // Ensure we have a valid OTP code before submitting
    if (otpCode.length !== 6) {
      return
    }
    try {
      await verifyOtp({ payload: { otp_code: otpCode } })
      setSuccess('Login successful!')
      setTimeout(() => {
        handleCloseDialog()
      }, 1000)
    } catch (error) {
      // Error is handled by the hook
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      // Error is handled by the hook
    }
  }

  const handleBack = () => {
    setStep('phone')
    setOtpCode('')
    setSuccess('')
    setShowTroubleshooting(false)
  }

  const handleOtpChange = (value: string) => {
    setOtpCode(value)
    // Auto-submit when OTP is complete
    if (value.length === 6) {
      // Use the value directly instead of waiting for state update
      verifyOtp({ payload: { otp_code: value } }).catch(() => {
        // Error is handled by the hook
      })
    }
  }

  if (isLoading) {
    return (
      <Button disabled className={className}>
        <Spinner className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    )
  }

  if (user) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-gray-600">{user.whatsapp_phone}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          disabled={signOutLoading}
        >
          {signOutLoading ? (
            <>
              <Spinner className="mr-2 h-3 w-3" />
              Signing out...
            </>
          ) : (
            'Sign out'
          )}
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button
        onClick={handleOpenDialog}
        className={`relative overflow-hidden ${className}`}
        data-whatsapp-login-trigger={dataWhatsappLoginTrigger}
      >
        <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
        <span className="bg-gradient-to-r from-[hsl(165,82%,51%)] to-[hsl(280,68%,60%)] bg-clip-text text-transparent">
          Login with WhatsApp
        </span>
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-green-600" />
              WhatsApp Login
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {step === 'phone'
                ? 'Enter your WhatsApp number to receive a verification code'
                : 'Enter the 6-digit code sent to your WhatsApp'}
            </p>

            {(sendOtpError || verifyOtpError) && (
              <Alert variant="destructive">
                <AlertDescription>
                  {sendOtpError || verifyOtpError}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription className="text-green-600">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {step === 'phone' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    disabled={sendOtpLoading}
                    className="text-center"
                  />
                  <p className="text-xs text-gray-500">
                    Include country code (e.g., +1 for US, +44 for UK)
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={sendOtpLoading || !phoneNumber}
                >
                  {sendOtpLoading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4" />
                      Sending OTP...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-3">
                  <label htmlFor="otp" className="text-sm font-medium">
                    Verification Code
                  </label>
                  <div className="flex justify-center">
                    <InputOTP
                      value={otpCode}
                      onChange={handleOtpChange}
                      maxLength={6}
                      disabled={verifyOtpLoading}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-center text-xs text-gray-500">
                    Check your WhatsApp for the 6-digit code
                  </p>
                </div>

                {/* Troubleshooting section */}
                {!showTroubleshooting ? (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowTroubleshooting(true)}
                      className="text-xs text-blue-600 underline hover:text-blue-800"
                    >
                      Not receiving the code? Click here for help
                    </button>
                  </div>
                ) : (
                  <Alert>
                    <AlertDescription>
                      <div className="space-y-2 text-xs">
                        <p className="font-medium">
                          Not receiving the code? Try:
                        </p>
                        <ul className="list-inside list-disc space-y-1">
                          <li>
                            Check if WhatsApp is updated to the latest version
                          </li>
                          <li>
                            Ensure your phone number isn't registered with
                            personal WhatsApp
                          </li>
                          <li>
                            Check if you've accepted WhatsApp's latest Terms of
                            Service
                          </li>
                          <li>
                            Verify your phone number format includes country
                            code
                          </li>
                          <li>Wait a few minutes and check WhatsApp again</li>
                        </ul>
                        <button
                          type="button"
                          onClick={() => setShowTroubleshooting(false)}
                          className="text-blue-600 underline hover:text-blue-800"
                        >
                          Hide troubleshooting
                        </button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={verifyOtpLoading}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={verifyOtpLoading || otpCode.length !== 6}
                  >
                    {verifyOtpLoading ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Login'
                    )}
                  </Button>
                </div>
              </form>
            )}

            <div className="text-center text-xs text-gray-500">
              <p>By logging in, you agree to receive messages via WhatsApp</p>
              <p>Standard message rates may apply</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
