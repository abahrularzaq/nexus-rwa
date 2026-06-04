import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AssetMetricSections } from "@/components/assets/AssetMetricSections";
import { getLocalAssetMetrics, getLocalAssetSlugs, hasLocalAsset } from "@/lib/local-assets";

type AssetDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export function generateStaticParams() {
  return getLocalAssetSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: AssetDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  if (!hasLocalAsset(slug)) {
    return {
      title: "Asset Not Found · Nexus RWA",
    };
  }

  const asset = getLocalAssetMetrics(slug);
  const name = asset.identity.name ?? slug;
  const symbol = asset.identity.symbol ? ` (${asset.identity.symbol})` : "";

  return {
    title: `${name}${symbol} · Nexus RWA`,
    description:
      asset.identity.description ??
      `RWA asset profile, compliance, liquidity, reserve, and grading metrics for ${name}.`,
  };
}

export default async function AssetDetailPage({ params }: AssetDetailPageProps) {
  const { slug } = await params;

  if (!hasLocalAsset(slug)) notFound();

  const asset = getLocalAssetMetrics(slug);

  return (
    <main className="min-h-screen px-6 py-10 md:px-12" style={{ background: "var(--bg-primary)" }}>
      <div className="mx-auto max-w-[1400px] pt-16">
        <AssetMetricSections asset={asset} />
      </div>
    </main>
  );
}
