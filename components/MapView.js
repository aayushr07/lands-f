// components/MapView.js

"use client";

import { useEffect } from "react";

const MapView = ({ lat = 20.5937, lng = 78.9629 }) => {
  useEffect(() => {
    const iframe = document.getElementById("map-frame");
    iframe.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik`;
  }, [lat, lng]);

  return (
    <iframe
      id="map-frame"
      width="100%"
      height="300"
      style={{ border: 0 }}
    ></iframe>
  );
};

export default MapView;