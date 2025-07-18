import { useState } from 'react'
import { Button } from '@c/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@c/components/ui/card'
import { Label } from '@c/components/ui/label'
import { Switch } from '@c/components/ui/switch'
import { createFileRoute } from '@tanstack/react-router'
import domtoimage from 'dom-to-image'
import { Download, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/media-kit')({
  component: MediaKitPage,
})

const downloadAsImage = async (
  elementId: string,
  filename: string,
  setLoading: (loading: boolean) => void
) => {
  setLoading(true)
  const element = document.getElementById(elementId)
  if (!element) {
    setLoading(false)
    return
  }

  try {
    // Check if the element has a transparent background
    const computedStyle = getComputedStyle(element)
    const elementBgColor = computedStyle.backgroundColor

    let bgcolor: string

    // If the element has transparent background, use transparent for download
    if (
      elementBgColor === 'rgba(0, 0, 0, 0)' ||
      elementBgColor === 'transparent' ||
      element.classList.contains('bg-transparent')
    ) {
      bgcolor = 'transparent'
    } else {
      // Get the actual computed background color from CSS variable
      const rootStyle = getComputedStyle(document.documentElement)
      bgcolor = rootStyle.getPropertyValue('--background').trim()

      if (!bgcolor) {
        throw new Error('Background color could not be computed')
      }
    }

    const dataUrl = await domtoimage.toPng(element, {
      quality: 1,
      bgcolor,
    })

    const link = document.createElement('a')
    link.download = filename
    link.href = dataUrl
    link.click()
  } catch (error) {
    console.error('Error generating image:', error)
    toast.error('Error generating image', {
      description:
        error instanceof Error
          ? `${error.message.slice(0, 20)}...`
          : 'Unknown error',
    })
  } finally {
    setLoading(false)
  }
}

const OGImage = ({ withBackground }: { withBackground: boolean }) => {
  return (
    <div
      id="og-image"
      className={`relative flex items-center justify-center font-[Satoshi-Black] ${
        withBackground
          ? 'from-background to-primary/20 bg-gradient-to-tl'
          : 'bg-transparent'
      }`}
      style={{ width: '1200px', height: '630px' }}
    >
      <img
        src="/images/icon.png"
        alt="App Logo"
        className="mr-8 h-80 w-80 object-contain"
      />
      <span className="from-primary via-foreground to-primary bg-gradient-to-r bg-clip-text text-6xl font-bold text-transparent">
        Hono
      </span>
    </div>
  )
}

const TwitterBanner = ({ withBackground }: { withBackground: boolean }) => {
  return (
    <div
      id="twitter-banner"
      className={`relative flex items-center justify-center ${
        withBackground
          ? 'from-background to-primary/20 bg-gradient-to-tl'
          : 'bg-transparent'
      }`}
      style={{ width: '1500px', height: '500px' }}
    >
      <span className="from-primary via-foreground to-primary bg-gradient-to-r bg-clip-text font-[Satoshi-Black] text-7xl font-bold text-transparent">
        Hono
      </span>
    </div>
  )
}

const Logo = ({ withBackground }: { withBackground: boolean }) => {
  return (
    <div
      id="logo"
      className={`flex items-center justify-center rounded-3xl shadow-2xl ${
        withBackground
          ? 'from-background to-primary/20 bg-gradient-to-tl'
          : 'bg-transparent'
      }`}
      style={{ width: '512px', height: '512px' }}
    >
      <img
        src="/images/icon.png"
        alt="App Logo"
        className="h-96 w-96 object-contain"
      />
    </div>
  )
}

const GradientBackground = () => {
  return (
    <div
      id="gradient-background"
      className="from-background to-primary/20 bg-gradient-to-tl"
      style={{ width: '1200px', height: '630px' }}
    />
  )
}

export function MediaKitPage() {
  const [downloadingOG, setDownloadingOG] = useState(false)
  const [downloadingTwitter, setDownloadingTwitter] = useState(false)
  const [downloadingLogo, setDownloadingLogo] = useState(false)
  const [downloadingGradient, setDownloadingGradient] = useState(false)

  // Toggle states for background
  const [ogWithBackground, setOgWithBackground] = useState(true)
  const [twitterWithBackground, setTwitterWithBackground] = useState(true)
  const [logoWithBackground, setLogoWithBackground] = useState(true)

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Media Kit</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Download Hono brand assets for your content and social media
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="text-muted-foreground space-y-2 text-sm">
            <li>• These assets are optimized for web and social media use</li>
            <li>• OG Image: Perfect for website previews and social sharing</li>
            <li>• Twitter Banner: Use as your profile header on Twitter/X</li>
            <li>
              • Logo: Suitable for favicons, app icons, and brand representation
            </li>
            <li>• Gradient Background: Use as a base for custom designs</li>
            <li>• Please maintain aspect ratios when resizing</li>
            <li>
              • Use transparent downloads for overlays on custom backgrounds
            </li>
          </ul>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {/* OG Image */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              OG Image
              <span className="text-muted-foreground text-sm font-normal">
                1200×630px
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-center overflow-auto rounded-lg border">
              <div className="origin-center scale-[0.6]">
                <OGImage withBackground={ogWithBackground} />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="og-background"
                checked={ogWithBackground}
                onCheckedChange={setOgWithBackground}
              />
              <Label htmlFor="og-background" className="text-sm">
                Include background
              </Label>
            </div>
            <Button
              onClick={() =>
                downloadAsImage(
                  'og-image',
                  `hono-og-image${ogWithBackground ? '' : '-transparent'}.png`,
                  setDownloadingOG
                )
              }
              className="w-full"
              disabled={downloadingOG}
            >
              {downloadingOG ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {downloadingOG ? 'Generating...' : 'Download PNG'}
            </Button>
          </CardContent>
        </Card>

        {/* Twitter Banner */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Twitter Banner
              <span className="text-muted-foreground text-sm font-normal">
                1500×500px
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-center overflow-auto rounded-lg border">
              <div className="origin-center scale-[0.5]">
                <TwitterBanner withBackground={twitterWithBackground} />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="twitter-background"
                checked={twitterWithBackground}
                onCheckedChange={setTwitterWithBackground}
              />
              <Label htmlFor="twitter-background" className="text-sm">
                Include background
              </Label>
            </div>
            <Button
              onClick={() =>
                downloadAsImage(
                  'twitter-banner',
                  `hono-twitter-banner${twitterWithBackground ? '' : '-transparent'}.png`,
                  setDownloadingTwitter
                )
              }
              className="w-full"
              disabled={downloadingTwitter}
            >
              {downloadingTwitter ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {downloadingTwitter ? 'Generating...' : 'Download PNG'}
            </Button>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Logo
              <span className="text-muted-foreground text-sm font-normal">
                512×512px
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-center overflow-auto rounded-lg border">
              <div className="origin-center scale-[0.6]">
                <Logo withBackground={logoWithBackground} />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="logo-background"
                checked={logoWithBackground}
                onCheckedChange={setLogoWithBackground}
              />
              <Label htmlFor="logo-background" className="text-sm">
                Include background
              </Label>
            </div>
            <Button
              onClick={() =>
                downloadAsImage(
                  'logo',
                  `hono-logo${logoWithBackground ? '' : '-transparent'}.png`,
                  setDownloadingLogo
                )
              }
              className="w-full"
              disabled={downloadingLogo}
            >
              {downloadingLogo ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {downloadingLogo ? 'Generating...' : 'Download PNG'}
            </Button>
          </CardContent>
        </Card>

        {/* Gradient Background */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Gradient Background
              <span className="text-muted-foreground text-sm font-normal">
                1200×630px
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-center overflow-auto rounded-lg border">
              <div className="origin-center scale-[0.6]">
                <GradientBackground />
              </div>
            </div>
            <Button
              onClick={() =>
                downloadAsImage(
                  'gradient-background',
                  'hono-gradient-background.png',
                  setDownloadingGradient
                )
              }
              className="w-full"
              disabled={downloadingGradient}
            >
              {downloadingGradient ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              {downloadingGradient ? 'Generating...' : 'Download PNG'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
