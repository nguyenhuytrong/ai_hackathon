import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateRehabSnapshotReport } from "./client";

function apiResponse(data: unknown, ok = true) {
  return Promise.resolve({
    ok,
    status: ok ? 200 : 500,
    json: () =>
      Promise.resolve(
        ok
          ? { success: true, message: "ok", data }
          : { success: false, message: "Backend unavailable", status: 500, errors: {} },
      ),
  } as Response);
}

describe("CareBridge API client", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts rehab snapshot report requests to the merged backend endpoint", async () => {
    const report = {
      caregiverSummary: "Mobility observations were summarized for the caregiver.",
      clinicalFlags: ["Arm raise asymmetry was observed."],
      nextSteps: ["Share these observations with the care team."],
    };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => apiResponse(report));

    const result = await generateRehabSnapshotReport({
      cms: {
        CMS: 2.1,
        severity: "moderate impairment",
        breakdown: { arm: 1.2, sit: 2, balance: 0.6 },
      },
      raw: {
        sit: { reps: 3, avgTimeSec: 3.1 },
        arm: { peakLeft: 74, peakRight: 101, asymmetryDeg: 27, weakSide: "left" },
        balance: { swayMagnitude: 0.024, durationSec: 10 },
      },
    });

    expect(result).toEqual(report);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/api/v1/rehab-snapshot/report",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining("\"CMS\":2.1"),
      }),
    );
  });
});
