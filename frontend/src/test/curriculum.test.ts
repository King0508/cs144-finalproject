import { describe, expect, it } from "vitest";
import { CURRICULUM, nextStudyName, nextStudyIndex, STUDY_INDEX } from "../lib/curriculum";

describe("curriculum", () => {
  it("has 8 studies in the documented order", () => {
    expect(CURRICULUM).toEqual([
      "Seeking God",
      "Word of God",
      "Discipleship",
      "Kingdom",
      "Light and Darkness",
      "Cross",
      "Church",
      "CTC",
    ]);
  });

  it("computes a stable index map", () => {
    expect(STUDY_INDEX["Seeking God"]).toBe(0);
    expect(STUDY_INDEX["CTC"]).toBe(7);
  });

  it("suggests the next study correctly", () => {
    expect(nextStudyName(-1)).toBe("Seeking God");
    expect(nextStudyName(0)).toBe("Word of God");
    expect(nextStudyName(6)).toBe("CTC");
    expect(nextStudyName(7)).toBeNull();
  });

  it("returns null next-index past the end", () => {
    expect(nextStudyIndex(7)).toBeNull();
    expect(nextStudyIndex(99)).toBeNull();
  });
});
