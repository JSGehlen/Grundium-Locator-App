'use client';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useEffect, useState } from 'react';
import Map, { Marker, Source, Layer } from 'react-map-gl';
import { fetchData, Entity } from '@/lib/fetchData';

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
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SewingPinIcon, DiscordLogoIcon } from '@radix-ui/react-icons';

interface LngLat {
  lat: number;
  long: number;
}

/**
 * Home component that renders the main page of the Grundium Locator App.
 *
 * @component
 *
 * @returns {JSX.Element} The rendered component.
 *
 * @description
 * This component initializes the state for entities, new markers, found entities,
 * dialog visibility, info collapse state, found entities collapse state, and zoom level.
 * It fetches data on mount and sets the entities state. It handles map clicks to set new markers,
 * marker clicks to add found entities, and zoom events to update the zoom level. It also calculates
 * distances and directions between coordinates and generates GeoJSON lines for map visualization.
 *
 * @state {Entity[]} entities - The list of entities fetched from the server.
 * @state {LngLat | null} newMarker - The coordinates of the new marker set by the user.
 * @state {Entity[]} foundEntities - The list of entities found by the user.
 * @state {boolean} isDialogOpen - The state to control the visibility of the dialog.
 * @state {boolean} isInfoCollapsed - The state to control the collapse of the info section.
 * @state {boolean} isFoundEntitiesCollapsed - The state to control the collapse of the found entities section.
 * @state {number} zoomLevel - The current zoom level of the map.
 *
 * @constant {string} mapboxToken - The Mapbox access token from environment variables.
 *
 * @function handleShowFoundEntities - Opens the dialog to show found entities.
 *
 * @function useEffect - Fetches data on component mount and sets the entities state.
 *
 * @function handleMarkerClick - Handles clicks on markers to add entities to the found list and show a toast notification.
 *
 * @function handleMapClick - Handles clicks on the map to set a new marker.
 *
 * @function calculateDistance - Calculates the distance between two coordinates using the Haversine formula.
 *
 * @function getDirection - Calculates the direction from one coordinate to another.
 *
 * @function handleZoomEnd - Updates the zoom level state when the zoom event ends.
 *
 * @function getIconColor - Returns the color of the icon based on the zoom level.
 *
 * @function getGeoJsonLine - Generates a GeoJSON line feature collection for the map visualization.
 *
 * @returns {JSX.Element} The rendered component.
 */

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
    toast({
      title: 'Entity Found',
      description: `You found ${entity.name}`,
    });
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

  const handleZoomEnd = (event: any) => {
    const { zoom } = event.viewState;
    setZoomLevel(zoom);
  };


const getIconColor = () => {
  if (zoomLevel < 5) return 'text-[#2A2A29]';
  if (zoomLevel < 10) return 'text-red-600';
  return 'text-red-300';
};
console.log(zoomLevel)
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

  return (
    <>
      <div className="h-dvh lg:h-screen w-full bg-black relative flex flex-col items-center justify-center">
        <div className="flex-grow w-full h-full relative">
          <Card className="absolute left-4 top-4 lg:left-6 lg:top-6 z-50 max-w-prose">
            <Collapsible open={isInfoCollapsed} onOpenChange={setInfoCollapsed}>
              <CardHeader>
                <CardTitle>
                  <div className="flex justify-between items-center">
                    How to play
                    <CollapsibleTrigger className="font-thin" asChild>
                      <Button variant="secondary">
                        {isInfoCollapsed ? 'Close info' : 'Open info'}
                      </Button>
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
                      entities.
                    </li>
                    <li className="text-sm text-neutral-500 my-1">
                      If you are close enough to an entity a coloured line will
                      appear indicating the distance to an entity near by.
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
            <Card className="absolute right-4 bottom-4 lg:right-6 lg:top-6 lg:bottom-auto z-50">
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
                      <>
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
                              parseFloat(b.distance) - parseFloat(a.distance)
                          )
                          .map((entity) => (
                            <p
                              key={entity.id}
                              className="text-sm text-muted-foreground"
                            >
                              <strong>{entity.name}</strong> is{' '}
                              {entity.distance} km {entity.direction}
                            </p>
                          ))}
                      </>
                    )}
                  </CardContent>
                </CollapsibleContent>
                <CardFooter>
                  <div className="flex flex-row gap-2 lg:flex-row">
                    <CollapsibleTrigger asChild>
                      <Button variant="secondary">
                        {isFoundEntitiesCollapsed
                          ? 'Hide Entity List'
                          : 'Show Entity List'}
                      </Button>
                    </CollapsibleTrigger>
                    {foundEntities.length > 0 && (
                      <Button
                        onClick={handleShowFoundEntities}
                        className="w-full lg:w-auto"
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
              zoom: 2,
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
                    <div className={`cursor-pointer ${getIconColor()}`}>
                      <DiscordLogoIcon />
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
                You have successfully found and captured the following entities
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
    </>
  );
}
