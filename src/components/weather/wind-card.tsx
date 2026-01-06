import { Wind } from "lucide-react"
import { Card } from "@/components/ui/card"

interface WindCardProps {
  windSpeed?: number
}

export function WindCard({ windSpeed = 0 }: WindCardProps) {
  return (
    <Card className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-md">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center">
            <Wind className="w-5 h-5 text-cyan-500" />
          </div>
          <div className="text-sm text-slate-500 font-medium">Gió</div>
        </div>
        <div className="text-2xl font-bold text-slate-800">{windSpeed.toFixed(1)} km/h</div>
      </div>
    </Card>
  )
}
