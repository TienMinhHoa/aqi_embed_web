import { Thermometer } from "lucide-react"
import { Card } from "@/components/ui/card"

interface TemperatureCardProps {
  temp?: number
}

export function TemperatureCard({ temp = 20 }: TemperatureCardProps) {
  const getTemperatureColor = (value: number) => {
    if (value < 15) return { bg: "bg-blue-100", icon: "text-blue-500", text: "text-blue-600" }
    if (value < 25) return { bg: "bg-green-100", icon: "text-green-500", text: "text-green-600" }
    if (value < 30) return { bg: "bg-orange-100", icon: "text-orange-500", text: "text-orange-600" }
    return { bg: "bg-red-100", icon: "text-red-500", text: "text-red-600" }
  }

  const colors = getTemperatureColor(temp)

  return (
    <Card className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-md">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center`}>
            <Thermometer className={`w-5 h-5 ${colors.icon}`} />
          </div>
          <div className="text-sm text-slate-500 font-medium">Nhiệt độ</div>
        </div>
        <div className="text-3xl font-bold text-slate-800">{temp}°</div>
      </div>
    </Card>
  )
}
