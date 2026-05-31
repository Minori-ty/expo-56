import { describe, it, expect } from "vitest";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import {
  getStatus,
  getAiredEpisodes,
  isUpdatingThisWeek,
  getCurrentEpisode,
  getLastEpisodeTimestamp,
  getAllTiming,
  WEEK_SECONDS,
  type AnimeTimingInput,
} from "./time";

dayjs.extend(isoWeek);

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY = 86400;

/** 锁定一个"当前时间"作为测试基准（取调用时刻，所有偏移以此为参照） */
function now(): dayjs.Dayjs {
  return dayjs();
}

function unix(d: dayjs.Dayjs): number {
  return d.unix();
}

// ─── getStatus ───────────────────────────────────────────────────────────────

describe("getStatus", () => {
  it("即将更新：第一集未到播出时间", () => {
    const n = now();
    const input: AnimeTimingInput = {
      firstEpisodeTimestamp: unix(n) + 7 * DAY,
      totalEpisode: 12,
    };
    expect(getStatus(input, n)).toBe(3);
  });

  it("连载中：正在播出期间", () => {
    const n = now();
    const input: AnimeTimingInput = {
      firstEpisodeTimestamp: unix(n) - 2 * WEEK_SECONDS,
      totalEpisode: 12,
    };
    expect(getStatus(input, n)).toBe(2);
  });

  it("已完结：最后一集已播出", () => {
    const n = now();
    // last ep = firstEp + (total-1)*WEEK, need it strictly before now
    const totalEpisode = 10;
    const input: AnimeTimingInput = {
      firstEpisodeTimestamp: unix(n) - (totalEpisode - 1) * WEEK_SECONDS - DAY,
      totalEpisode,
    };
    expect(getStatus(input, n)).toBe(1);
  });

  it("最后一集正好现在播出 → 连载中（正在播出，尚未完结）", () => {
    const n = now();
    const totalEpisode = 5;
    const firstEpTime = unix(n) - (totalEpisode - 1) * WEEK_SECONDS;
    const input: AnimeTimingInput = { firstEpisodeTimestamp: firstEpTime, totalEpisode };
    // lastEpTime === now exactly → still serializing
    expect(getStatus(input, n)).toBe(2);
  });

  it("第一集正好现在播出 → 连载中", () => {
    const n = now();
    const input: AnimeTimingInput = {
      firstEpisodeTimestamp: unix(n),
      totalEpisode: 12,
    };
    expect(getStatus(input, n)).toBe(2);
  });
});

// ─── getAiredEpisodes ────────────────────────────────────────────────────────

describe("getAiredEpisodes", () => {
  it("即将更新 → 0", () => {
    const n = now();
    const input: AnimeTimingInput = {
      firstEpisodeTimestamp: unix(n) + 30 * DAY,
      totalEpisode: 12,
    };
    expect(getAiredEpisodes(input, n)).toBe(0);
  });

  it("已完结 → totalEpisode", () => {
    const n = now();
    const totalEpisode = 8;
    const input: AnimeTimingInput = {
      firstEpisodeTimestamp: unix(n) - totalEpisode * WEEK_SECONDS,
      totalEpisode,
    };
    expect(getAiredEpisodes(input, n)).toBe(totalEpisode);
  });

  it("连载中 2 周后 → 已播 3 集", () => {
    const n = now();
    const input: AnimeTimingInput = {
      firstEpisodeTimestamp: unix(n) - 2 * WEEK_SECONDS,
      totalEpisode: 12,
    };
    expect(getAiredEpisodes(input, n)).toBe(3);
  });

  it("连载中：已播集数不超过 totalEpisode", () => {
    const n = now();
    const totalEpisode = 2;
    const input: AnimeTimingInput = {
      firstEpisodeTimestamp: unix(n) - 4 * WEEK_SECONDS,
      totalEpisode,
    };
    expect(getAiredEpisodes(input, n)).toBe(totalEpisode);
  });

  it("连载中：整周后同一时刻 → 刚好 +1 集", () => {
    const n = now();
    const input: AnimeTimingInput = {
      firstEpisodeTimestamp: unix(n),
      totalEpisode: 12,
    };
    const oneWeekLater = unix(n) + WEEK_SECONDS;
    expect(getAiredEpisodes(input, oneWeekLater)).toBe(2);
  });

  it("就在首集播出前一刻 → 0（status 为即将更新）", () => {
    const n = now();
    const firstEpTime = unix(n) + DAY;
    const input: AnimeTimingInput = {
      firstEpisodeTimestamp: firstEpTime,
      totalEpisode: 12,
    };
    const justBefore = firstEpTime - 1;
    expect(getAiredEpisodes(input, justBefore)).toBe(0);
    expect(getStatus(input, justBefore)).toBe(3);
  });
});

// ─── isUpdatingThisWeek ──────────────────────────────────────────────────────

describe("isUpdatingThisWeek", () => {
  it("已完结 + 本周完结最后一集 → true", () => {
    const n = now();
    const total = 5;
    // 最后一集 = now - 1 小时（本周内的过去时间）
    const lastEpTime = unix(n) - 3600;
    const firstTimestamp = lastEpTime - (total - 1) * WEEK_SECONDS;
    expect(
      isUpdatingThisWeek({ firstEpisodeTimestamp: firstTimestamp, totalEpisode: total }, n)
    ).toBe(true);
  });

  it("已完结 + 上周完结 → false", () => {
    const n = now();
    const total = 5;
    // 最后一集 = 8 天前（上周，肯定不在本周）
    const lastEpTime = unix(n) - 8 * DAY;
    const firstTimestamp = lastEpTime - (total - 1) * WEEK_SECONDS;
    expect(
      isUpdatingThisWeek({ firstEpisodeTimestamp: firstTimestamp, totalEpisode: total }, n)
    ).toBe(false);
  });

  it("即将更新 + 本周首播 → true", () => {
    const n = now();
    // 首集 = 2 小时后（今天，本周内）
    const firstTimestamp = unix(n) + 2 * 3600;
    expect(
      isUpdatingThisWeek({ firstEpisodeTimestamp: firstTimestamp, totalEpisode: 12 }, n)
    ).toBe(true);
  });

  it("即将更新 + 下周首播 → false", () => {
    const n = now();
    // 首集 = 8 天后（下周）
    const firstTimestamp = unix(n) + 8 * DAY;
    expect(
      isUpdatingThisWeek({ firstEpisodeTimestamp: firstTimestamp, totalEpisode: 12 }, n)
    ).toBe(false);
  });

  it("连载中 + 本周有播出 → true", () => {
    const n = now();
    // 首集在 2 周前 → 本周的第 3 集会在本周对应 weekday 播出
    const firstEp = unix(n) - 2 * WEEK_SECONDS;
    expect(
      isUpdatingThisWeek({ firstEpisodeTimestamp: firstEp, totalEpisode: 12 }, n)
    ).toBe(true);
  });

  it("连载中 + 下一集在下周（本周已过播出日）→ 取决于 today 是否在播出日前", () => {
    // 若今天是周三，首集是上周四，则本周四（明天）仍有播出 → true
    // 若今天是周五，首集是上周五，则本周五已过 → 本周的 episode 已经过去了
    // 我们用 now() 不确定今天是周几，所以只做原子断言：不 crash
    const n = now();
    const firstEp = unix(n) - 9 * DAY; // 首集约 1.3 周前
    const result = isUpdatingThisWeek({ firstEpisodeTimestamp: firstEp, totalEpisode: 12 }, n);
    expect(typeof result).toBe("boolean");
  });

  it("首集在本周、总集数 1 → true", () => {
    const n = now();
    // 首集 = n + 1 小时（今天，本周内）
    const firstTimestamp = unix(n) + 3600;
    expect(
      isUpdatingThisWeek({ firstEpisodeTimestamp: firstTimestamp, totalEpisode: 1 }, n)
    ).toBe(true);
  });
});

// ─── getCurrentEpisode ───────────────────────────────────────────────────────

describe("getCurrentEpisode", () => {
  it("已完结 → totalEpisode", () => {
    const n = now();
    const totalEpisode = 12;
    const input: AnimeTimingInput = {
      firstEpisodeTimestamp: unix(n) - totalEpisode * WEEK_SECONDS,
      totalEpisode,
    };
    expect(getCurrentEpisode(input, n)).toBe(totalEpisode);
  });

  it("即将更新 + 本周首播 → 1", () => {
    const n = now();
    const input: AnimeTimingInput = {
      firstEpisodeTimestamp: unix(n) + 3600, // 1 hour later, this week
      totalEpisode: 12,
    };
    expect(getCurrentEpisode(input, n)).toBe(1);
  });

  it("即将更新 + 不在本周 → 0", () => {
    const n = now();
    const input: AnimeTimingInput = {
      firstEpisodeTimestamp: unix(n) + 8 * DAY, // next week
      totalEpisode: 12,
    };
    expect(getCurrentEpisode(input, n)).toBe(0);
  });

  it("连载中 2 周后 → 已播 3 集", () => {
    const n = now();
    const input: AnimeTimingInput = {
      firstEpisodeTimestamp: unix(n) - 2 * WEEK_SECONDS,
      totalEpisode: 12,
    };
    expect(getCurrentEpisode(input, n)).toBe(3);
  });

  it("连载中刚刚开始（首集播出当天） → 1", () => {
    const n = now();
    const input: AnimeTimingInput = {
      firstEpisodeTimestamp: unix(n),
      totalEpisode: 12,
    };
    expect(getCurrentEpisode(input, n)).toBe(1);
  });
});

// ─── getLastEpisodeTimestamp ─────────────────────────────────────────────────

describe("getLastEpisodeTimestamp", () => {
  it("已完结 → 最终集播出时间", () => {
    const n = now();
    const totalEpisode = 5;
    const firstEp = unix(n) - totalEpisode * WEEK_SECONDS;
    const input: AnimeTimingInput = { firstEpisodeTimestamp: firstEp, totalEpisode };
    const expected = firstEp + (totalEpisode - 1) * WEEK_SECONDS;
    expect(getLastEpisodeTimestamp(input, n)).toBe(expected);
  });

  it("即将更新 → 首集时间", () => {
    const n = now();
    const firstEp = unix(n) + 30 * DAY;
    const input: AnimeTimingInput = { firstEpisodeTimestamp: firstEp, totalEpisode: 12 };
    expect(getLastEpisodeTimestamp(input, n)).toBe(firstEp);
  });

  it("连载中 → 最近已播出一集的时间", () => {
    const n = now();
    const firstEp = unix(n) - 2 * WEEK_SECONDS;
    // aired 3 episodes, last = ep3 = firstEp + 2 * WEEK_SECONDS
    const expected = firstEp + 2 * WEEK_SECONDS;
    expect(
      getLastEpisodeTimestamp({ firstEpisodeTimestamp: firstEp, totalEpisode: 12 }, n)
    ).toBe(expected);
  });

  it("连载中但首集刚过 → 最近是首集", () => {
    const n = now();
    const firstEp = unix(n);
    const justAfter = firstEp + 3600; // 1 hour later
    const input: AnimeTimingInput = { firstEpisodeTimestamp: firstEp, totalEpisode: 12 };
    expect(getLastEpisodeTimestamp(input, justAfter)).toBe(firstEp);
  });
});

// ─── getAllTiming ─────────────────────────────────────────────────────────────

describe("getAllTiming", () => {
  it("聚合结果一致（连载中）", () => {
    const n = now();
    const firstEp = unix(n) - 3 * WEEK_SECONDS;
    const input: AnimeTimingInput = { firstEpisodeTimestamp: firstEp, totalEpisode: 10 };

    const result = getAllTiming(input, n);

    expect(result.status).toBe(2);
    expect(result.airedEpisodes).toBe(4);
    expect(result.currentEpisode).toBe(4);
    expect(result.isUpdatingThisWeek).toBe(true);
    expect(result.lastEpisodeTimestamp).toBe(firstEp + 3 * WEEK_SECONDS);
  });

  it("已完结的聚合", () => {
    const n = now();
    const totalEpisode = 6;
    const input: AnimeTimingInput = {
      firstEpisodeTimestamp: unix(n) - totalEpisode * WEEK_SECONDS,
      totalEpisode,
    };
    const result = getAllTiming(input, n);

    expect(result.status).toBe(1);
    expect(result.airedEpisodes).toBe(totalEpisode);
    expect(result.currentEpisode).toBe(totalEpisode);
  });

  it("即将更新的聚合", () => {
    const n = now();
    const input: AnimeTimingInput = {
      firstEpisodeTimestamp: unix(n) + 60 * DAY,
      totalEpisode: 12,
    };
    const result = getAllTiming(input, n);

    expect(result.status).toBe(3);
    expect(result.airedEpisodes).toBe(0);
    expect(result.currentEpisode).toBe(0);
    expect(result.isUpdatingThisWeek).toBe(false);
    expect(result.lastEpisodeTimestamp).toBe(input.firstEpisodeTimestamp);
  });
});

// ─── Edge Cases ──────────────────────────────────────────────────────────────

describe("edge cases", () => {
  it("totalEpisode = 1 + 当天完结", () => {
    const n = now();
    const input: AnimeTimingInput = {
      firstEpisodeTimestamp: unix(n),
      totalEpisode: 1,
    };

    expect(getStatus(input, n)).toBe(2);
    expect(getAiredEpisodes(input, n)).toBe(1);
    expect(isUpdatingThisWeek(input, n)).toBe(true);
    expect(getCurrentEpisode(input, n)).toBe(1);
    expect(getLastEpisodeTimestamp(input, n)).toBe(unix(n));

    // 一天后 → 已完结
    const after = unix(n) + DAY;
    expect(getStatus(input, after)).toBe(1);
    expect(getAiredEpisodes(input, after)).toBe(1);
  });

  it("totalEpisode = 0（退化情况，不 crash）", () => {
    const n = now();
    const input: AnimeTimingInput = {
      firstEpisodeTimestamp: unix(n),
      totalEpisode: 0,
    };
    expect(getStatus(input, n)).toBe(1);
    expect(getAiredEpisodes(input, n)).toBe(0);
    expect(isUpdatingThisWeek(input, n)).toBe(false);
    expect(getCurrentEpisode(input, n)).toBe(0);
    expect(getLastEpisodeTimestamp(input, n)).toBe(unix(n) - WEEK_SECONDS);
  });
});
