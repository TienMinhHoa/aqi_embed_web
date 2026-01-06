import { Cloud, Sun, CloudRain, CloudSnow, CloudDrizzle, Wind, Loader2, AlertCircle } from "lucide-react"
import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TemperatureCard } from "./temperature-card"
import { HumidityCard } from "./humidity-card"
import { WindCard } from "./wind-card"
import { RainCard } from "./rain-card"

interface WeatherData {
  temp: number
  feels_like: number
  humidity: number
  description: string
  wind_speed: number
  pressure: number
  weather_code: number
  temp_min: number
  temp_max: number
}

interface WeatherCardProps {
  weatherData?: WeatherData | null
  isLoading?: boolean
  locationName?: string
  aqi?: number
  aqiTime?: string
}

export function WeatherCard({ weatherData, isLoading, locationName, aqi }: WeatherCardProps) {

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <div className="text-sm text-slate-600">Đang tải...</div>
      </div>
    )
  }

  const temp = weatherData?.temp ?? 28
  const windSpeed = weatherData?.wind_speed ?? 5
  const humidity = weatherData?.humidity ?? 70
  const aqiValue = aqi ?? 120

  const getAQIInfo = (aqiValue: number) => {
    if (aqiValue <= 50) return { 
      level: "Tốt", 
      emoji: "😊",
      gradient: "from-green-400 to-green-500"
    }
    if (aqiValue <= 100) return { 
      level: "Trung bình", 
      emoji: "😐",
      gradient: "from-yellow-400 to-yellow-500"
    }
    if (aqiValue <= 150) return { 
      level: "Kém", 
      emoji: "😷",
      gradient: "from-orange-400 to-orange-500"
    }
    if (aqiValue <= 200) return { 
      level: "Xấu", 
      emoji: "😨",
      gradient: "from-red-400 to-red-500"
    }
    if (aqiValue <= 300) return { 
      level: "Rất xấu", 
      emoji: "😱",
      gradient: "from-purple-400 to-purple-500"
    }
    return { 
      level: "Nguy hại", 
      emoji: "☠️",
      gradient: "from-rose-700 to-rose-900"
    }
  }

  const aqiInfo = getAQIInfo(aqiValue)
  const [showHealthDialog, setShowHealthDialog] = useState(false)

  const formatDate = () => {
    const date = new Date()
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' , year: 'numeric'})
  }

  const getHealthRecommendations = (aqiValue: number) => {
    if (aqiValue <= 50) {
      return {
        general: [
          "Chất lượng không khí tốt, lý tưởng cho các hoạt động ngoài trời.",
          "Mọi người đều có thể hoạt động bình thường.",
          "Không cần biện pháp bảo vệ đặc biệt."
        ],
        sensitive: [
          "Hoạt động ngoài trời an toàn cho tất cả mọi người.",
          "Người nhạy cảm có thể tham gia mọi hoạt động."
        ]
      }
    }
    if (aqiValue <= 100) {
      return {
        general: [
          "Chất lượng không khí chấp nhận được.",
          "Mọi người có thể hoạt động bình thường ngoài trời.",
          "Một số người nhạy cảm có thể bị ảnh hưởng nhẹ."
        ],
        sensitive: [
          "Giảm thời gian hoạt động ngoài trời dài và cường độ cao.",
          "Đeo khẩu trang khi tập thể dục ngoài trời.",
          "Theo dõi các triệu chứng như ho, khó thở."
        ]
      }
    }
    if (aqiValue <= 150) {
      return {
        general: [
          "Giảm thời gian hoạt động ngoài trời dài, đặc biệt là tập luyện cường độ cao.",
          "Đeo khẩu trang khi ra ngoài đường, đặc biệt nếu có triệu chứng hô hấp.",
          "Hạn chế vận động ngoài trời cho trẻ em và người già."
        ],
        sensitive: [
          "Tránh hoạt động ngoài trời dài và căng thẳng.",
          "Đeo khẩu trang N95 hoặc tương đương khi phải ra ngoài.",
          "Ở trong nhà và đóng cửa sổ.",
          "Sử dụng máy lọc không khí trong nhà nếu có thể.",
          "Theo dõi sát các triệu chứng và tham khảo ý kiến bác sĩ nếu cần."
        ]
      }
    }
    if (aqiValue <= 200) {
      return {
        general: [
          "Tránh hoạt động ngoài trời kéo dài.",
          "Đeo khẩu trang N95 khi bắt buộc phải ra ngoài.",
          "Đóng cửa sổ và sử dụng máy lọc không khí.",
          "Theo dõi sức khỏe và tham khảo ý kiến bác sĩ nếu có triệu chứng."
        ],
        sensitive: [
          "Ở trong nhà và tránh mọi hoạt động ngoài trời.",
          "Sử dụng máy lọc không khí liên tục.",
          "Đeo khẩu trang N95 ngay cả khi ở trong nhà nếu cần thiết.",
          "Liên hệ bác sĩ để được tư vấn và theo dõi sức khỏe."
        ]
      }
    }
    if (aqiValue <= 300) {
      return {
        general: [
          "Mọi người nên tránh ra ngoài trời.",
          "Đóng cửa sổ, cửa ra vào kín.",
          "Sử dụng máy lọc không khí ở mức tối đa.",
          "Đeo khẩu trang N95 nếu bắt buộc phải ra ngoài.",
          "Hạn chế vận động trong nhà."
        ],
        sensitive: [
          "Ở trong nhà hoàn toàn, tránh mọi tiếp xúc với không khí bên ngoài.",
          "Sử dụng máy lọc không khí và đeo khẩu trang trong nhà.",
          "Liên hệ với cơ sở y tế để được hỗ trợ.",
          "Chuẩn bị thuốc cần thiết và theo dõi sức khỏe liên tục."
        ]
      }
    }
    return {
      general: [
        "Tình trạng khẩn cấp về sức khỏe - mọi người bị ảnh hưởng.",
        "Tránh hoàn toàn mọi hoạt động ngoài trời.",
        "Ở trong nhà với cửa sổ và cửa đóng kín.",
        "Sử dụng máy lọc không khí ở công suất tối đa.",
        "Đeo khẩu trang N95 ngay cả trong nhà nếu cần.",
        "Tìm kiếm sự chăm sóc y tế ngay lập tức nếu có triệu chứng."
      ],
      sensitive: [
        "Khẩn cấp - tránh tiếp xúc với không khí bên ngoài hoàn toàn.",
        "Di chuyển đến nơi có không khí sạch hơn nếu có thể.",
        "Liên hệ ngay với cơ sở y tế.",
        "Theo dõi sức khỏe liên tục và chuẩn bị sẵn sàng đi bệnh viện nếu cần."
      ]
    }
  }

  const recommendations = getHealthRecommendations(aqiValue)

  return (
    <div className="space-y-4">
      {/* Card AQI chính */}
      <Card className={`p-5 bg-gradient-to-br ${aqiInfo.gradient} border-0 shadow-lg`}>
        <div className="space-y-3">
          <div className="text-white/90 text-sm font-medium">
            {formatDate()} {locationName && `- ${locationName}`}
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-lg text-white font-bold">AQI</div>
              <div className="text-5xl font-bold text-white">{Math.round(aqiValue)}</div>
              <div className="text-sm text-white/80">
                PM 2.5 <span className="font-semibold">{(aqiValue * 0.5).toFixed(1)} μg/m³</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-7xl">{aqiInfo.emoji}</div>
              <div className="text-lg font-bold text-white mt-1">{aqiInfo.level}</div>
            </div>
          </div>
          <Button 
            onClick={() => setShowHealthDialog(true)}
            className="w-full bg-white/20 hover:bg-white/30 text-white border-white/40 backdrop-blur-sm"
            variant="outline"
          >
            <AlertCircle className="w-4 h-4 mr-2" />
            Khuyến cáo sức khỏe
          </Button>
        </div>
      </Card>

      {/* Dialog khuyến cáo sức khỏe */}
      <Dialog open={showHealthDialog} onOpenChange={setShowHealthDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${aqiInfo.gradient} flex items-center justify-center text-2xl`}>
                {aqiInfo.emoji}
              </div>
              Khuyến cáo sức khỏe
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <div className="text-sm text-slate-600">Chỉ số AQI hiện tại</div>
                <div className="text-2xl font-bold text-slate-800">{Math.round(aqiValue)}</div>
              </div>
              <div className={`px-4 py-2 rounded-full bg-gradient-to-br ${aqiInfo.gradient} text-white font-semibold`}>
                {aqiInfo.level}
              </div>
            </div>

            <Tabs defaultValue="normal" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="normal">Đối tượng bình thường</TabsTrigger>
                <TabsTrigger value="sensitive">Nhạy cảm</TabsTrigger>
              </TabsList>
              
              <TabsContent value="normal" className="space-y-3 mt-4">
                <div className="text-sm font-semibold text-slate-700 mb-2">
                  Đối tượng: Người khỏe mạnh, không có vấn đề về hô hấp
                </div>
                <ul className="space-y-2">
                  {recommendations.general.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
              
              <TabsContent value="sensitive" className="space-y-3 mt-4">
                <div className="text-sm font-semibold text-slate-700 mb-2">
                  Đối tượng: Trẻ em, người già, phụ nữ mang thai, người mắc bệnh hô hấp
                </div>
                <ul className="space-y-2">
                  {recommendations.sensitive.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-orange-600 mt-0.5">⚠</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Các thông số chi tiết */}
      <div className="grid grid-cols-2 gap-3">
        <TemperatureCard temp={temp} />
        <HumidityCard humidity={humidity} />
        <WindCard windSpeed={windSpeed} />
        <RainCard rainfall={0} />
      </div>
    </div>
  )
}
