import { supabase } from "../utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'; // Import Leaflet components
import 'leaflet/dist/leaflet.css'; // Import Leaflet CSS
import L from 'leaflet'; // Import Leaflet for marker icons
import markerIcon from 'leaflet/dist/images/marker-icon.png'; // Import marker icon
import markerShadow from 'leaflet/dist/images/marker-shadow.png'; // Import marker shadow
import {
  MapPin,
  Navigation,
  Clock,
  Activity,
  Wifi,
  WifiOff,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Search,
  Filter,
  Circle,
  Users,
  TrendingUp,
  Navigation2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
=======
import { useState, useEffect, useRef } from "react";
import { supabase } from "../utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Slider } from "./ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { MapContainer, TileLayer, Marker, Popup, Circle as LeafletCircle, useMap } from 'react-leaflet'; // Added Circle and useMap
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import {
  MapPin,
  Navigation,
  Clock,
  Activity,
  Wifi,
  WifiOff,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Search,
  Circle,
  Users,
  TrendingUp,
  Navigation2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
