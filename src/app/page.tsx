'use client';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import { fetchData, Entity } from '@/lib/fetchData';
import { useWindowSize } from 'usehooks-ts';

// UI Element Imports
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import EntityCard from '@/components/EntityCard';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SewingPinIcon, DiscordLogoIcon } from '@radix-ui/react-icons';
import { MultiStepLoader as Loader } from '@/components/ui/multi-step-loader';

interface LngLat {
  lat: number;
  long: number;
}

export default function Home() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [newMarker, setNewMarker] = useState<LngLat | null>(null);
  const [foundEntities, setFoundEntities] = useState<Entity[]>([]);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInfoCollapsed, setInfoCollapsed] = useState(true);
  const [isFoundEntitiesCollapsed, setIsFoundEntitiesCollapsed] =
    useState(true);
  const [zoomLevel, setZoomLevel] = useState(2);
  const size = useWindowSize();
  const [loading, setLoading] = useState(true);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const handleShowFoundEntities = () => {
    setIsDialogOpen(true);
  };

  const handleShowInfo = () => {
    setInfoCollapsed(true);
  };

  useEffect(() => {
    // Fetches entity data from the server and updates the entities state.
    const getData = async () => {
      const { entities, error } = await fetchData();
      if (error) {
        console.error(error);
      } else {
        setEntities(entities);
      }
    };

    getData();
  }, []);

  // Handles the click event on a marker to add the entity to the found list
  // and displays a toast notification.
  const handleMarkerClick = (entity: Entity) => {
    toast({
      title: 'Entity Found',
      description: `You found ${entity.name}`,
    });
    if (!foundEntities.includes(entity)) {
      setFoundEntities((prev) => [...prev, entity]);
    }
  };

  // Sets a new marker based on the user's click location on the map.
  // Extracts the longitude and latitude from the click event.
  const handleMapClick = (event: mapboxgl.MapMouseEvent) => {
    const { lngLat } = event;

    if (lngLat) {
      const longitude = lngLat.lng;
      const latitude = lngLat.lat;

      setNewMarker({ lat: latitude, long: longitude });
    } else {
      console.error('lngLat not available in event:', event);
    }
  };

  // Calculates the distance between two geographic coordinates using the Haversine formula.
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Determines the compass direction from one set of coordinates to another.
  // Returns a string indicating the direction (e.g., Northeast, South).
  const getDirection = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    let angle = Math.atan2(lat2 - lat1, lon2 - lon1) * (180 / Math.PI);
    if (angle < 0) angle += 360;

    if (angle >= 22.5 && angle < 67.5) return 'Northeast';
    if (angle >= 67.5 && angle < 112.5) return 'North';
    if (angle >= 112.5 && angle < 157.5) return 'Northwest';
    if (angle >= 157.5 && angle < 202.5) return 'West';
    if (angle >= 202.5 && angle < 247.5) return 'Southwest';
    if (angle >= 247.5 && angle < 292.5) return 'South';
    if (angle >= 292.5 && angle < 337.5) return 'Southeast';
    return 'East';
  };

  // Returns the color class for the marker icon based on the current zoom level.
  const getIconColor = () => {
    if (zoomLevel < 5) return 'text-[#2A2A29]';
    if (zoomLevel < 10) return 'text-red-600';
    return 'text-red-300';
  };

  // Generates a GeoJSON object representing lines connecting the new marker
  // to all found entities, allowing for distance visualization on the map.
  const getGeoJsonLine = () => {
    if (!newMarker) return null;

    return {
      type: 'FeatureCollection',
      features: entities
        .filter((entity) => !foundEntities.includes(entity))
        .map((entity) => ({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [newMarker.long, newMarker.lat],
              [entity.long, entity.lat],
            ],
          },
          properties: {
            distance: calculateDistance(
              newMarker.lat,
              newMarker.long,
              entity.lat,
              entity.long
            ),
          },
        })),
    };
  };

  const loadingStates = [
    { text: 'Intercepting alien communication...' },
    { text: 'Decoding the encrypted message...' },
    { text: 'Analyzing signal patterns...' },
    { text: 'Detecting language...' },
    { text: 'Identifying encryption type...' },
    { text: 'Base64 detected...' },
    { text: 'Decrypting message...' },
    { text: 'Extracting coordinates...' },
    { text: 'Locating key figures of the Rebel Army...' },
    { text: 'Message decoded successfully!' },
    { text: 'Ready for action, proceed to the map!' },
  ];

  useEffect(() => {
    // Simulates the loading process by delaying the completion state,
    // allowing for a loading animation to play before setting loading to false.
    const loadingCompletion = async () => {
      await new Promise((resolve) =>
        setTimeout(resolve, loadingStates.length * 1000)
      );
      setLoading(false);
    };

    loadingCompletion();
  }, [loadingStates.length]);

  return (
    <>
      {loading ? (
        <Loader
          loadingStates={loadingStates}
          loading={loading}
          duration={1000}
        />
      ) : (
        <div className="h-dvh lg:h-screen w-full bg-black relative flex flex-col items-center justify-center">
          <div className="flex-grow w-full h-full relative">
            {!isInfoCollapsed && (
              <Button
                className="absolute left-4 top-4  lg:left-6 lg:top-6 z-50"
                variant="secondary"
                onClick={handleShowInfo}
              >
                Show info
              </Button>
            )}
            <Dialog open={isInfoCollapsed} onOpenChange={setInfoCollapsed}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>How to play</DialogTitle>
                  <DialogDescription>
                    Please follow the instructions below
                  </DialogDescription>
                </DialogHeader>
                <div className="max-w-prose">
                  <p>
                    Your task is to find and capture all entities on the map.
                  </p>
                  <ol className="list-inside list-decimal">
                    <li className="text-sm text-neutral-500 my-2">
                      To start click anywhere on your map to determine your
                      location.
                    </li>
                    <li className="text-sm text-neutral-500 my-2">
                      Once you have set your location, you will see a card
                      showing the distance between your location and the
                      entities.
                    </li>
                    <li className="text-sm text-neutral-500 my-2">
                      If you are close enough to an entity a coloured line will
                      appear indicating the distance to an entity near by.
                    </li>
                    <li className="text-sm text-neutral-500 my-2">
                      The color of the line indicates the distance to the
                      entity: The darker the color, the farther away you are,
                      and the lighter the color, the closer you are.
                    </li>
                    <li className="text-sm text-neutral-500 my-2">
                      To tag an entity as found, simply click on the colored
                      icon
                    </li>{' '}
                    <li className="text-sm text-neutral-500">
                      To view more details of the found entity, please click on
                      the Show found entities button.
                    </li>
                  </ol>
                  <h2 className="text-sm mt-4">Good luck!</h2>
                </div>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="mt-4">
                    Close info
                  </Button>
                </DialogTrigger>
              </DialogContent>
            </Dialog>
            {newMarker && (
              <Card className="absolute left-4 right-4 bottom-4 lg:left-auto lg:right-6 lg:top-6 lg:bottom-auto z-50 lg:w-auto">
                <Collapsible
                  open={isFoundEntitiesCollapsed}
                  onOpenChange={setIsFoundEntitiesCollapsed}
                >
                  <CardHeader>
                    <CardTitle>Entities</CardTitle>
                    <CardDescription>
                      {entities.length === foundEntities.length
                        ? 'You have found all entities!'
                        : 'Distance to Entities from your location'}
                    </CardDescription>
                  </CardHeader>
                  <CollapsibleContent>
                    <CardContent>
                      {newMarker && (
                        <ul className="lg:min-w-[22rem]">
                          {entities
                            .filter((entity) => !foundEntities.includes(entity))
                            .map((entity) => {
                              const distance = calculateDistance(
                                newMarker.lat,
                                newMarker.long,
                                entity.lat,
                                entity.long
                              ).toFixed(2);
                              const direction = getDirection(
                                newMarker.lat,
                                newMarker.long,
                                entity.lat,
                                entity.long
                              );

                              return {
                                ...entity,
                                distance,
                                direction,
                              };
                            })
                            .sort(
                              (a, b) =>
                                parseFloat(a.distance) - parseFloat(b.distance)
                            )
                            .map((entity) => (
                              <li
                                key={entity.id}
                                className="text-sm text-muted-foreground flex justify-between mt-2 lg:mt-1"
                              >
                                <strong>{entity.name}</strong>
                                {entity.distance} km {entity.direction}
                              </li>
                            ))}
                        </ul>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                  <CardFooter>
                    <div className="flex flex-row gap-2 lg:flex-row w-full">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="secondary"
                          className="w-full lg:w-auto"
                        >
                          {isFoundEntitiesCollapsed
                            ? 'Hide Entity List'
                            : 'Show Entity List'}
                        </Button>
                      </CollapsibleTrigger>
                      {foundEntities.length > 0 && (
                        <Button
                          onClick={handleShowFoundEntities}
                          className="w-full lg:w-auto"
                          variant="secondary"
                        >
                          Show Found Entities
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Collapsible>
              </Card>
            )}
            <Map
              mapboxAccessToken={mapboxToken}
              initialViewState={{
                longitude: 23.7609,
                latitude: 61.4978,
                zoom: size.width && size.width > 768 ? 2.5 : 1,
                pitch: 0,
                bearing: 0,
              }}
              style={{ width: '100%', height: '100%' }}
              mapStyle="mapbox://styles/mapbox/dark-v11"
              maxZoom={20}
              onClick={handleMapClick}
              onZoom={(e) => setZoomLevel(e.viewState.zoom)}
            >
              {entities.map(
                (entity) =>
                  !foundEntities.includes(entity) && (
                    <Marker
                      key={entity.id}
                      longitude={entity.long}
                      latitude={entity.lat}
                      anchor="bottom"
                      onClick={() => handleMarkerClick(entity)}
                    >
                      <div
                        className={`cursor-pointer ${getIconColor()} h-4 w-4 flex items-center justify-center lg:h-auto lg:w-auto`}
                      >
                        <DiscordLogoIcon className="h-full w-full" />
                      </div>
                    </Marker>
                  )
              )}
              {newMarker && (
                <Marker
                  key="new-marker"
                  longitude={newMarker.long}
                  latitude={newMarker.lat}
                  anchor="bottom"
                >
                  <div style={{ cursor: 'pointer', color: 'yellow' }}>
                    <SewingPinIcon className="text-neutral-100" />
                  </div>
                </Marker>
              )}
              {newMarker && getGeoJsonLine() && (
                <Source id="line-source" type="geojson" data={getGeoJsonLine()}>
                  <Layer
                    id="line-layer"
                    type="line"
                    layout={{
                      'line-cap': 'round',
                      'line-join': 'round',
                    }}
                    paint={{
                      'line-color': [
                        'interpolate',
                        ['linear'],
                        ['get', 'distance'],
                        0,
                        'rgba(255, 255, 255, 1)',
                        50,
                        'rgba(255, 255, 0, 1)',
                        100,
                        'rgba(255, 165, 0, 0.8)',
                        200,
                        'rgba(255, 69, 0, 0.75)',
                        300,
                        'rgba(255, 69, 255, 0.5)',
                        400,
                        'rgba(0, 0, 0, 0.0)',
                      ],
                      'line-width': 2,
                    }}
                  />
                </Source>
              )}
            </Map>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-h-[calc(100dvh-1.5rem)] lg:max-h-[80vh] overflow-hidden pb-6">
              <DialogHeader>
                <DialogTitle>Found Entities</DialogTitle>
                <DialogDescription>
                  You have successfully found and captured the following
                  entities
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="w-full h-full max-h-[35rem] lg:max-h-[60vh]">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {foundEntities.map((entity) => (
                    <EntityCard key={entity.id} entity={entity} />
                  ))}
                </div>
              </ScrollArea>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </>
  );
}
