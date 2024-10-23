/** @format */
'use client';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import { Button } from '@/components/ui/button'; // Adjust the path as necessary
import { useToast } from '@/hooks/use-toast';
import EntityCard from '@/components/EntityCard';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SewingPinIcon, DiscordLogoIcon } from '@radix-ui/react-icons';


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
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

import { fetchData, Entity } from '@/lib/fetchData';

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

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  const handleShowFoundEntities = () => {
    setIsDialogOpen(true);
  };

  useEffect(() => {
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

  const handleMarkerClick = (entity: Entity) => {
    toast(
      {
        title: 'Entity Found',
        description: `You found ${entity.name}`
      },
    );
    if (!foundEntities.includes(entity)) {
      setFoundEntities((prev) => [...prev, entity]);
    }
  };

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

  // Function to get direction from clicked marker to another entity
  const getDirection = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    let angle = Math.atan2(lat2 - lat1, lon2 - lon1) * (180 / Math.PI);
    if (angle < 0) angle += 360; // Normalize to 0-360 degrees

    if (angle >= 22.5 && angle < 67.5) return 'Northeast';
    if (angle >= 67.5 && angle < 112.5) return 'North';
    if (angle >= 112.5 && angle < 157.5) return 'Northwest';
    if (angle >= 157.5 && angle < 202.5) return 'West';
    if (angle >= 202.5 && angle < 247.5) return 'Southwest';
    if (angle >= 247.5 && angle < 292.5) return 'South';
    if (angle >= 292.5 && angle < 337.5) return 'Southeast';
    return 'East';
  };

  // Create GeoJSON for the lines
  const getGeoJsonLine = () => {
    if (!newMarker) return null;

    return {
      type: 'FeatureCollection',
      features: entities
        .filter((entity) => !foundEntities.includes(entity)) // Filter out found entities
        .map((entity) => ({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [newMarker.long, newMarker.lat], // New marker coordinates
              [entity.long, entity.lat], // Existing marker coordinates
            ],
          },
          properties: {
            distance: calculateDistance(
              newMarker.lat,
              newMarker.long,
              entity.lat,
              entity.long
            ), // Store the calculated distance
          },
        })),
    };
  };

  return (
    <>
      <div className="h-screen w-full bg-black relative flex flex-col items-center justify-center">
        <div className="flex-grow w-full h-full relative">
          <Card className="absolute left-4 top-4 lg:left-6 lg:top-6 z-50 max-w-prose">
            <Collapsible open={isInfoCollapsed} onOpenChange={setInfoCollapsed}>
              <CardHeader>
                <CardTitle>
                  <div className="flex justify-between">
                    How to play
                    <CollapsibleTrigger className="font-thin">
                      {isInfoCollapsed ? 'Close info' : 'Open info'}
                    </CollapsibleTrigger>
                  </div>
                </CardTitle>
                <CardDescription>
                  Please follow the instructions below
                </CardDescription>
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <p>
                    Your task is to find and capture all entities on the map.
                  </p>
                  <ol className="list-inside list-decimal">
                    <li className="text-sm text-neutral-500 my-1">
                      Please click anywhere on your map to determine your
                      location.
                    </li>
                    <li className="text-sm text-neutral-500 my-1">
                      Once you have set your location, you will see a card
                      showing the distance between your location and the
                      entities, as well as a coloured line indicating the
                      distance.
                    </li>
                    <li className="text-sm text-neutral-500 my-1">
                      The color of the line indicates the distance to the
                      entity: The darker the color, the farther away you are,
                      and the lighter the color, the closer you are.
                    </li>
                    <li className="text-sm text-neutral-500">
                      To view more details of the found entity, please click on
                      the Show found entities button.
                    </li>
                  </ol>
                  <p className="text-sm text-neutral-500 mt-2">Good luck!</p>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
          {newMarker && (
            <Card className="absolute right-4 bottom-4 lg:right-10 lg:top-10 lg:bottom-auto z-50">
              <CardHeader>
                <CardTitle>Entities</CardTitle>
                <CardDescription>
                  {entities.length === foundEntities.length
                    ? 'You have found all entities!'
                    : 'Distance to Entities from your location'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {newMarker && (
                  <>
                    {entities
                      .filter((entity) => !foundEntities.includes(entity)) // List only not found entities
                      .map((entity) => {
                        // Calculate distance and direction for not found entities
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
                      ) // Sort by distance
                      .map((entity) => (
                        <p
                          key={entity.id}
                          className="text-sm text-muted-foreground"
                        >
                          <strong>{entity.name}</strong> is {entity.distance} km{' '}
                          {entity.direction}
                        </p>
                      ))}
                  </>
                )}
              </CardContent>
              {foundEntities.length > 0 && (
                <CardFooter>
                  <Button
                    onClick={handleShowFoundEntities}
                    className="w-full lg:w-auto"
                  >
                    Show Found Entities
                  </Button>
                </CardFooter>
              )}
            </Card>
          )}
          <Map
            mapboxAccessToken={mapboxToken}
            initialViewState={{
              longitude: 23.7609, // Longitude for Tampere
              latitude: 61.4978, // Latitude for Tampere
              zoom: 2,
              pitch: 0,
              bearing: 0,
            }}
            style={{ width: '100%', height: '100%' }}
            mapStyle="mapbox://styles/mapbox/dark-v11"
            maxZoom={20}
            onClick={handleMapClick}
          >
            {entities.map(
              (entity) =>
                !foundEntities.includes(entity) && ( // Only show if not found
                  <Marker
                    key={entity.id}
                    longitude={entity.long}
                    latitude={entity.lat}
                    anchor="bottom"
                    onClick={() => handleMarkerClick(entity)}
                  >
                    <div style={{ cursor: 'pointer', color: 'white' }}><DiscordLogoIcon  height="0.75rem" className="text-rose-700" /></div>
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
                      'rgba(255, 0, 0, 0.25)', // Red for very close
                      1000,
                      'rgba(255, 165, 0, 0.25)', // Orange for 1000 km
                      2000,
                      'rgba(255, 255, 0, 0.05)', // Yellow for 2000 km
                      3000,
                      'rgba(0, 255, 0, 0.0.05)', // Green for 3000 km
                      5000,
                      'rgba(0, 255, 255, 0.05)', // Cyan for 5000 km
                      8000,
                      'rgba(0, 0, 255, 0.05)', // Blue for 8000 km
                      12000,
                      'rgba(75, 0, 130, 0.05)', // Indigo for 12000 km
                      15000,
                      'rgba(148, 0, 211, 0.05)', // Violet for 15000 km
                      20000,
                      'rgba(0, 0, 0, 0.05)', // Fully transparent for beyond 20000 km
                    ],
                    'line-width': 0.5,
                  }}
                />
              </Source>
            )}
          </Map>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-h-[60vh]">
            <DialogHeader>
              <DialogTitle>Found Entities</DialogTitle>
              <DialogDescription>
                You have successfully found and captured the following entities
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="w-full max-h-[50vh]">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {foundEntities.map((entity) => (
                  <EntityCard key={entity.id} entity={entity} />
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
