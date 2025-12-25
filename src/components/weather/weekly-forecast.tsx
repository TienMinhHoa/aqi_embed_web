import { Sun, Cloud, CloudRain } from "lucide-react"
import { Card } from "@/components/ui/card"

const weeklyData = [
  { day: "Hôm nay", high: 32, low: 25, icon: "sunny" },
  { day: "Thứ Hai", high: 31, low: 24, icon: "partly-cloudy" },
  { day: "Thứ Ba", high: 30, low: 24, icon: "cloudy" },
  { day: "Thứ Lhe", high: 30, low: 24, icon: "rainy" },
  { day: "Thứ Năm", high: 31, low: 25, icon: "partly-cloudy" },
]

function WeatherIcon({ type }: { type: string }) {
  switch (type) {
    case "sunny":
      return (
        <div className="relative">
          <Sun className="w-10 h-10 text-amber-500" />
        </div>
      )
    case "partly-cloudy":
      return (
        <div className="relative">
          <Sun className="w-8 h-8 text-amber-500" />
          <Cloud className="w-6 h-6 text-slate-400 absolute -bottom-1 -right-1" />
        </div>
      )
    case "cloudy":
      return <Cloud className="w-10 h-10 text-slate-400" />
    case "rainy":
      return <CloudRain className="w-10 h-10 text-blue-400" />
    default:
      return <Sun className="w-10 h-10 text-amber-500" />
  }
}

export function WeeklyForecast() {
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-700 mb-4">Dự báo 7 ngày tới</h3>
      <div className="grid grid-cols-5 gap-3">
        {weeklyData.map((day, i) => (
          <Card key={i} className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-md text-center">
            <div className="text-sm text-slate-500 mb-2">{day.day}</div>
            <div className="text-2xl font-bold text-slate-800">
              {day.high}°/<span className="text-lg text-slate-500">{day.low}°C</span>
            </div>
            <div className="flex justify-center mt-3">
              <WeatherIcon type={day.icon} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
