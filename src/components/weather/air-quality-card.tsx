import { Wind, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { Card } from "@/components/ui/card"

interface AirQualityCardProps {
  aqi?: number
  time?: string
  locationName?: string  // Tên tỉnh để hiển thị
}

export function AirQualityCard({ aqi, time, locationName }: AirQualityCardProps) {
  const getAQILevel = (aqiValue: number) => {
    if (aqiValue <= 50) return { 
      level: "Tốt", 
      color: "text-green-600", 
      bg: "bg-green-100", 
      bgDark: "bg-green-500",
      iconColor: "text-green-500",
      border: "border-green-200",
      description: "Chất lượng không khí tốt, an toàn cho sức khỏe",
      icon: <CheckCircle className="w-7 h-7 text-green-600" />
    }
    if (aqiValue <= 100) return { 
      level: "Trung bình", 
      color: "text-yellow-600", 
      bg: "bg-yellow-100", 
      bgDark: "bg-yellow-500",
      iconColor: "text-yellow-500",
      border: "border-yellow-200",
      description: "Chấp nhận được, nhóm nhạy cảm nên hạn chế hoạt động ngoài trời",
      icon: <Info className="w-7 h-7 text-yellow-600" />
    }
    if (aqiValue <= 150) return { 
      level: "Kém", 
      color: "text-orange-600", 
      bg: "bg-orange-100", 
      bgDark: "bg-orange-500",
      iconColor: "text-orange-500",
      border: "border-orange-200",
      description: "Ảnh hưởng đến người nhạy cảm, hạn chế hoạt động ngoài trời",
      icon: <AlertTriangle className="w-7 h-7 text-orange-600" />
    }
    if (aqiValue <= 200) return { 
      level: "Xấu", 
      color: "text-red-600", 
      bg: "bg-red-100", 
      bgDark: "bg-red-500",
      iconColor: "text-red-500",
      border: "border-red-200",
      description: "Có hại cho sức khỏe, mọi người nên hạn chế ra ngoài",
      icon: <AlertTriangle className="w-7 h-7 text-red-600" />
    }
    if (aqiValue <= 300) return { 
      level: "Rất xấu", 
      color: "text-purple-600", 
      bg: "bg-purple-100", 
      bgDark: "bg-purple-500",
      iconColor: "text-purple-500",
      border: "border-purple-200",
      description: "Rất có hại, mọi người nên ở trong nhà",
      icon: <AlertTriangle className="w-7 h-7 text-purple-600" />
    }
    return { 
      level: "Nguy hại", 
      color: "text-rose-900", 
      bg: "bg-rose-100", 
      bgDark: "bg-rose-900",
      iconColor: "text-rose-700",
      border: "border-rose-300",
      description: "Cực kỳ nguy hiểm! Tránh ra ngoài hoàn toàn",
      icon: <AlertTriangle className="w-7 h-7 text-rose-900" />
    }
  }

  const aqiValue = aqi ?? 45
  const aqiInfo = getAQILevel(aqiValue)

  const formatDate = (dateString?: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  }

  return (
    <Card className={`p-6 bg-white/95 backdrop-blur-sm border-2 ${aqiInfo.border} shadow-xl`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-14 h-14 rounded-full ${aqiInfo.bgDark} flex items-center justify-center shadow-lg`}>
              <Wind className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="text-sm text-slate-600 font-semibold">
                {locationName ? `AQI trung bình - ${locationName}` : 'Chỉ số Chất lượng Không khí'}
              </div>
              <div className="text-xs text-slate-500">Air Quality Index (AQI)</div>
            </div>
          </div>
          {aqiInfo.icon}
        </div>

        {/* AQI Value - Highlighted */}
        <div className={`text-center py-6 ${aqiInfo.bg} rounded-xl border-2 ${aqiInfo.border}`}>
          <div className="text-6xl font-bold text-slate-800">
            {Math.round(aqiValue)}
          </div>
          <div className={`text-xl font-bold ${aqiInfo.color} mt-2`}>{aqiInfo.level}</div>
          {time && (
            <div className="text-sm text-slate-600 mt-2">📅 {formatDate(time)}</div>
          )}
        </div>

        {/* Description */}
        <div className={`text-sm text-slate-700 ${aqiInfo.bg} p-4 rounded-lg border ${aqiInfo.border}`}>
          <p className="font-medium leading-relaxed">{aqiInfo.description}</p>
        </div>

        {/* Health Impact */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="font-semibold text-slate-700 mb-1">💡 Khuyến nghị</div>
            <div className="text-slate-600">
              {aqiValue <= 50 && "Hoạt động bình thường"}
              {aqiValue > 50 && aqiValue <= 100 && "Hạn chế cho người nhạy cảm"}
              {aqiValue > 100 && aqiValue <= 150 && "Giảm hoạt động ngoài trời"}
              {aqiValue > 150 && aqiValue <= 200 && "Hạn chế ra ngoài"}
              {aqiValue > 200 && "Ở trong nhà"}
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="font-semibold text-slate-700 mb-1">⚠️ Mức độ rủi ro</div>
            <div className="text-slate-600">
              {aqiValue <= 50 && "Rất an toàn"}
              {aqiValue > 50 && aqiValue <= 100 && "Chấp nhận được"}
              {aqiValue > 100 && aqiValue <= 150 && "Cần lưu ý"}
              {aqiValue > 150 && aqiValue <= 200 && "Nguy hiểm"}
              {aqiValue > 200 && "Rất nguy hiểm"}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
