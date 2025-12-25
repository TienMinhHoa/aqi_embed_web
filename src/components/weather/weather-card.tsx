import { Cloud, Sun, CloudRain, CloudSnow, CloudDrizzle, Wind, Loader2 } from "lucide-react"

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
}

export function WeatherCard({ weatherData, isLoading, locationName }: WeatherCardProps) {
  // WMO Weather interpretation codes
  const getWeatherIcon = (weatherCode?: number) => {
    if (!weatherCode) return <Sun className="w-10 h-10 text-white" />
    
    if (weatherCode === 0 || weatherCode === 1) return <Sun className="w-10 h-10 text-white" />
    if (weatherCode === 2 || weatherCode === 3) return <Cloud className="w-10 h-10 text-white" />
    if (weatherCode >= 51 && weatherCode <= 55) return <CloudDrizzle className="w-10 h-10 text-white" />
    if (weatherCode >= 61 && weatherCode <= 65) return <CloudRain className="w-10 h-10 text-white" />
    if (weatherCode >= 71 && weatherCode <= 77) return <CloudSnow className="w-10 h-10 text-white" />
    if (weatherCode >= 80 && weatherCode <= 82) return <CloudRain className="w-10 h-10 text-white" />
    if (weatherCode >= 95) return <CloudDrizzle className="w-10 h-10 text-white" />
    if (weatherCode === 45 || weatherCode === 48) return <Wind className="w-10 h-10 text-white" />
    return <Sun className="w-10 h-10 text-white" />
  }

  const getWeatherGradient = (weatherCode?: number) => {
    if (!weatherCode) return "from-amber-300 to-amber-500"
    
    if (weatherCode === 0 || weatherCode === 1) return "from-amber-300 to-amber-500"
    if (weatherCode === 2 || weatherCode === 3) return "from-slate-300 to-slate-500"
    if (weatherCode >= 51 && weatherCode <= 55) return "from-blue-200 to-blue-400"
    if (weatherCode >= 61 && weatherCode <= 65) return "from-blue-400 to-blue-600"
    if (weatherCode >= 71 && weatherCode <= 77) return "from-cyan-200 to-cyan-400"
    if (weatherCode >= 80 && weatherCode <= 82) return "from-blue-500 to-blue-700"
    if (weatherCode >= 95) return "from-indigo-400 to-indigo-700"
    if (weatherCode === 45 || weatherCode === 48) return "from-gray-300 to-gray-500"
    return "from-amber-300 to-amber-500"
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <div className="text-sm text-slate-600">Đang tải...</div>
      </div>
    )
  }

  const temp = weatherData?.temp ?? 28
  const feelsLike = weatherData?.feels_like ?? 31
  const description = weatherData?.description ?? "Chủ yếu là nắng"
  const tempMin = weatherData?.temp_min ?? 25
  const tempMax = weatherData?.temp_max ?? 32
  const windSpeed = weatherData?.wind_speed ?? 5
  const humidity = weatherData?.humidity ?? 70

  return (
    <div className="space-y-3">
      {/* Thời tiết chính */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className={`w-16 h-16 bg-gradient-to-br ${getWeatherGradient(weatherData?.weather_code)} rounded-full flex items-center justify-center shadow-md`}>
            {getWeatherIcon(weatherData?.weather_code)}
          </div>
        </div>
        <div>
          <div className="text-3xl font-bold text-slate-800">{temp}°C</div>
          <div className="text-sm text-slate-600">{description}</div>
          {locationName && (
            <div className="text-xs text-slate-400">📍 {locationName}</div>
          )}
        </div>
      </div>

      {/* Thông tin chi tiết */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-500">🌡️ Cao nhất:</div>
          <div className="text-sm font-semibold text-red-600">{tempMax}°C</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-500">❄️ Thấp nhất:</div>
          <div className="text-sm font-semibold text-blue-600">{tempMin}°C</div>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="w-3 h-3 text-slate-500" />
          <div className="text-xs text-slate-500">Gió:</div>
          <div className="text-sm font-semibold text-slate-700">{windSpeed} m/s</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-slate-500">💧 Độ ẩm:</div>
          <div className="text-sm font-semibold text-slate-700">{humidity}%</div>
        </div>
        <div className="flex items-center gap-2 col-span-2">
          <div className="text-xs text-slate-500">🌡️ Cảm giác:</div>
          <div className="text-sm font-semibold text-slate-700">{feelsLike}°C</div>
        </div>
      </div>
    </div>
  )
}
