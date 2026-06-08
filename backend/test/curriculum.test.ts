import { describe, expect, it } from "vitest";
import { CURRICULUM, STUDY_INDEX, nextStudyName } from "../src/curriculum.js";

describe("backend curriculum", () => {
  it("mirrors the frontend curriculum exactly", () => {
    expect(CURRICULUM.length).toBe(8);
    expect(STUDY_INDEX["CTC"]).toBe(7);
    expect(nextStudyName(-1)).toBe("Seeking God");
    expect(nextStudyName(7)).toBeNull();
  });
});
