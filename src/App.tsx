import { useState } from "react"
import { Header } from "@/components/weather/header"
import { WeatherCard } from "@/components/weather/weather-card"
import { LocationPicker } from "@/components/weather/location-picker"

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

function App() {
  const [selectedLocation, setSelectedLocation] = useState<{
    communeId: string
    communeName: string
    provinceName: string
    provinceId?: string
  } | null>(null)
  const [currentProvince, setCurrentProvince] = useState<string>("")
  const [currentProvinceId, setCurrentProvinceId] = useState<string>("")
  const [currentProvinceName, setCurrentProvinceName] = useState<string>("")  // Tên tỉnh tiếng Việt
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [isLoadingWeather, setIsLoadingWeather] = useState(false)
  const [aqiData, setAqiData] = useState<{ aqi: number; time: string } | null>(null)
  const [provinceAQI, setProvinceAQI] = useState<{ aqi: number; time: string } | null>(null)  // AQI trung bình tỉnh

  const handleLocationChange = (
    communeId: string, 
    communeName: string, 
    provinceName: string, 
    aqi?: number, 
    time?: string, 
    provinceId?: string,
    provinceNameVi?: string,
    provinceAvgAqi?: number,
    provinceAvgTime?: string
  ) => {
    setSelectedLocation({ communeId, communeName, provinceName, provinceId })
    
    // Lưu tên tỉnh tiếng Việt
    if (provinceNameVi) {
      setCurrentProvinceName(provinceNameVi)
    }
    
    // Lưu provinceId nếu có
    if (provinceId && provinceId !== currentProvinceId) {
      setCurrentProvinceId(provinceId)
    }
    
    // Lưu AQI trung bình của tỉnh
    if (provinceAvgAqi !== undefined && provinceAvgTime) {
      setProvinceAQI({ aqi: provinceAvgAqi, time: provinceAvgTime })
    }
    
    // Chỉ fetch weather khi tỉnh thay đổi
    if (provinceName !== currentProvince) {
      setCurrentProvince(provinceName)
      fetchWeatherData(provinceName)
    }
    
    if (aqi !== undefined && time) {
      setAqiData({ aqi, time })
    } else {
      setAqiData(null)
    }
  }

  const fetchWeatherData = async (locationName: string) => {
    setIsLoadingWeather(true)
    try {
      // Bước 1: Sử dụng OpenStreetMap Nominatim API để lấy tọa độ
      const geoResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationName)},Vietnam&format=json&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'WeatherApp/1.0'
          }
        }
      )
      const geoData = await geoResponse.json()
      
      if (geoData.length > 0) {
        const { lat, lon } = geoData[0]
        console.log(`Found coordinates for ${locationName}: ${lat}, ${lon}`)
        
        // Bước 2: Sử dụng OpenWeatherMap API để lấy dự báo thời tiết 9 ngày
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY
        const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&mode=json&cnt=9&units=metric&appid=${apiKey}`
        
        const weatherResponse = await fetch(weatherUrl)
        const weatherData = await weatherResponse.json()
        
        if (weatherData.cod === "200" && weatherData.list && weatherData.list.length > 0) {
          const today = weatherData.list[0]
          
          // Weather description mapping
          const getWeatherDescription = (weatherId: number): string => {
            if (weatherId >= 200 && weatherId < 300) return "Giông bão"
            if (weatherId >= 300 && weatherId < 400) return "Mưa phùn"
            if (weatherId >= 500 && weatherId < 600) {
              if (weatherId === 500) return "Mưa nhẹ"
              if (weatherId === 501) return "Mưa vừa"
              if (weatherId >= 502) return "Mưa nặng hạt"
              return "Mưa"
            }
            if (weatherId >= 600 && weatherId < 700) return "Tuyết"
            if (weatherId >= 700 && weatherId < 800) return "Sương mù"
            if (weatherId === 800) return "Trời quang đãng"
            if (weatherId === 801) return "Có mây một phần"
            if (weatherId === 802) return "Có mây"
            if (weatherId >= 803) return "U ám"
            return today.weather[0].description
          }
          
          const weatherId = today.weather[0].id
          
          // Chọn nhiệt độ hiện tại dựa trên thời gian trong ngày
          const currentHour = new Date().getHours()
          let currentTemp = today.temp.day
          let currentFeelsLike = today.feels_like.day
          
          if (currentHour >= 6 && currentHour < 12) {
            currentTemp = today.temp.morn
            currentFeelsLike = today.feels_like.morn
          } else if (currentHour >= 12 && currentHour < 18) {
            currentTemp = today.temp.day
            currentFeelsLike = today.feels_like.day
          } else if (currentHour >= 18 && currentHour < 22) {
            currentTemp = today.temp.eve
            currentFeelsLike = today.feels_like.eve
          } else {
            currentTemp = today.temp.night
            currentFeelsLike = today.feels_like.night
          }
          
          setWeatherData({
            temp: Math.round(currentTemp),
            feels_like: Math.round(currentFeelsLike),
            humidity: today.humidity,
            description: getWeatherDescription(weatherId),
            wind_speed: today.speed,
            pressure: today.pressure,
            weather_code: weatherId,
            temp_min: Math.round(today.temp.min),
            temp_max: Math.round(today.temp.max)
          })
          
          console.log('Weather data loaded successfully from OpenWeatherMap')
        } else {
          console.warn('Không thể lấy dữ liệu thời tiết')
        }
      } else {
        console.warn(`Không tìm thấy tọa độ cho: ${locationName}`)
      }
    } catch (error) {
      console.error('Lỗi khi lấy dữ liệu thời tiết:', error)
    } finally {
      setIsLoadingWeather(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-slate-100">
      <div className="container mx-auto px-4 py-6">
        <Header />

        {/* Location Picker với Weather Cards */}
        <div className="mb-6">
          <LocationPicker 
            onLocationChange={handleLocationChange}
            weatherCards={
              selectedLocation ? (
                <div className="space-y-4">
                  {/* Weather Info - Full width */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md p-4 border border-white/20">
                    <WeatherCard 
                      weatherData={weatherData}
                      isLoading={isLoadingWeather}
                      locationName={selectedLocation?.provinceName}
                      aqi={provinceAQI?.aqi}
                    />
                  </div>
                </div>
              ) : null
            }
            selectedProvinceId={currentProvinceId}
          />
        </div>
      </div>
    </div>
  )
}

export default App
