import { Droplets } from "lucide-react"
import { Card } from "@/components/ui/card"

interface HumidityCardProps {
  humidity?: number
}

export function HumidityCard({ humidity = 75 }: HumidityCardProps) {
  const getHumidityLevel = (value: number) => {
    if (value < 30) return { text: "Khô", color: "text-orange-600" }
    if (value < 60) return { text: "Bình thường", color: "text-green-600" }
    if (value < 80) return { text: "Ẩm", color: "text-blue-600" }
    return { text: "Rất ẩm", color: "text-indigo-600" }
  }

  const level = getHumidityLevel(humidity)

  return (
    <Card className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
          <Droplets className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <div className="text-sm text-slate-500">Độ ẩm</div>
          <div className="text-2xl font-bold text-slate-800">{humidity}%</div>
          <div className={`text-xs mt-1 font-medium ${level.color}`}>{level.text}</div>
        </div>
      </div>
    </Card>
  )
}
