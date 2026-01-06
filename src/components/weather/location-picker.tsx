import { useState, useEffect, useMemo, ReactNode } from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MapPin, TrendingUp } from "lucide-react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { VietnamMap } from "./vietnam-map"

interface LocationData {
  id: string
  Name: string
  PID: string
  Name_vi: string
  Name_en: string
}

interface Province {
  id: string
  name: string
  nameEn: string
}

interface Commune {
  id: string
  name: string
  provinceId: string
}

interface AQIData {
  commune_id: string
  mean_aqi: number
  time: string
}

interface LocationPickerProps {
  onLocationChange?: (
    communeId: string, 
    communeName: string, 
    provinceName: string, 
    aqi?: number, 
    time?: string, 
    provinceId?: string, 
    provinceNameVi?: string,
    provinceAvgAqi?: number,
    provinceAvgTime?: string
  ) => void
  weatherCards?: ReactNode
  selectedProvinceId?: string
  selectedProvinceName?: string
}

export function LocationPicker({ onLocationChange, weatherCards, selectedProvinceId }: LocationPickerProps = {}) {
  const [provinces, setProvinces] = useState<Province[]>([])
  const [communes, setCommunes] = useState<Commune[]>([])
  const [filteredCommunes, setFilteredCommunes] = useState<Commune[]>([])
  const [selectedProvince, setSelectedProvince] = useState<string>("")
  const [selectedCommune, setSelectedCommune] = useState<string>("")
  const [aqiData, setAqiData] = useState<AQIData[]>([])
  const [currentAQI, setCurrentAQI] = useState<AQIData | null>(null)
  const [communeAQIHistory, setCommuneAQIHistory] = useState<AQIData[]>([])
  const [provinceAQIHistory, setProvinceAQIHistory] = useState<AQIData[]>([])
  const [isLoadingLocation, setIsLoadingLocation] = useState(true)
  const [provinceSearch, setProvinceSearch] = useState<string>("")
  const [communeSearch, setCommuneSearch] = useState<string>("")
  const [provinceOpen, setProvinceOpen] = useState(false)
  const [communeOpen, setCommuneOpen] = useState(false)
  // const provinceInputRef = useState<HTMLInputElement | null>(null)[0]
  // const communeInputRef = useState<HTMLInputElement | null>(null)[0]

  useEffect(() => {
    // Đọc file CSV và parse dữ liệu
    fetch("/data/vietnam.csv")
      .then((response) => response.text())
      .then((csvText) => {
        const lines = csvText.trim().split("\n")

        // Parse dữ liệu từ CSV
        const data: LocationData[] = lines.slice(1).map((line) => {
          const values = line.split(",")
          return {
            id: values[0]?.trim() || "",
            Name: values[1]?.trim() || "",
            PID: values[2]?.trim() || "",
            Name_vi: values[3]?.trim() || "",
            Name_en: values[4]?.trim() || "",
          }
        })

        // Lấy danh sách tỉnh duy nhất
        const provinceMap = new Map<string, Province>()
        data.forEach((item) => {
          if (!provinceMap.has(item.PID)) {
            provinceMap.set(item.PID, {
              id: item.PID,
              name: item.Name_vi.trim(),
              nameEn: item.Name_en.trim(),
            })
          }
        })

        // Lấy danh sách xã
        const communeList: Commune[] = data.map((item) => ({
          id: item.id,
          name: item.Name,
          provinceId: item.PID,
        }))

        setProvinces(Array.from(provinceMap.values()).sort((a, b) => a.name.localeCompare(b.name)))
        setCommunes(communeList)
      })
      .catch((error) => {
        console.error("Lỗi khi đọc file CSV:", error)
      })

    // Đọc file AQI data
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}${mm}${dd}`;
    console.log("Loading AQI data for date:", todayStr);
    const path = `/data/aqi_forecast/${todayStr}.csv`;
    fetch(path)
      .then((response) => response.text())
      .then((csvText) => {
        const lines = csvText.trim().split("\n")
        const data: AQIData[] = lines.slice(1).map((line) => {
          const values = line.split(",")
          return {
            commune_id: values[0],
            mean_aqi: parseFloat(values[1]),
            mean_pm25: parseFloat(values[2]),
            time: values[3],
          }
        })
        setAqiData(data)
        setIsLoadingLocation(false)
      })
      .catch((error) => {
        console.error("Lỗi khi đọc file AQI CSV:", error)
        setIsLoadingLocation(false)
      })
  }, [])

  // Tự động detect vị trí người dùng (chỉ chạy một lần khi load)
  useEffect(() => {
    if (communes.length > 0 && provinces.length > 0 && !selectedProvince && !selectedCommune && isLoadingLocation === false) {
      // Thử lấy vị trí từ browser
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords
            
            try {
              // Dùng reverse geocoding API để lấy tên tỉnh/thành
              const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
              )
              const data = await response.json()
            //   console.log(provinces)
              // Lấy tên tỉnh/thành từ kết quả
              const cityName = data.address?.city || 
                              data.address?.province || 
                              data.address?.state ||
                              data.address?.county
              if (cityName) {
                const trimmedCity = cityName.trim().normalize('NFC')
                // Tìm tỉnh khớp với tên
                const matchedProvince = provinces.find(p => {
                  const normalizedName = p.name.normalize('NFC')
                  const normalizedNameEn = p.nameEn.normalize('NFC')
                  const match = normalizedName.toLowerCase().includes(trimmedCity.toLowerCase()) ||
                    trimmedCity.toLowerCase().includes(normalizedName.toLowerCase()) ||
                    normalizedNameEn.toLowerCase().includes(trimmedCity.toLowerCase())
                //   console.log(`Comparing "${trimmedCity}" with province "${normalizedName}" (${normalizedNameEn}): ${match}`)
                  return match
                })
                // console.log("Final matched province:",matchedProvince)
                if (matchedProvince) {
                //   console.log(`Detected location: ${cityName} -> ${matchedProvince.name}`)
                  setSelectedProvince(matchedProvince.id)
                  const communesInProvince = communes.filter(c => c.provinceId === matchedProvince.id)
                  if (communesInProvince.length > 0) {
                    setSelectedCommune(communesInProvince[0].id)
                  }
                  return
                }
              }
            } catch (error) {
              console.error("Error getting location name:", error)
            }
            
            // Nếu không match được, chọn Hà Nội mặc định
            const defaultProvinceId = "17" // Hà Nội
            setSelectedProvince(defaultProvinceId)
            const communesInProvince = communes.filter(c => c.provinceId === defaultProvinceId)
            if (communesInProvince.length > 0) {
              setSelectedCommune(communesInProvince[0].id)
            }
          },
          () => {
            // Nếu không cho phép location, chọn mặc định Hà Nội
            const defaultProvinceId = "17"
            setSelectedProvince(defaultProvinceId)
            const communesInProvince = communes.filter(c => c.provinceId === defaultProvinceId)
            if (communesInProvince.length > 0) {
              setSelectedCommune(communesInProvince[0].id)
            }
          }
        )
      } else {
        // Trình duyệt không hỗ trợ geolocation, chọn mặc định Hà Nội
        const defaultProvinceId = "17"
        setSelectedProvince(defaultProvinceId)
        const communesInProvince = communes.filter(c => c.provinceId === defaultProvinceId)
        if (communesInProvince.length > 0) {
          setSelectedCommune(communesInProvince[0].id)
        }
      }
    }
  }, [communes, provinces, selectedCommune, isLoadingLocation])

  // Lọc xã theo tỉnh được chọn
  useEffect(() => {
    if (selectedProvince) {
      const filtered = communes.filter((c) => c.provinceId === selectedProvince)
      setFilteredCommunes(filtered.sort((a, b) => a.name.localeCompare(b.name)))
      // Tự động chọn xã đầu tiên khi chọn tỉnh mới
      if (filtered.length > 0) {
        setSelectedCommune(filtered[0].id)
      }
    } else {
      setFilteredCommunes([])
    }
  }, [selectedProvince, communes])

  // Cập nhật AQI khi chọn xã
  useEffect(() => {
    if (selectedCommune && aqiData.length > 0) {
      // Lấy tất cả dữ liệu AQI cho xã được chọn
      const communeAQI = aqiData.filter((aqi) => aqi.commune_id === selectedCommune)
      if (communeAQI.length > 0) {
        // Sắp xếp theo thời gian tăng dần để hiển thị biểu đồ
        const sortedAQI = communeAQI.sort((a, b) => 
          new Date(a.time).getTime() - new Date(b.time).getTime()
        )
        setCommuneAQIHistory(sortedAQI)
        // Lấy bản ghi sớm nhất
        setCurrentAQI(sortedAQI[0])
      } else {
        setCommuneAQIHistory([])
        setCurrentAQI(null)
      }
    } else {
      setCommuneAQIHistory([])
      setCurrentAQI(null)
    }
  }, [selectedCommune, aqiData])

  // Cập nhật AQI trung bình của tỉnh
  useEffect(() => {
    if (selectedProvince && aqiData.length > 0 && communes.length > 0) {
      // Lấy tất cả các xã trong tỉnh
      const communesInProvince = communes.filter(c => c.provinceId === selectedProvince)
      const communeIds = communesInProvince.map(c => c.id)
      
      // Lấy tất cả dữ liệu AQI của các xã trong tỉnh
      const provinceAQI = aqiData.filter(aqi => communeIds.includes(aqi.commune_id))
      
      if (provinceAQI.length > 0) {
        // Group by time và tính trung bình
        const timeMap = new Map<string, number[]>()
        provinceAQI.forEach(aqi => {
          if (!timeMap.has(aqi.time)) {
            timeMap.set(aqi.time, [])
          }
          timeMap.get(aqi.time)!.push(aqi.mean_aqi)
        })
        
        // Tính trung bình cho mỗi time
        const avgAQI: AQIData[] = Array.from(timeMap.entries()).map(([time, values]) => ({
          commune_id: selectedProvince, // Sử dụng province id
          mean_aqi: values.reduce((sum, val) => sum + val, 0) / values.length,
          time: time
        }))
        
        // Sắp xếp theo thời gian
        const sortedAvgAQI = avgAQI.sort((a, b) => 
          new Date(a.time).getTime() - new Date(b.time).getTime()
        )
        setProvinceAQIHistory(sortedAvgAQI)
      } else {
        setProvinceAQIHistory([])
      }
    } else {
      setProvinceAQIHistory([])
    }
  }, [selectedProvince, aqiData, communes])

  // Notify parent component khi location thay đổi
  useEffect(() => {
    if (selectedCommune && onLocationChange) {
      const communeName = getSelectedCommuneName()
      const provinceName = getSelectedProvinceName()
      const province = provinces.find((p) => p.id === selectedProvince)
      
      // Lấy AQI hiện tại của xã
      const communeAQI = currentAQI
      
      // Lấy AQI sớm nhất của tỉnh (earliest)
      const provinceAvgAQI = provinceAQIHistory.length > 0 
        ? provinceAQIHistory[0] 
        : null
      
      onLocationChange(
        selectedCommune,
        communeName,
        provinceName,
        communeAQI?.mean_aqi,
        communeAQI?.time,
        selectedProvince,
        province?.name,
        provinceAvgAQI?.mean_aqi,
        provinceAvgAQI?.time
      )
    }
  }, [selectedCommune, currentAQI, provinceAQIHistory])

  const getSelectedProvinceName = () => {
    const province = provinces.find((p) => p.id === selectedProvince)
    return province?.name || "Chọn tỉnh/thành"
  }

  const getSelectedCommuneName = () => {
    const commune = communes.find((c) => c.id === selectedCommune)
    return commune?.name || "Chọn xã/phường"
  }


  // Filter provinces based on search
  const filteredProvinces = useMemo(() => {
    if (!provinceSearch) return provinces
    const search = provinceSearch.toLowerCase().normalize('NFC')
    return provinces.filter(p => 
      p.name.toLowerCase().normalize('NFC').includes(search) ||
      p.nameEn.toLowerCase().normalize('NFC').includes(search)
    )
  }, [provinces, provinceSearch])

  // Filter communes based on search
  const searchedCommunes = useMemo(() => {
    if (!communeSearch) return filteredCommunes
    const search = communeSearch.toLowerCase().normalize('NFC')
    return filteredCommunes.filter(c => 
      c.name.toLowerCase().normalize('NFC').includes(search)
    )
  }, [filteredCommunes, communeSearch])

  // Chart data cho tỉnh
  const provinceChartData = useMemo(() => {
    return provinceAQIHistory.map((item) => ({
      date: new Date(item.time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      aqi: item.mean_aqi,
      fullDate: item.time,
    }))
  }, [provinceAQIHistory])

  // Chart data cho xã
  const communeChartData = useMemo(() => {
    return communeAQIHistory.map((item) => ({
      date: new Date(item.time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      aqi: item.mean_aqi,
      fullDate: item.time,
    }))
  }, [communeAQIHistory])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Cột trái: Chọn địa điểm và Biểu đồ */}
      <div className="space-y-4">
        {/* Card chọn tỉnh */}
        <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
          <div className="inline-flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-semibold text-gray-800">Chọn Tỉnh/Thành phố</h3>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Tỉnh/Thành phố</label>
            <Select 
              value={selectedProvince} 
              onValueChange={(value) => {
                setSelectedProvince(value)
                setProvinceOpen(false)
                setProvinceSearch("")
              }}
              open={provinceOpen}
              onOpenChange={setProvinceOpen}
            >
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Chọn tỉnh/thành" />
              </SelectTrigger>
              <SelectContent 
                onPointerDownOutside={(e) => {
                  const target = e.target as HTMLElement
                  if (target.tagName === 'INPUT') {
                    e.preventDefault()
                  }
                }}
              >
                <SelectGroup>
                  <div className="px-2 py-2 sticky top-0 bg-white z-10" onMouseDown={(e) => e.preventDefault()}>
                    <input
                      ref={(el) => {
                        if (el && provinceOpen) {
                          setTimeout(() => el.focus(), 0)
                        }
                      }}
                      type="text"
                      placeholder="Tìm kiếm tỉnh/thành..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={provinceSearch}
                      onChange={(e) => {
                        setProvinceSearch(e.target.value)
                        e.target.focus()
                      }}
                      onKeyDown={(e) => {
                        e.stopPropagation()
                        if (e.key === 'Escape') {
                          setProvinceOpen(false)
                        }
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                  <SelectLabel>
                    {filteredProvinces.length > 0 
                      ? `Tỉnh/Thành phố (${filteredProvinces.length})`
                      : "Không tìm thấy kết quả"}
                  </SelectLabel>
                  {filteredProvinces.map((province) => (
                    <SelectItem key={province.id} value={province.id}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Thông tin thời tiết */}
        {selectedProvince && weatherCards && (
          <div>
            {weatherCards}
          </div>
        )}

        {/* Biểu đồ AQI trung bình của tỉnh */}
        {selectedProvince && provinceChartData.length > 0 && (
          <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-800">
                Dự báo AQI - {getSelectedProvinceName()}
              </h3>
            </div>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={provinceChartData}>
                  <defs>
                    <linearGradient id="colorProvinceAQI" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    stroke="#6b7280"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value: number) => [value.toFixed(0), 'AQI']}
                    labelFormatter={(label) => `Ngày: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="aqi"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#colorProvinceAQI)"
                    dot={{ r: 3, fill: '#3b82f6' }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Card chọn xã */}
        {selectedProvince && (
          <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-4 h-4 text-green-600" />
              <h3 className="text-base font-semibold text-gray-800">Chọn Xã/Phường</h3>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Xã/Phường/Thị trấn</label>
              <Select
                value={selectedCommune}
                onValueChange={(value) => {
                  setSelectedCommune(value)
                  setCommuneOpen(false)
                  setCommuneSearch("")
                }}
                disabled={!selectedProvince}
                open={communeOpen}
                onOpenChange={setCommuneOpen}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="Chọn xã/phường" />
                </SelectTrigger>
                <SelectContent
                  onPointerDownOutside={(e) => {
                    const target = e.target as HTMLElement
                    if (target.tagName === 'INPUT') {
                      e.preventDefault()
                    }
                  }}
                >
                  <SelectGroup>
                    {selectedProvince && (
                      <div className="px-2 py-2 sticky top-0 bg-white z-10" onMouseDown={(e) => e.preventDefault()}>
                        <input
                          ref={(el) => {
                            if (el && communeOpen) {
                              setTimeout(() => el.focus(), 0)
                            }
                          }}
                          type="text"
                          placeholder="Tìm kiếm xã/phường..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={communeSearch}
                          onChange={(e) => {
                            setCommuneSearch(e.target.value)
                            e.target.focus()
                          }}
                          onKeyDown={(e) => {
                            e.stopPropagation()
                            if (e.key === 'Escape') {
                              setCommuneOpen(false)
                            }
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          onFocus={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>
                    )}
                    <SelectLabel>
                      {searchedCommunes.length > 0
                        ? `Xã/Phường (${searchedCommunes.length})`
                        : selectedProvince ? "Không tìm thấy kết quả" : "Vui lòng chọn tỉnh trước"}
                    </SelectLabel>
                    {searchedCommunes.map((commune) => (
                      <SelectItem key={commune.id} value={commune.id}>
                        {commune.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Biểu đồ AQI của xã */}
        {selectedCommune && communeChartData.length > 0 && (
          <div className="p-4 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-semibold text-gray-800">
                Dự báo AQI - {getSelectedCommuneName()}
              </h3>
            </div>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={communeChartData}>
                  <defs>
                    <linearGradient id="colorCommuneAQI" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }}
                    stroke="#6b7280"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    }}
                    formatter={(value: number) => [value.toFixed(0), 'AQI']}
                    labelFormatter={(label) => `Ngày: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="aqi"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#colorCommuneAQI)"
                    dot={{ r: 3, fill: '#10b981' }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Chú thích */}
        {(provinceChartData.length > 0 || communeChartData.length > 0) && (
          <div className="p-3 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-[10px] text-gray-600">Tốt (0-50)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span className="text-[10px] text-gray-600">TB (51-100)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                <span className="text-[10px] text-gray-600">Kém (101-150)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-[10px] text-gray-600">Xấu (151-200)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                <span className="text-[10px] text-gray-600">Rất xấu (201-300)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-rose-900"></div>
                <span className="text-[10px] text-gray-600">Nguy hại (300+)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cột phải: Map Việt Nam */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <VietnamMap 
          selectedProvinceId={selectedProvinceId}
          selectedProvinceCommuneIds={filteredCommunes.map(c => c.id)}
        />
      </div>
    </div>
  )
}

// Export riêng component biểu đồ để sử dụng ở nơi khác
export function AQIChart({ 
  communeId, 
  communeName 
}: { 
  communeId?: string
  communeName?: string 
}) {
  const [aqiData, setAqiData] = useState<AQIData[]>([])
  const [communeAQIHistory, setCommuneAQIHistory] = useState<AQIData[]>([])

  useEffect(() => {
    // Đọc file AQI data
    fetch("/data/aqi_forecast/aqi_data.csv")
      .then((response) => response.text())
      .then((csvText) => {
        const lines = csvText.trim().split("\n")
        const data: AQIData[] = lines.slice(1).map((line) => {
          const values = line.split(",")
          return {
            commune_id: values[0],
            mean_aqi: parseFloat(values[1]),
            time: values[2],
          }
        })
        setAqiData(data)
      })
      .catch((error) => {
        console.error("Lỗi khi đọc file AQI CSV:", error)
      })
  }, [])

  useEffect(() => {
    if (communeId && aqiData.length > 0) {
      const communeAQI = aqiData.filter((aqi) => aqi.commune_id === communeId)
      if (communeAQI.length > 0) {
        const sortedAQI = communeAQI.sort((a, b) => 
          new Date(a.time).getTime() - new Date(b.time).getTime()
        )
        setCommuneAQIHistory(sortedAQI)
      } else {
        setCommuneAQIHistory([])
      }
    } else {
      setCommuneAQIHistory([])
    }
  }, [communeId, aqiData])

  const chartData = useMemo(() => {
    return communeAQIHistory.map((item) => ({
      date: new Date(item.time).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      aqi: item.mean_aqi,
      fullDate: item.time,
    }))
  }, [communeAQIHistory])

  if (!communeId || chartData.length === 0) {
    return null
  }

  return (
    <div className="p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/20">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-800">
          Dự báo AQI {communeName ? `- ${communeName}` : ''}
        </h3>
      </div>
    </div>
  )
}
