"use client";

import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Search, MapPin, Navigation, Navigation2, Check, Loader2, Play, CircleAlert } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { searchLocations, getRoute, MapLocation } from "@/services/map.service";
import { Button } from "@/components/ui/button";

// Fix Leaflet marker icon asset pathing inside bundlers
if (typeof window !== "undefined") {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

// Subcomponent to adjust map focus dynamically
function ChangeMapCenter({ coords }: { coords: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, 13);
  }, [coords, map]);
  return null;
}

interface LeafletMapProps {
  onApplyRoute: (distanceKm: number, transportMode: string) => void | Promise<void>;
}

export default function LeafletMap({ onApplyRoute }: LeafletMapProps) {
  const [startQuery, setStartQuery] = useState("");
  const [endQuery, setEndQuery] = useState("");
  const [startSuggestions, setStartSuggestions] = useState<MapLocation[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<MapLocation[]>([]);

  const [startLoc, setStartLoc] = useState<MapLocation | null>(null);
  const [endLoc, setEndLoc] = useState<MapLocation | null>(null);

  const [isSearchingStart, setIsSearchingStart] = useState(false);
  const [isSearchingEnd, setIsSearchingEnd] = useState(false);

  const [routeGeometry, setRouteGeometry] = useState<[number, number][]>([]);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [isAddingRoute, setIsAddingRoute] = useState(false);

  const [selectedMode, setSelectedMode] = useState<string>("car");
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194]); // SF default

  // Geolocation speed states
  const [isTracking, setIsTracking] = useState(false);
  const [gpsSpeed, setGpsSpeed] = useState<number | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Simulation states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedSpeed, setSimulatedSpeed] = useState<number>(60); // 60 km/h base

  const getSuggestedMode = (speedKmh: number): string => {
    if (speedKmh <= 6) return "walking";
    if (speedKmh <= 25) return "cycling";
    if (speedKmh <= 80) return "car";
    return "train";
  };

  const suggestModeFromVelocity = (speedKmh: number) => {
    const suggested = getSuggestedMode(speedKmh);
    setSelectedMode(suggested);
  };

  // Start watching position
  const toggleGpsTracking = () => {
    if (isTracking) {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setIsTracking(false);
      setGpsSpeed(null);
    } else {
      if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
      }
      setIsSimulating(false); // Disable simulation when using real GPS
      setIsTracking(true);
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, speed } = pos.coords;
          
          // speed is in meters/second. Convert to km/h:
          const speedKmh = speed ? Number((speed * 3.6).toFixed(1)) : 0.0;
          setGpsSpeed(speedKmh);
          suggestModeFromVelocity(speedKmh);

          const localLoc: MapLocation = {
            name: `Live Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
            lat: latitude,
            lng: longitude,
          };
          setStartLoc(localLoc);
          setStartQuery(localLoc.name);
          setMapCenter([latitude, longitude]);
        },
        (err) => {
          console.error("GPS Watch Error:", err);
          setIsTracking(false);
          setGpsSpeed(null);
          alert("Could not access GPS coordinates. Try using the GPS Simulator instead.");
        },
        { enableHighAccuracy: true }
      );
      setWatchId(id);
    }
  };

  // GPS Simulation Handlers
  const handleSimulationSpeedChange = (speedVal: number) => {
    setSimulatedSpeed(speedVal);
    if (isSimulating) {
      suggestModeFromVelocity(speedVal);
    }
  };

  const toggleSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
    } else {
      // Clear real tracking
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
      }
      setIsTracking(false);
      setGpsSpeed(null);
      
      setIsSimulating(true);
      suggestModeFromVelocity(simulatedSpeed);
    }
  };

  // Geolocation static detection
  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const localLoc: MapLocation = {
          name: `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
          lat: latitude,
          lng: longitude,
        };
        setStartLoc(localLoc);
        setStartQuery(localLoc.name);
        setMapCenter([latitude, longitude]);
      },
      (err) => {
        console.error("Geolocation error:", err);
        alert("Unable to fetch current location. Please search manually.");
      }
    );
  };

  // Clean up watchers on unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Search start locations
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (startQuery.length > 2 && (!startLoc || startQuery !== startLoc.name)) {
        setIsSearchingStart(true);
        const results = await searchLocations(startQuery);
        setStartSuggestions(results);
        setIsSearchingStart(false);
      } else {
        setStartSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [startQuery, startLoc]);

  // Search end locations
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (endQuery.length > 2 && (!endLoc || endQuery !== endLoc.name)) {
        setIsSearchingEnd(true);
        const results = await searchLocations(endQuery);
        setEndSuggestions(results);
        setIsSearchingEnd(false);
      } else {
        setEndSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [endQuery, endLoc]);

  // Handle route calculation
  const calculateRoute = async () => {
    if (!startLoc || !endLoc) return;
    setIsCalculatingRoute(true);
    const result = await getRoute(startLoc.lat, startLoc.lng, endLoc.lat, endLoc.lng);
    setIsCalculatingRoute(false);

    if (result) {
      setRouteGeometry(result.geometry);
      setRouteDistance(result.distanceKm);
      setMapCenter([startLoc.lat, startLoc.lng]);
    } else {
      alert("Could not calculate route between selected locations.");
    }
  };

  const getActiveSpeed = (): number | null => {
    if (isTracking) return gpsSpeed;
    if (isSimulating) return simulatedSpeed;
    return null;
  };

  const currentSpeed = getActiveSpeed();

  const addRouteToDailyRecord = async () => {
    if (routeDistance === null) return;

    setIsAddingRoute(true);
    try {
      console.log("Distance:", routeDistance);
      console.log("Transport:", selectedMode);
      await onApplyRoute(routeDistance, selectedMode);
    } finally {
      setIsAddingRoute(false);
    }
  };

  return (
    <div className="bg-white border border-[#dcecf3] rounded-2xl p-5 shadow-sm space-y-4 select-none">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[#08171e] flex items-center gap-2 uppercase tracking-wider">
          <Navigation className="size-4.5 text-emerald-600 animate-pulse" />
          Commute Route & Telemetry Calculator
        </h3>
        
        {/* GPS Live Telemetry Pill */}
        <button
          type="button"
          onClick={toggleGpsTracking}
          className={`flex items-center gap-1 text-[10px] font-bold px-3 py-1 rounded-full border cursor-pointer transition-all ${
            isTracking
              ? "bg-red-500/10 border-red-500/20 text-red-600 animate-pulse"
              : "bg-white border-[#dcecf3] text-[#4d6673] hover:text-[#08171e]"
          }`}
        >
          <span className={`size-1.5 rounded-full ${isTracking ? "bg-red-500" : "bg-[#4d6673]"}`} />
          {isTracking ? "GPS Tracking ON" : "GPS Tracking OFF"}
        </button>
      </div>

      <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
        Map your journey manually or activate GPS Telemetry. The system recommends the closest transport mode for the trained prediction model.
      </p>

      {/* GPS Speed Simulator Card */}
      <div className="border border-[#dcecf3] bg-emerald-500/5 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-extrabold text-[#08171e] uppercase tracking-wider flex items-center gap-1.5">
            <Play className="size-3.5 text-emerald-600 fill-current" />
            GPS Telemetry Journey Simulator
          </h4>
          <button
            type="button"
            onClick={toggleSimulation}
            className={`text-[9.5px] font-black uppercase px-2.5 py-0.5 rounded cursor-pointer border ${
              isSimulating
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white border-[#dcecf3] text-[#4d6673] hover:text-[#08171e]"
            }`}
          >
            {isSimulating ? "Simulating" : "Start Sim"}
          </button>
        </div>

        <div className="space-y-2.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-muted-foreground">Velocity:</span>
            <span className="font-black text-[#042b44] bg-white px-2 py-0.5 rounded border border-[#dcecf3]">
              {currentSpeed !== null ? `${currentSpeed.toFixed(0)} km/h` : "Telemetry Offline"}
            </span>
          </div>

          {/* Preset buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: "Walk (4)", speed: 4 },
              { label: "Cycle (15)", speed: 15 },
              { label: "Car (65)", speed: 65 },
              { label: "Train (120)", speed: 120 },
            ].map((p) => (
              <button
                key={p.speed}
                type="button"
                onClick={() => {
                  if (!isSimulating) setIsSimulating(true);
                  handleSimulationSpeedChange(p.speed);
                }}
                className={`py-1 rounded text-center text-[9px] font-extrabold border cursor-pointer transition-all ${
                  isSimulating && simulatedSpeed === p.speed
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white border-[#dcecf3] text-muted-foreground hover:bg-[#f7fbfd]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Slider */}
          <div className="space-y-1">
            <input
              type="range"
              min="0"
              max="150"
              value={simulatedSpeed}
              onChange={(e) => handleSimulationSpeedChange(parseInt(e.target.value))}
              className="w-full h-1.5 bg-[#dcecf3] rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
              <span>0 km/h</span>
              <span>75 km/h</span>
              <span>150 km/h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Geocoding Input Panel */}
      <div className="space-y-3">
        {/* Start Point */}
        <div className="relative">
          <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Start Location
          </label>
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-muted-foreground/60">
                <MapPin className="size-3.5 text-emerald-500" />
              </span>
              <input
                type="text"
                value={startQuery}
                onChange={(e) => setStartQuery(e.target.value)}
                placeholder="Search start address..."
                className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-xl py-1.5 pl-8 pr-4 text-xs text-[#08171e] placeholder-muted-foreground/40 focus:outline-none focus:border-emerald-500 font-bold"
              />
              {isSearchingStart && (
                <span className="absolute right-2.5 top-2.5">
                  <Loader2 className="size-3 animate-spin text-muted-foreground" />
                </span>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={detectLocation}
              className="flex items-center gap-1 border-[#dcecf3] bg-white text-xs px-2.5 hover:bg-[#f7fbfd] text-muted-foreground font-bold rounded-xl cursor-pointer"
              title="Use current location"
            >
              <Navigation2 className="size-3 text-emerald-600" /> GPS
            </Button>
          </div>

          {/* Start Suggestions Dropdown */}
          {startSuggestions.length > 0 && (
            <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#dcecf3] rounded-xl shadow-lg max-h-48 overflow-y-auto p-1 divide-y divide-[#dcecf3]/40">
              {startSuggestions.map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => {
                    setStartLoc(item);
                    setStartQuery(item.name);
                    setStartSuggestions([]);
                    setMapCenter([item.lat, item.lng]);
                  }}
                  className="px-3 py-1.5 text-xs text-[#08171e] hover:bg-[#f7fbfd] rounded-lg cursor-pointer truncate font-bold"
                >
                  {item.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* End Point */}
        <div className="relative">
          <label className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Destination Location
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-muted-foreground/60">
              <MapPin className="size-3.5 text-red-500" />
            </span>
            <input
              type="text"
              value={endQuery}
              onChange={(e) => setEndQuery(e.target.value)}
              placeholder="Search destination address..."
              className="w-full bg-[#f7fbfd] border border-[#dcecf3] rounded-xl py-1.5 pl-8 pr-4 text-xs text-[#08171e] placeholder-muted-foreground/40 focus:outline-none focus:border-emerald-500 font-bold"
            />
            {isSearchingEnd && (
              <span className="absolute right-2.5 top-2.5">
                <Loader2 className="size-3 animate-spin text-muted-foreground" />
              </span>
            )}
          </div>

          {/* End Suggestions Dropdown */}
          {endSuggestions.length > 0 && (
            <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#dcecf3] rounded-xl shadow-lg max-h-48 overflow-y-auto p-1 divide-y divide-[#dcecf3]/40">
              {endSuggestions.map((item, idx) => (
                <li
                  key={idx}
                  onClick={() => {
                    setEndLoc(item);
                    setEndQuery(item.name);
                    setEndSuggestions([]);
                    setMapCenter([item.lat, item.lng]);
                  }}
                  className="px-3 py-1.5 text-xs text-[#08171e] hover:bg-[#f7fbfd] rounded-lg cursor-pointer truncate font-bold"
                >
                  {item.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Trigger Route Button */}
      <Button
        onClick={calculateRoute}
        className="w-full bg-[#042b44] hover:bg-emerald-600 text-white font-extrabold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 border-none shadow-sm cursor-pointer transition-colors duration-300"
        disabled={!startLoc || !endLoc || isCalculatingRoute}
      >
        {isCalculatingRoute ? (
          <>
            <Loader2 className="size-3.5 animate-spin" /> Calculating Path...
          </>
        ) : (
          "Calculate Route & Distance"
        )}
      </Button>

      {/* Map Rendering Container */}
      <div className="relative h-60 w-full rounded-2xl overflow-hidden border border-[#dcecf3] bg-[#f7fbfd] z-0">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeMapCenter coords={mapCenter} />

          {startLoc && (
            <Marker position={[startLoc.lat, startLoc.lng]}>
              <Popup>Start: {startLoc.name}</Popup>
            </Marker>
          )}

          {endLoc && (
            <Marker position={[endLoc.lat, endLoc.lng]}>
              <Popup>Destination: {endLoc.name}</Popup>
            </Marker>
          )}

          {routeGeometry.length > 0 && (
            <Polyline positions={routeGeometry} color="#10b981" weight={4} opacity={0.8} />
          )}
        </MapContainer>
      </div>

      {/* Route Output Results & Apply Actions */}
      {routeDistance !== null && (
        <div className="bg-[#f7fbfd] rounded-2xl p-4 border border-[#dcecf3] space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-muted-foreground">Calculated Distance:</span>
            <span className="font-black text-[#042b44] text-sm">{routeDistance} km</span>
          </div>

          {/* Mode Selector */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[9.5px] font-bold text-muted-foreground uppercase tracking-wider">
                Select Transport Mode
              </label>
              
              {currentSpeed !== null && (
                <span className="text-[9.5px] text-emerald-600 font-extrabold flex items-center gap-0.5">
                  <Check className="size-3 stroke-[3]" /> suggested mode: {getSuggestedMode(currentSpeed)}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-3 xs:grid-cols-6 gap-2">
              {[
                { id: "walking", label: "Walk" },
                { id: "cycling", label: "Cycle" },
                { id: "bike", label: "Motorcycle" },
                { id: "car", label: "Car" },
                { id: "bus", label: "Bus" },
                { id: "train", label: "Train" },
              ].map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSelectedMode(mode.id)}
                  className={`py-1 rounded text-center text-[10.5px] font-bold transition-all border cursor-pointer ${
                    selectedMode === mode.id
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500"
                      : "bg-white border-[#dcecf3] text-muted-foreground hover:text-[#08171e]"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={addRouteToDailyRecord}
            disabled={isAddingRoute}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer border-none shadow-sm transition-all"
          >
            {isAddingRoute ? (
              <>
                <Loader2 className="size-3.5 animate-spin" /> Adding to Daily Record...
              </>
            ) : (
              <>
                <Check className="size-3.5 stroke-[3px]" /> Add to Daily Tracking Record
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
