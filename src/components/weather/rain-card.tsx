import { CloudRain } from "lucide-react"
import { Card } from "@/components/ui/card"

interface RainCardProps {
  rainfall?: number
}

export function RainCard({ rainfall = 0 }: RainCardProps) {
  const getRainLevel = (value: number) => {
    if (value === 0) return { text: "Không mưa", color: "text-slate-600" }
    if (value < 2) return { text: "Mưa nhẹ", color: "text-blue-400" }
    if (value < 10) return { text: "Mưa vừa", color: "text-blue-500" }
    return { text: "Mưa to", color: "text-blue-700" }
  }

  const level = getRainLevel(rainfall)

  return (
    <Card className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-md">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
            <CloudRain className="w-5 h-5 text-sky-500" />
          </div>
          <div className="text-sm text-slate-500 font-medium">Lượng mưa</div>
        </div>
        <div className="text-2xl font-bold text-slate-800">{rainfall} mm</div>
      </div>
    </Card>
  )
}
