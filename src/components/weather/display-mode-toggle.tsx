import { Card } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { MapPin, Building2 } from "lucide-react"

interface DisplayModeToggleProps {
  value: "province" | "commune"
  onChange: (value: "province" | "commune") => void
}

export function DisplayModeToggle({ value, onChange }: DisplayModeToggleProps) {
  return (
    <Card className="p-4 backdrop-blur-sm bg-white/80 shadow-lg">
      <div className="flex items-center justify-center gap-4">
        <span className="text-sm font-medium text-slate-700">Chế độ hiển thị:</span>
        <ToggleGroup 
          type="single" 
          value={value}
          onValueChange={(newValue) => {
            if (newValue) onChange(newValue as "province" | "commune")
          }}
          variant="outline"
          className="bg-slate-50 border border-slate-200"
        >
          <ToggleGroupItem 
            value="province" 
            aria-label="Hiển thị theo tỉnh"
            className="px-6 py-2 data-[state=on]:bg-blue-500 data-[state=on]:text-white"
          >
            <Building2 className="w-4 h-4 mr-2" />
            Hiển thị theo tỉnh
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="commune" 
            aria-label="Hiển thị theo xã"
            className="px-6 py-2 data-[state=on]:bg-blue-500 data-[state=on]:text-white"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Hiển thị theo xã
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </Card>
  )
}
