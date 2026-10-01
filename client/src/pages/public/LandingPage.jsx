import { usePageMeta } from '../../hooks/usePageMeta'
import HeroSection from '../../components/public/home/HeroSection'
import StatsStrip from '../../components/public/home/StatsStrip'
import HowItWorks from '../../components/public/home/HowItWorks'
import CategoryGrid from '../../components/public/home/CategoryGrid'
import ShopPreview from '../../components/public/home/ShopPreview'
import CoverageMap from '../../components/public/home/CoverageMap'
import BusinessSection from '../../components/public/home/BusinessSection'
import DeliveryExperience from '../../components/public/home/DeliveryExperience'
import FulfillmentSection from '../../components/public/home/FulfillmentSection'
import LocalBusinessSection from '../../components/public/home/LocalBusinessSection'
import FinalCTA from '../../components/public/home/FinalCTA'

export default function LandingPage() {
  usePageMeta(
    'NEARE — Everything You Need, Near You',
    'Discover nearby shops, order what you need, and choose pickup or local delivery — all in one place.',
  )

  return (
    <div className="overflow-x-clip">
      <HeroSection />
      <StatsStrip />
      <HowItWorks />
      <CategoryGrid />
      <ShopPreview />
      <CoverageMap />
      <BusinessSection />
      <DeliveryExperience />
      <FulfillmentSection />
      <LocalBusinessSection />
      <FinalCTA />
    </div>
  )
}
