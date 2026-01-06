import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Copy, Check } from "lucide-react"

interface GeoJSONFeature {
  type: string
  id?: number
  properties: {
    NAME_1: string
    ID_1: string
    [key: string]: any
  }
  geometry: {
    type: string
    coordinates: any
  }
}

interface GeoJSONData {
  type: string
  features: GeoJSONFeature[]
}

interface ProvinceAQI {
  provinceId: string
  provinceName: string
  avgAqi: number
}

interface VietnamMapProps {
  selectedProvinceId?: string
  selectedProvinceCommuneIds?: string[]
}

interface Popup {
  x: number
  y: number
  provinceName: string
  aqi?: number
}

const legendItems = [
  { color: "#16a34a", label: "Tốt (0-50)", range: [0, 50] },
  { color: "#ca8a04", label: "Trung bình (51-100)", range: [51, 100] },
  { color: "#ea580c", label: "Kém (101-150)", range: [101, 150] },
  { color: "#dc2626", label: "Xấu (151-200)", range: [151, 200] },
  { color: "#9333ea", label: "Rất xấu (201-300)", range: [201, 300] },
  { color: "#881337", label: "Nguy hại (>300)", range: [301, Infinity] },
]

// Convert GeoJSON coordinates to SVG path
const coordinatesToPath = (geometry: { type: string; coordinates: any }, bounds: any, provinceName?: string): string => {
  try {
    const width = 400
    const height = 600
    const padding = 20
    
    const projectPoint = (lon: number, lat: number) => {
      const x = ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * (width - 2 * padding) + padding
      const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * (height - 2 * padding) + padding
      return { x, y }
    }
    
    let allPaths: string[] = []
    let totalPoints = 0
    let polygonCount = 0
    
    if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach((polygon: any) => {
        polygon.forEach((ring: any) => {
          polygonCount++
          // Giữ tất cả điểm cho commune view, chỉ filter cho province view
          const shouldFilter = provinceName && ring.length > 100
          const filteredRing = shouldFilter ? ring.filter((_: any, i: number) => i % 4 === 0) : ring
          totalPoints += filteredRing.length
          
          const path = filteredRing
            .map((point: any, i: number) => {
              if (!Array.isArray(point) || point.length < 2) return ""
              const [lon, lat] = point
              const { x, y } = projectPoint(lon, lat)
              return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`
            })
            .filter(Boolean)
            .join(" ")
          if (path) allPaths.push(path + " Z")
        })
      })
    } else if (geometry.type === "Polygon") {
      geometry.coordinates.forEach((ring: any) => {
        polygonCount++
        // Giữ tất cả điểm cho commune view, chỉ filter cho province view
        const shouldFilter = provinceName && ring.length > 100
        const filteredRing = shouldFilter ? ring.filter((_: any, i: number) => i % 4 === 0) : ring
        totalPoints += filteredRing.length
        
        const path = filteredRing
          .map((point: any, i: number) => {
            if (!Array.isArray(point) || point.length < 2) return ""
            const [lon, lat] = point
            const { x, y } = projectPoint(lon, lat)
            return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`
          })
          .filter(Boolean)
          .join(" ")
        if (path) allPaths.push(path + " Z")
      })
    }
    
    const finalPath = allPaths.join(" ")
    
    return finalPath
  } catch (error) {
    console.error(`❌ Error converting coordinates${provinceName ? ` for ${provinceName}` : ''}:`, error)
    return ""
  }
}

export function VietnamMap({ selectedProvinceId, selectedProvinceCommuneIds }: VietnamMapProps = {}) {
  const [geoData, setGeoData] = useState<GeoJSONData | null>(null)
  const [communeGeoData, setCommuneGeoData] = useState<GeoJSONData | null>(null)
  const [provinceAQI, setProvinceAQI] = useState<Map<string, ProvinceAQI>>(new Map())
  const [communeAQI, setCommuneAQI] = useState<Map<string, number>>(new Map())
  const [hoveredProvince, setHoveredProvince] = useState<string | null>(null)
  const [popup, setPopup] = useState<Popup | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingCommune, setIsLoadingCommune] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [showIframe, setShowIframe] = useState(false)
  const [copied, setCopied] = useState(false)
  const [latestDate, setLatestDate] = useState<string>("")
  const [viewMode, setViewMode] = useState<'province' | 'commune'>('province')
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const iframeCode = `<iframe src="${typeof window !== 'undefined' ? window.location.origin : ''}" width="100%" height="600px" frameborder="0" style="border: none; border-radius: 8px;"></iframe>`

  useEffect(() => {
    let mounted = true
    
    const loadData = async () => {
      try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}${mm}${dd}`;
        const [geoRes, locationRes, aqiRes] = await Promise.all([
          fetch("/data/VN_level2.geojson"),
          fetch("/data/vietnam.csv"),
          fetch(`/data/aqi_forecast/${todayStr}.csv`),
        ])

        const [geoJson, locationCsv, aqiCsv] = await Promise.all([
          geoRes.json(),
          locationRes.text(),
          aqiRes.text(),
        ])

        if (!mounted) return

        const locationLines = locationCsv.trim().split("\n")
        const locationMap = new Map<string, string>()
        for (let i = 1; i < locationLines.length; i++) {
          const [id, , PID] = locationLines[i].split(",")
          if (id && PID) {
            locationMap.set(id.trim(), PID.trim())
          }
        }

        const aqiLines = aqiCsv.trim().split("\n")
        const communeAQIMap = new Map<string, number>()
        const communeTimes = new Map<string, string>()
        let latestTimeFound = ""

        for (let i = 1; i < aqiLines.length; i++) {
          const [commune_id, mean_aqi, time] = aqiLines[i].split(",")
          if (commune_id && mean_aqi && time) {
            const currentTime = communeTimes.get(commune_id)
            if (!currentTime || time < currentTime) {
              communeAQIMap.set(commune_id, parseFloat(mean_aqi))
              communeTimes.set(commune_id, time)
              if (!latestTimeFound || time > latestTimeFound) {
                latestTimeFound = time
              }
            }
          }
        }
        
        setLatestDate(latestTimeFound)
        setCommuneAQI(communeAQIMap)
        
        const provinceAQIMap = new Map<string, { sum: number; count: number }>()
        
        communeAQIMap.forEach((aqi, communeId) => {
          const provinceId = locationMap.get(communeId)
          if (provinceId) {
            const current = provinceAQIMap.get(provinceId) || { sum: 0, count: 0 }
            provinceAQIMap.set(provinceId, {
              sum: current.sum + aqi,
              count: current.count + 1,
            })
          }
        })

        const finalProvinceAQI = new Map<string, ProvinceAQI>()
        provinceAQIMap.forEach((value, provinceId) => {
          finalProvinceAQI.set(provinceId, {
            provinceId,
            provinceName: "",
            avgAqi: Math.round(value.sum / value.count),
          })
        })
        setGeoData(geoJson)
        setProvinceAQI(finalProvinceAQI)
        setIsLoading(false)
      } catch (err) {
        console.error("Error loading data:", err)
        setIsLoading(false)
      }
    }

    loadData()
    
    return () => {
      mounted = false
    }
  }, [])

  // Load GeoJSON của tỉnh được chọn khi chuyển sang chế độ xem xã
  useEffect(() => {
    let mounted = true
    
    const loadCommuneData = async () => {
      // Chỉ load khi có tỉnh được chọn và đang ở chế độ commune
      if (!selectedProvinceId || viewMode !== 'commune') {
        return
      }

      try {
        setIsLoadingCommune(true)
        console.log(`Loading commune GeoJSON for province: ${selectedProvinceId}`)
        const communeGeoRes = await fetch(`/data/geojson_commune/${selectedProvinceId}.geojson`)
        
        if (!communeGeoRes.ok) {
          throw new Error(`Failed to load commune data for province ${selectedProvinceId}`)
        }
        
        const communeGeoJson = await communeGeoRes.json()
        
        if (!mounted) return
        
        setCommuneGeoData(communeGeoJson)
        console.log(`Successfully loaded ${communeGeoJson.features?.length || 0} communes for province ${selectedProvinceId}`)
      } catch (err) {
        console.error(`Error loading commune data for province ${selectedProvinceId}:`, err)
        // Không set error state, chỉ log để user biết
        if (mounted) {
          setCommuneGeoData(null)
        }
      } finally {
        if (mounted) {
          setIsLoadingCommune(false)
        }
      }
    }

    loadCommuneData()
    
    return () => {
      mounted = false
    }
  }, [selectedProvinceId, viewMode])

  const getAQIColor = (aqi: number | undefined): string => {
    if (!aqi) return "#d1d5db"
    for (const item of legendItems) {
      if (aqi >= item.range[0] && aqi <= item.range[1]) {
        return item.color
      }
    }
    return "#d1d5db"
  }

  const bounds = useMemo(() => {
    if (!geoData || geoData.features.length === 0) {
      return { minLat: 0, maxLat: 1, minLon: 0, maxLon: 1 }
    }
    
    let minLat = Infinity, maxLat = -Infinity
    let minLon = Infinity, maxLon = -Infinity

    geoData.features.forEach((feature) => {
      const coords = feature.geometry.coordinates
      const flattenCoords = (arr: any[]): void => {
        arr.forEach((item) => {
          if (Array.isArray(item[0])) {
            flattenCoords(item)
          } else {
            const [lon, lat] = item
            minLat = Math.min(minLat, lat)
            maxLat = Math.max(maxLat, lat)
            minLon = Math.min(minLon, lon)
            maxLon = Math.max(maxLon, lon)
          }
        })
      }
      flattenCoords(coords)
    })

    return { minLat, maxLat, minLon, maxLon }
  }, [geoData])

  const provincePaths = useMemo(() => {
    if (!geoData) return []
    
    // Nếu đang ở commune mode và có tỉnh được chọn
    if (viewMode === 'commune' && selectedProvinceId && communeGeoData) {
      return []
    }
    
    const paths = geoData.features.map((feature, index) => {
      const provinceId = feature.properties.PID
      const provinceName = feature.properties.Name_vi
      const aqi = provinceAQI.get(provinceId.toString())?.avgAqi
      const path = coordinatesToPath(feature.geometry, bounds, provinceName)
      return {
        id: feature.id || index,
        provinceId,
        name: provinceName,
        path,
        aqi,
        color: getAQIColor(aqi),
      }
    })
    
    const validPaths = paths.filter(p => p.path.length > 0)
    return validPaths
  }, [geoData, provinceAQI, bounds, viewMode, selectedProvinceId, communeGeoData])

  const communePaths = useMemo(() => {
    if (!communeGeoData || viewMode !== 'commune' || !selectedProvinceCommuneIds || selectedProvinceCommuneIds.length === 0) {
      return []
    }
    
    // Match bằng ID từ danh sách các xã thuộc tỉnh đang chọn
    const communeIdSet = new Set(selectedProvinceCommuneIds)
    const filtered = communeGeoData.features.filter(feature => {
      return communeIdSet.has(feature.properties.id)
    })
    
    if (filtered.length === 0) {
      console.log('No communes matched. Available commune IDs in GeoJSON:', 
        communeGeoData.features.slice(0, 5).map(f => f.properties.id))
      console.log('Looking for commune IDs:', Array.from(communeIdSet).slice(0, 5))
      return []
    }

    // Tính bounds riêng cho các xã đã filter để chúng chiếm hết viewport
    let minLat = Infinity, maxLat = -Infinity
    let minLon = Infinity, maxLon = -Infinity

    filtered.forEach((feature) => {
      const coords = feature.geometry.coordinates
      const flattenCoords = (arr: any[]): void => {
        arr.forEach((item) => {
          if (Array.isArray(item[0])) {
            flattenCoords(item)
          } else {
            const [lon, lat] = item
            minLat = Math.min(minLat, lat)
            maxLat = Math.max(maxLat, lat)
            minLon = Math.min(minLon, lon)
            maxLon = Math.max(maxLon, lon)
          }
        })
      }
      flattenCoords(coords)
    })

    const communeBounds = { minLat, maxLat, minLon, maxLon }
    
    const paths = filtered.map((feature, index) => {
        const communeId = feature.properties.id  // Dùng id từ geojson, khớp với vietnam.csv
        const communeName = feature.properties.Name
        const aqi = communeAQI.get(communeId)
        const path = coordinatesToPath(feature.geometry, communeBounds, communeName)
        
        return {
          id: feature.id || `commune-${index}`,
          communeId,
          name: communeName,
          path,
          aqi,
          color: getAQIColor(aqi),
        }
      })
    
    const validPaths = paths.filter(p => p.path.length > 0)
    console.log(`Generated ${validPaths.length} valid commune paths`)
    return validPaths
  }, [communeGeoData, communeAQI, viewMode, selectedProvinceCommuneIds])

  const handleMouseMove = useCallback((e: React.MouseEvent, provinceName: string, aqi?: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setPopup({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        provinceName,
        aqi,
      })
    }
  }, [])

  const handleMouseLeave = useCallback(() => {
    setPopup(null)
    setHoveredProvince(null)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setZoom((prev) => Math.max(0.5, Math.min(5, prev * delta)))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }, [pan])

  const handleMouseMoveContainer = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }, [isDragging, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])
  const handleMapMouseEnter = useCallback(() => {
    // Tắt scroll trang khi chuột vào map
    document.body.style.overflow = 'hidden'
  }, [])

  const handleMapMouseLeave = useCallback(() => {
    // Bật lại scroll trang khi chuột ra khỏi map
    document.body.style.overflow = ''
  }, [])
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(5, prev * 1.2))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(0.5, prev / 1.2))
  }, [])

  const handleReset = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const handleSwitchToProvince = useCallback(() => {
    setViewMode('province')
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  const handleSwitchToCommune = useCallback(() => {
    if (selectedProvinceCommuneIds && selectedProvinceCommuneIds.length > 0) {
      setViewMode('commune')
      setZoom(2.5)
      setPan({ x: 0, y: -50 })
    }
  }, [selectedProvinceCommuneIds])

  const handleCopyIframe = useCallback(() => {
    navigator.clipboard.writeText(iframeCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [iframeCode])

  if (isLoading) {
    return (
      <Card className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-md h-full">
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-sm text-slate-500">Đang tải bản đồ...</div>
        </div>
      </Card>
    )
  }

  if (!geoData) {
    return (
      <Card className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-md h-full">
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-sm text-slate-500">Không thể tải bản đồ</div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-4 bg-white/90 backdrop-blur-sm border-0 shadow-md h-full">
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm font-semibold text-slate-700">
          Bản đồ AQI Việt Nam 
          {viewMode === 'commune' && selectedProvinceId && <span className="text-xs text-slate-500 ml-2">(Xem theo xã)</span>}
        </div>
        <div className="flex gap-1">
          {selectedProvinceId && (
            <>
              <button
                onClick={handleSwitchToProvince}
                className={`px-3 h-7 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                  viewMode === 'province' 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title="Xem theo tỉnh"
              >
                🗺️ Tỉnh
              </button>
              <button
                onClick={handleSwitchToCommune}
                className={`px-3 h-7 flex items-center justify-center rounded text-xs font-medium transition-colors ${
                  viewMode === 'commune' 
                    ? 'bg-blue-500 text-white hover:bg-blue-600' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                title="Xem theo xã"
              >
                📍 Xã
              </button>
            </>
          )}
          <button
            onClick={() => setShowIframe(!showIframe)}
            className="px-3 h-7 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors"
            title="Nhúng iframe"
          >
            {showIframe ? "Ẩn" : "Nhúng"}
          </button>
          <button
            onClick={handleZoomIn}
            className="w-7 h-7 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors"
            title="Phóng to"
          >
            +
          </button>
          <button
            onClick={handleZoomOut}
            className="w-7 h-7 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium transition-colors"
            title="Thu nhỏ"
          >
            −
          </button>
          <button
            onClick={handleReset}
            className="w-7 h-7 flex items-center justify-center rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-colors"
            title="Đặt lại"
          >
            ⟲
          </button>
        </div>
      </div>

      {showIframe && (
        <div className="mb-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600">Code để nhúng iframe:</span>
            <button
              onClick={handleCopyIframe}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-white hover:bg-slate-100 rounded border border-slate-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3" />
                  Đã copy
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy
                </>
              )}
            </button>
          </div>
          <pre className="text-xs bg-white p-2 rounded border border-slate-200 overflow-x-auto">
            <code>{iframeCode}</code>
          </pre>
        </div>
      )}

      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-lg bg-slate-50"
        style={{ 
          height: "500px", 
          cursor: isDragging ? "grabbing" : "grab",
          overscrollBehavior: "none"
        }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMoveContainer}
        onMouseUp={handleMouseUp}
        onMouseEnter={handleMapMouseEnter}
        onMouseLeave={(e) => {
          handleMouseUp()
          handleMapMouseLeave()
        }}
      >
        <svg
          ref={svgRef}
          viewBox="0 0 400 600"
          className="w-full h-auto"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.1s ease-out",
          }}
        >
          <g>
            {viewMode === 'province' && provincePaths.map((province) => {
              const isHovered = hoveredProvince === province.provinceId
              const hasHovered = hoveredProvince !== null

              return (
                <path
                  key={province.id}
                  d={province.path}
                  fill={isHovered ? "#3b82f6" : province.color}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  opacity={isHovered ? 1 : hasHovered ? 0.4 : 0.85}
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={(e) => {
                    setHoveredProvince(province.provinceId)
                    handleMouseMove(e, province.name, province.aqi)
                  }}
                  onMouseLeave={handleMouseLeave}
                  onMouseMove={(e) => handleMouseMove(e, province.name, province.aqi)}
                  style={{ vectorEffect: "non-scaling-stroke" }}
                />
              )
            })}
            
            {viewMode === 'commune' && !isLoadingCommune && communePaths.map((commune) => {
              const isHovered = hoveredProvince === commune.communeId
              const hasHovered = hoveredProvince !== null

              return (
                <path
                  key={commune.id}
                  d={commune.path}
                  fill={isHovered ? "#3b82f6" : commune.color}
                  stroke="#ffffff"
                  strokeWidth="0.5"
                  opacity={isHovered ? 1 : hasHovered ? 0.4 : 0.85}
                  className="transition-all duration-150 cursor-pointer"
                  onMouseEnter={(e) => {
                    setHoveredProvince(commune.communeId)
                    handleMouseMove(e, commune.name, commune.aqi)
                  }}
                  onMouseLeave={handleMouseLeave}
                  onMouseMove={(e) => handleMouseMove(e, commune.name, commune.aqi)}
                  style={{ vectorEffect: "non-scaling-stroke" }}
                />
              )
            })}
          </g>
        </svg>

        {isLoadingCommune && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
            <div className="text-sm text-slate-600">Đang tải dữ liệu xã...</div>
          </div>
        )}

        {popup && (
          <div
            className="absolute z-50 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 pointer-events-none border border-slate-200"
            style={{
              left: `${popup.x + 15}px`,
              top: `${popup.y}px`,
              maxWidth: "220px",
            }}
          >
            <div className="text-sm font-semibold text-slate-800">{popup.provinceName}</div>
            {popup.aqi ? (
              <div className="mt-2 pt-2 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">AQI:</span>
                  <span
                    className="px-2 py-0.5 rounded text-white font-medium text-xs"
                    style={{ backgroundColor: getAQIColor(popup.aqi) }}
                  >
                    {popup.aqi}
                  </span>
                  <span className="text-xs text-slate-500">
                    {popup.aqi <= 50 ? "Tốt" : 
                     popup.aqi <= 100 ? "Trung bình" : 
                     popup.aqi <= 150 ? "Kém" : 
                     popup.aqi <= 200 ? "Xấu" : 
                     popup.aqi <= 300 ? "Rất xấu" : "Nguy hại"}
                  </span>
                </div>
                {latestDate && (
                  <div className="text-xs text-slate-400 mt-1">{latestDate}</div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 mt-1">Chưa có dữ liệu AQI</div>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-slate-500 text-center">
        Lăn chuột để zoom • Kéo để di chuyển • Hover để xem AQI
        {latestDate && <span className="ml-2">• Dữ liệu: {latestDate}</span>}
      </div>

      <div className="mt-3 pt-3 border-t border-slate-200">
        <div className="text-sm font-medium text-slate-600 mb-2">Chỉ số AQI</div>
        <div className="space-y-1">
          {legendItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-6 h-3 rounded" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-slate-600">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
