import { Nav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { Ticker } from "@/components/landing/Ticker";
import { MetricsBar } from "@/components/landing/MetricsBar";
import { AssetsTable } from "@/components/landing/AssetsTable";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { AssetDetailMetricsPreview } from "@/components/landing/AssetDetailMetricsPreview";
import { X402Section } from "@/components/landing/X402Section";
import { ApiFeatures } from "@/components/landing/ApiFeatures";
import { Pricing } from "@/components/landing/Pricing";
import { UseCases } from "@/components/landing/UseCases";
import { ApiReference } from "@/components/landing/ApiReference";
import { CTASection, Footer } from "@/components/landing/CTAFooter";
import { getLocalAssetMetrics } from "@/lib/local-assets";

export default function HomePage() {
  const benjiMetrics = getLocalAssetMetrics("franklin-benji");

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--bg-primary)" }}
    >
      <Nav />
      <main>
        <Hero />
        <Ticker />
        <MetricsBar />
        <AssetsTable />
        <DashboardPreview />
        <AssetDetailMetricsPreview asset={benjiMetrics} />
        <X402Section />
        <ApiFeatures />
        <Pricing />
        <UseCases />
        <ApiReference />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
