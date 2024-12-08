import Calendar from "react-calendar";
import Container from "../dawn-ui/components/Container";
import useTasks from "./hooks/useTasks";
import { DawnTime } from "../dawn-ui/time";
import { useEffect, useMemo, useState } from "react";
import { MoodLog } from "./types";
import {
  createAverageMood,
  moodColorMap,
  moodMap,
  MoodType,
  moodTypes,
} from "./MoodLogger";
import { Chart as ChartJS, registerables, ChartConfiguration } from "chart.js";
import { Line } from "react-chartjs-2";
import Row from "../dawn-ui/components/Row";
import Column from "../dawn-ui/components/Column";

ChartJS.register(...registerables);

export default function MoodHistory({
  hook,
  setPage,
}: {
  hook: ReturnType<typeof useTasks>;
  setPage: Function;
}) {
  const [historyData, setHistoryData] = useState<ChartConfiguration | null>(
    null
  );
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [graphTimeFrame, setGraphTimeFrame] = useState<string>("current-month");
  const _moodMap = useMemo(() => {
    const t: Record<string, MoodLog[]> = {};
    for (const m of hook.moods) {
      let k = DawnTime.formatDateString(new Date(m.created_at), "YYYY-MM-DD");
      if (!t[k]) t[k] = [];
      t[k].push(m);
    }
    return t;
  }, [hook.moods]);

  useEffect(() => {
    let data = hook.moods.map((x) => {
      return {
        created_at: x.created_at,
        index: moodTypes.indexOf(
          moodMap[x.emotion as keyof typeof moodMap] as MoodType
        ),
      };
    });

    let dates: { created_at: string; value: number }[] = [];
    let past: string | null = null;
    let cur: number = 0;
    let len: number = 0;

    for (const dat of data) {
      let date = new Date(dat.created_at);
      if (graphTimeFrame === "current-month") {
        if (
          date.getFullYear() !== startDate.getFullYear() ||
          date.getMonth() !== startDate.getMonth()
        )
          continue;
      } else if (graphTimeFrame === "current-year") {
        if (date.getFullYear() !== startDate.getFullYear()) continue;
      }
      let d = DawnTime.formatDateString(date, "YYYY-MM-DD");
      if (d !== past) {
        dates.push({
          created_at: past || d,
          value: Math.round(cur / len),
        });
        past = d;
        cur = 0;
        len = 0;
      }
      cur += dat.index;
      len += 1;
    }

    if (len) {
      dates.push({
        created_at: past || "0000-00-00",
        value: Math.round(cur / len),
      });
    }

    let cdata: ChartConfiguration = {
      type: "line",
      data: {
        labels: dates.map((x) => x.created_at),
        datasets: [
          {
            label: "Mood Overtime",
            data: dates.map((x) => x.value),
            segment: {
              borderColor: (ctx) => {
                let idx = ((cdata.data.datasets[0].data[
                  ctx.p1DataIndex
                ] as number) ?? 0) as any;

                return moodColorMap[moodTypes[idx]];
              },
            },
          },
        ],
      },
    };

    setHistoryData(cdata);
  }, [hook.moods, startDate, graphTimeFrame]);

  return (
    <Container title="Average mood calendar">
      <Row style={{ maxWidth: "100%" }}>
        <Column>
          <Calendar
            onClickDay={(v) => {
              setPage(
                `view_mood_details@${DawnTime.formatDateString(
                  v,
                  "YYYY-MM-DD"
                )}`
              );
            }}
            onActiveStartDateChange={(v) => {
              setStartDate(v.activeStartDate || new Date());
            }}
            tileClassName={({ activeStartDate, date, view }) => {
              if (view !== "month") return null;
              let k = DawnTime.formatDateString(date, "YYYY-MM-DD");
              if (!_moodMap[k]) return null;
              return `mood-${(
                createAverageMood(
                  _moodMap[k].map(
                    (x) => moodMap[x.emotion as keyof typeof moodMap]
                  ) as MoodType[]
                ) as keyof typeof moodMap
              ).replace(/_/g, "-")}`;
            }}
          />
          <label>Click on an entry to view logs for that day.</label>
          <Row util={["no-gap"]} style={{ gap: "2px" }}>
            <label>Graph time frame:</label>
            <select
              value={graphTimeFrame}
              onChange={(e) => {
                setGraphTimeFrame(e.currentTarget.value);
              }}
            >
              <option value="current-month">Current Month</option>
              <option value="current-year">Current Year</option>
              <option value="all-time">All Time</option>
            </select>
          </Row>
        </Column>
        {historyData && (
          <Line
            options={{ responsive: true, maintainAspectRatio: false }}
            style={{
              maxHeight: "400px",
              minWidth: "300px",
              maxWidth: "700px",
              width: "100%",
            }}
            data={historyData.data as any}
          />
        )}
      </Row>
    </Container>
  );
}
