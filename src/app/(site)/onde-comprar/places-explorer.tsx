'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input, Select } from '@/components/ui/input';
import { Alert, EmptyState, Skeleton } from '@/components/ui/feedback';
import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/cn';
import { formatDistanceMeters } from '@/lib/utils/format';
import { PLACE_CATEGORY_LABELS, type Place } from '@/domain/places/types';
import { MapCanvas } from '@/components/map/map-canvas';

type LocationState =
  | { kind: 'idle' }
  | { kind: 'asking' }
  | { kind: 'ready'; lat: number; lon: number; label: string }
  | { kind: 'denied' }
  | { kind: 'unavailable' };

const RADII = [
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
  { value: 10_000, label: '10 km' },
  { value: 25_000, label: '25 km' },
];

/**
 * Mapa e lista sincronizados.
 *
 * A localização só é pedida quando a pessoa clica no botão — nunca no
 * carregamento da página. Quem prefere não compartilhar pode digitar a cidade.
 */
export function PlacesExplorer() {
  const [location, setLocation] = useState<LocationState>({ kind: 'idle' });
  const [address, setAddress] = useState('');
  const [radius, setRadius] = useState(5000);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const search = useCallback(
    async (lat: number, lon: number, currentRadius: number) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/lugares?lat=${lat}&lon=${lon}&raio=${currentRadius}`,
        );
        const payload = (await response.json()) as {
          places?: Place[];
          error?: string;
        };

        if (!response.ok) {
          setError(payload.error ?? 'Não conseguimos carregar os estabelecimentos.');
          setPlaces([]);
          return;
        }

        setPlaces(payload.places ?? []);
      } catch {
        setError(
          'Não conseguimos carregar os estabelecimentos agora. Verifique sua conexão e tente novamente.',
        );
        setPlaces([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    if (location.kind === 'ready') {
      void search(location.lat, location.lon, radius);
    }
  }, [location, radius, search]);

  function requestGeolocation() {
    if (!('geolocation' in navigator)) {
      setLocation({ kind: 'unavailable' });
      return;
    }

    setLocation({ kind: 'asking' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          kind: 'ready',
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          label: 'Sua localização atual',
        });
      },
      (geoError) => {
        setLocation(
          geoError.code === geoError.PERMISSION_DENIED
            ? { kind: 'denied' }
            : { kind: 'unavailable' },
        );
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 300_000 },
    );
  }

  async function searchByAddress(event: React.FormEvent) {
    event.preventDefault();
    if (address.trim().length < 2) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/lugares?endereco=${encodeURIComponent(address)}`,
      );
      const payload = (await response.json()) as {
        results?: { latitude: number; longitude: number; displayName: string }[];
        error?: string;
      };

      const first = payload.results?.[0];
      if (!response.ok || !first) {
        setError(
          payload.error ??
            'Não encontramos esse endereço. Tente escrever a cidade e o estado.',
        );
        setLoading(false);
        return;
      }

      setLocation({
        kind: 'ready',
        lat: first.latitude,
        lon: first.longitude,
        label: first.displayName.split(',').slice(0, 3).join(', '),
      });
    } catch {
      setError('Não conseguimos buscar esse endereço agora.');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Controles */}
      <div className="rounded-lg border border-ink-200 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
          <div className="lg:w-56">
            <Button
              iconLeft="navigation"
              fullWidth
              loading={location.kind === 'asking'}
              onClick={requestGeolocation}
            >
              Usar minha localização
            </Button>
          </div>

          <form onSubmit={searchByAddress} className="flex flex-1 gap-2.5">
            <div className="flex-1">
              <Field
                id="endereco"
                label="Ou informe cidade e estado"
                labelHidden
              >
                {(props) => (
                  <Input
                    {...props}
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    iconLeft="search"
                    placeholder="Ex.: Uberaba, MG"
                    autoComplete="address-level2"
                  />
                )}
              </Field>
            </div>
            <Button type="submit" variant="outline">
              Buscar
            </Button>
          </form>

          <div className="lg:w-36">
            <label htmlFor="raio" className="mb-1.5 block text-sm font-medium text-ink-800">
              Raio
            </label>
            <Select
              id="raio"
              value={String(radius)}
              onChange={(event) => setRadius(Number(event.target.value))}
            >
              {RADII.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <p className="mt-3 text-xs text-ink-500">
          Sua localização é usada apenas nesta busca. O BROTA não guarda a sua
          posição.
        </p>
      </div>

      {/* Estados de permissão */}
      {location.kind === 'denied' ? (
        <Alert tone="attention" title="Permissão de localização negada">
          Sem problema — digite a sua cidade no campo acima que a busca funciona
          do mesmo jeito.
        </Alert>
      ) : null}

      {location.kind === 'unavailable' ? (
        <Alert tone="attention" title="Localização indisponível">
          Não foi possível obter a sua posição. Informe a cidade no campo acima.
        </Alert>
      ) : null}

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {/* Mapa + lista */}
      {location.kind === 'ready' ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
          <div className="order-2 h-[26rem] overflow-hidden rounded-lg border border-ink-200 lg:order-1 lg:h-[34rem]">
            <MapCanvas
              center={{ lat: location.lat, lon: location.lon }}
              places={places}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id);
                listRef.current
                  ?.querySelector(`[data-place="${CSS.escape(id)}"]`)
                  ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
              }}
            />
          </div>

          <div className="order-1 lg:order-2 lg:h-[34rem] lg:overflow-y-auto">
            <p className="mb-3 text-sm text-ink-600" aria-live="polite">
              {loading
                ? 'Buscando estabelecimentos…'
                : `${places.length} ${places.length === 1 ? 'lugar encontrado' : 'lugares encontrados'} perto de ${location.label}`}
            </p>

            {loading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-24 w-full rounded-lg" />
                ))}
              </div>
            ) : places.length === 0 ? (
              <EmptyState
                icon="mapPin"
                title="Nenhum lugar encontrado por aqui"
                description="Tente aumentar o raio da busca. Se você conhece uma floricultura que não aparece, ela provavelmente ainda não está cadastrada no OpenStreetMap — e qualquer pessoa pode adicionar."
              />
            ) : (
              <ul ref={listRef} className="space-y-2.5">
                {places.map((place) => (
                  <li key={place.id} data-place={place.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(place.id)}
                      className={cn(
                        'w-full rounded-lg border p-3.5 text-left transition-colors',
                        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                        selectedId === place.id
                          ? 'border-brand-500 bg-brand-50'
                          : 'border-ink-200 bg-white hover:border-ink-300',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="min-w-0 font-medium text-ink-900">
                          {place.name}
                        </h3>
                        {place.distanceMeters !== null ? (
                          <span className="shrink-0 text-xs text-ink-500">
                            {formatDistanceMeters(place.distanceMeters)}
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-1.5">
                        <Badge tone="neutral">
                          {PLACE_CATEGORY_LABELS[place.category]}
                        </Badge>
                      </div>

                      {place.address ? (
                        <p className="mt-2 flex items-start gap-1.5 text-sm text-ink-600">
                          <Icon name="mapPin" size={14} className="mt-0.5 shrink-0" />
                          {place.address}
                        </p>
                      ) : null}

                      {place.openingHours ? (
                        <p className="mt-1 flex items-start gap-1.5 text-sm text-ink-600">
                          <Icon name="clock" size={14} className="mt-0.5 shrink-0" />
                          {place.openingHours}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap gap-3 text-sm">
                        <a
                          href={`https://www.openstreetmap.org/directions?to=${place.latitude},${place.longitude}`}
                          target="_blank"
                          rel="noreferrer noopener"
                          onClick={(event) => event.stopPropagation()}
                          className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline"
                        >
                          <Icon name="navigation" size={14} />
                          Como chegar
                        </a>

                        {place.phone ? (
                          <a
                            href={`tel:${place.phone.replace(/\s/g, '')}`}
                            onClick={(event) => event.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-ink-600 hover:text-brand-700"
                          >
                            <Icon name="phone" size={14} />
                            {place.phone}
                          </a>
                        ) : null}

                        {place.website ? (
                          <a
                            href={place.website}
                            target="_blank"
                            rel="noreferrer noopener"
                            onClick={(event) => event.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-ink-600 hover:text-brand-700"
                          >
                            <Icon name="externalLink" size={14} />
                            Site
                          </a>
                        ) : null}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : location.kind !== 'asking' ? (
        <EmptyState
          icon="mapPin"
          title="Escolha um ponto de partida"
          description="Use a sua localização ou informe a cidade para ver as floriculturas, viveiros e garden centers mais próximos."
        />
      ) : null}
    </div>
  );
}
