import { useState, useCallback, useMemo } from "react";
import { useWindowDimensions } from "react-native";
import {
  TabView,
  SceneMap,
  type Route,
} from "react-native-tab-view";
import dayjs from "dayjs";
import { View, Text } from "@/tw";
import { cn } from "@/utils/cn";

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"] as const;

type DayRoute = Route & {
  key: (typeof DAYS)[number];
};

/** dayjs day() → DAYS index (dayjs: 0=Sun → DAYS: 周一=0 … 周日=6) */
function getTodayIndex(): number {
  const d = dayjs().day(); // 0=Sun … 6=Sat
  return d === 0 ? 6 : d - 1; // Sun→6, Mon→0, Tue→1, …
}

// ─── Day Scene ───────────────────────────────────────────────────────────────

function DayScene({ day }: { day: string }) {
  return (
    <View className="flex-1 bg-white dark:bg-black p-4">
      <View className="flex-1 items-center justify-center gap-3">
        <View className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <Text className="text-2xl">📺</Text>
        </View>
        <Text className="text-lg font-semibold text-gray-900 dark:text-white">
          {day}
        </Text>
        <Text className="text-sm text-gray-400 dark:text-gray-500">
          暂无更新
        </Text>
      </View>
    </View>
  );
}

// ─── Route Config ────────────────────────────────────────────────────────────

const routes: DayRoute[] = DAYS.map((day) => ({
  key: day,
  title: day,
}));

const renderScene = SceneMap({
  周一: () => <DayScene day="周一" />,
  周二: () => <DayScene day="周二" />,
  周三: () => <DayScene day="周三" />,
  周四: () => <DayScene day="周四" />,
  周五: () => <DayScene day="周五" />,
  周六: () => <DayScene day="周六" />,
  周日: () => <DayScene day="周日" />,
});

// ─── Main Component ──────────────────────────────────────────────────────────

export default function UpdateSchedule() {
  const layout = useWindowDimensions();

  const initialIndex = useMemo(() => getTodayIndex(), []);
  const [index, setIndex] = useState(initialIndex);

  const renderTabBar = useCallback(
    (props: any) => (
      <View className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
        <View className="flex-row px-2">
          {props.navigationState.routes.map(
            (route: DayRoute, i: number) => {
              const isActive = i === index;
              return (
                <View
                  key={route.key}
                  className="flex-1 items-center py-3 relative"
                  style={{ minWidth: 48 }}
                  onTouchEnd={() => setIndex(i)}
                >
                  <Text
                    className={cn(
                      "text-sm",
                      isActive
                        ? "font-bold text-[#208AEF]"
                        : "text-gray-400 dark:text-gray-500"
                    )}
                  >
                    {route.title}
                  </Text>
                  {isActive && (
                    <View className="absolute bottom-0 h-0.5 w-8 rounded-full bg-[#208AEF]" />
                  )}
                </View>
              );
            }
          )}
        </View>
      </View>
    ),
    [index]
  );

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      renderTabBar={renderTabBar}
      initialLayout={{ width: layout.width, height: 0 }}
      swipeEnabled
    />
  );
}
