import { Droplets } from "lucide-react"
import { Card } from "@/components/ui/card"

interface HumidityCardProps {
  humidity?: number
}

export function HumidityCard({ humidity = 75 }: HumidityCardProps) {
  return (
    <Card className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-md">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Droplets className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-sm text-slate-500 font-medium">Độ ẩm</div>
        </div>
        <div className="text-2xl font-bold text-slate-800">{humidity}%</div>
      </div>
    </Card>
  )
}
