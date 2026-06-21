DELETE FROM "AssetSource" a
USING "AssetSource" b
WHERE a.id > b.id
  AND a."assetId" = b."assetId"
  AND a."layer" = b."layer"
  AND a."field" = b."field"
  AND a."sourceUrl" = b."sourceUrl";

CREATE UNIQUE INDEX "AssetSource_assetId_layer_field_sourceUrl_key" ON "AssetSource"("assetId", "layer", "field", "sourceUrl");
