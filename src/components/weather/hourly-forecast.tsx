"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const hourlyData = [
  { time: "14:00", temp: 22, day: "Bây" },
  { time: "16:00", temp: 29, day: "Nay" },
  { time: "18:00", temp: 28, day: "Khu" },
  { time: "20:00", temp: 27, day: "Tối" },
  { time: "22:00", temp: 25, day: "Gáng" },
  { time: "02:00", temp: 26, day: "Sun" },
  { time: "04:00", temp: 26, day: "Mon" },
  { time: "06:00", temp: 25, day: "Hông" },
  { time: "08:00", temp: 24, day: "Trở" },
]

export function HourlyForecast() {
  const maxTemp = Math.max(...hourlyData.map((d) => d.temp))
  const minTemp = Math.min(...hourlyData.map((d) => d.temp))
  const range = maxTemp - minTemp

  return (
    <Card className="p-6 bg-white/90 backdrop-blur-sm border-0 shadow-md">
      <h3 className="text-lg font-semibold text-slate-700 mb-4">Dự báo theo giờ</h3>
      <div className="relative">
        <Button
          variant="outline"
          size="icon"
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white shadow-md h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="overflow-hidden px-4">
          <div className="relative h-32 mb-4">
            <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#60a5fa" />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke="url(#lineGradient)"
                strokeWidth="2"
                points={hourlyData
                  .map((d, i) => {
                    const x = (i / (hourlyData.length - 1)) * 400
                    const y = 100 - ((d.temp - minTemp) / range) * 80 - 10
                    return `${x},${y}`
                  })
                  .join(" ")}
              />
              {hourlyData.map((d, i) => {
                const x = (i / (hourlyData.length - 1)) * 400
                const y = 100 - ((d.temp - minTemp) / range) * 80 - 10
                return <circle key={i} cx={x} cy={y} r="4" fill="#3b82f6" />
              })}
            </svg>
            {hourlyData.map((d, i) => {
              const left = (i / (hourlyData.length - 1)) * 100
              const bottom = ((d.temp - minTemp) / range) * 80 + 15
              return (
                <div
                  key={i}
                  className="absolute text-sm font-medium text-slate-700"
                  style={{
                    left: `${left}%`,
                    bottom: `${bottom}%`,
                    transform: "translateX(-50%)",
                  }}
                >
                  {d.temp}°C
                </div>
              )
            })}
          </div>

          <div className="flex justify-between text-center text-sm text-slate-500">
            {hourlyData.map((d, i) => (
              <div key={i} className="flex flex-col">
                <span>{d.time}</span>
                <span className="text-xs text-slate-400">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-white shadow-md h-8 w-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}
