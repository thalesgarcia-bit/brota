'use client';

import { useEffect, useRef } from 'react';
import type { Map as LeafletMap, Marker } from 'leaflet';

import 'leaflet/dist/leaflet.css';

import { PLACE_CATEGORY_LABELS, type Place } from '@/domain/places/types';

/**
 * Mapa.
 *
 * O Leaflet é carregado dinamicamente no cliente — ele toca no `window` na
 * importação e quebraria a renderização no servidor. Não usamos `react-leaflet`
 * para não acoplar a versão do React ao ciclo de vida do mapa.
 *
 * Os marcadores são desenhados como ícones de HTML (`divIcon`), o que evita
 * depender das imagens padrão do Leaflet e mantém a linguagem visual do BROTA.
 */
export function MapCanvas({
  center,
  places,
  selectedId,
  onSelect,
}: {
  center: { lat: number; lon: number };
  places: Place[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<Map<string, Marker>>(new Map());
  const selectHandler = useRef(onSelect);
  selectHandler.current = onSelect;

  // Cria o mapa uma única vez.
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const L = await import('leaflet');
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [center.lat, center.lon],
        zoom: 14,
        scrollWheelZoom: false,
        // No toque, o arrasto com um dedo rola a página.
        dragging: !L.Browser.mobile,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© colaboradores do OpenStreetMap',
      }).addTo(map);

      L.control.scale({ imperial: false, metric: true }).addTo(map);

      // Marcador da posição consultada.
      L.circleMarker([center.lat, center.lon], {
        radius: 7,
        color: '#2c6d4e',
        fillColor: '#3a8761',
        fillOpacity: 0.9,
        weight: 2,
      })
        .addTo(map)
        .bindPopup('Ponto de partida da busca');

      mapRef.current = map;
    }

    void init();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
    // O mapa é recriado somente quando o centro muda de verdade.
  }, [center.lat, center.lon]);

  // Sincroniza os marcadores com a lista.
  useEffect(() => {
    let cancelled = false;

    async function sync() {
      const L = await import('leaflet');
      const map = mapRef.current;
      if (cancelled || !map) return;

      for (const marker of markersRef.current.values()) marker.remove();
      markersRef.current.clear();

      for (const place of places) {
        const icon = L.divIcon({
          className: '',
          html:
            '<span style="display:flex;align-items:center;justify-content:center;' +
            'width:28px;height:28px;border-radius:999px;background:#ffffff;' +
            'border:2px solid #2c6d4e;box-shadow:0 1px 3px rgba(16,32,24,.25);">' +
            '<span style="width:10px;height:10px;border-radius:999px;background:#3a8761;"></span>' +
            '</span>',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([place.latitude, place.longitude], {
          icon,
          title: place.name,
          alt: `${place.name}, ${PLACE_CATEGORY_LABELS[place.category]}`,
          keyboard: true,
        })
          .addTo(map)
          .bindPopup(
            `<strong>${escapeHtml(place.name)}</strong><br>${escapeHtml(
              PLACE_CATEGORY_LABELS[place.category],
            )}${place.address ? `<br>${escapeHtml(place.address)}` : ''}`,
          )
          .on('click', () => selectHandler.current(place.id));

        markersRef.current.set(place.id, marker);
      }

      if (places.length > 0) {
        const bounds = L.latLngBounds([
          [center.lat, center.lon],
          ...places.map(
            (place) => [place.latitude, place.longitude] as [number, number],
          ),
        ]);

        map.fitBounds(bounds, { padding: [32, 32], maxZoom: 16 });
      }
    }

    void sync();

    return () => {
      cancelled = true;
    };
  }, [places, center.lat, center.lon]);

  // Destaca o marcador escolhido na lista.
  useEffect(() => {
    if (!selectedId) return;

    const marker = markersRef.current.get(selectedId);
    const map = mapRef.current;
    if (!marker || !map) return;

    map.panTo(marker.getLatLng(), { animate: true });
    marker.openPopup();
  }, [selectedId]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Mapa dos estabelecimentos encontrados"
      className="h-full w-full bg-ink-100"
    />
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
