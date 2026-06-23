import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildMonitoringReviewContext, withMonitoringReviewContext } from "./monitoring-review-context";

describe("monitoring review context", () => {
  it("carries the selected unified queue issue context", () => {
    const context = buildMonitoringReviewContext({
      id: "task-42",
      type: "review-task",
      resource: "review-tasks",
      assetSlug: "paxos-paxg",
      layer: "reserve",
      problem: "Reserve attestation is stale",
      suggestedAction: "Review issuer report and run validation",
      lastCheckedAt: "2026-06-22T10:20:30.000Z",
      raw: {
        field: "reserve.lastAuditUrl",
        sourceUrl: "https://issuer.example/reports/latest.pdf",
      },
    });

    assert.deepEqual(context, {
      issueId: "task-42",
      issueType: "review-task",
      assetSlug: "paxos-paxg",
      layer: "reserve",
      fieldPath: "reserve.lastAuditUrl",
      problem: "Reserve attestation is stale",
      suggestedAction: "Review issuer report and run validation",
      timestamp: "2026-06-22T10:20:30.000Z",
      sourceUrl: "https://issuer.example/reports/latest.pdf",
    });
  });

  it("falls back to raw issue fields when the normalized row omits them", () => {
    const row = withMonitoringReviewContext({
      resource: "source-health",
      raw: {
        id: "source-health-7",
        assetSlug: "ondo-ousg",
        layer: "market",
        fieldPath: "market.tvl",
        reason: "Source returned 500",
        suggestedAction: "Replace source URL",
        checkedAt: "2026-06-21T08:00:00.000Z",
        url: "https://data.example/ondo",
      },
    });

    assert.equal(row.reviewContext.issueId, "source-health-7");
    assert.equal(row.reviewContext.issueType, "source-health");
    assert.equal(row.reviewContext.assetSlug, "ondo-ousg");
    assert.equal(row.reviewContext.layer, "market");
    assert.equal(row.reviewContext.fieldPath, "market.tvl");
    assert.equal(row.reviewContext.problem, "Source returned 500");
    assert.equal(row.reviewContext.suggestedAction, "Replace source URL");
    assert.equal(row.reviewContext.timestamp, "2026-06-21T08:00:00.000Z");
    assert.equal(row.reviewContext.sourceUrl, "https://data.example/ondo");
  });
});
