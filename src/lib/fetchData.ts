/** @format */

// lib/fetchdata.ts

interface DecodedMessage {
  id: number;
  lat: number; // Latitude
  long: number; // Longitude
}

export interface Entity {
  id: number;
  name: string;
  height: number;
  mass: number;
  gender: string;
  homeworld: string;
  wiki: string;
  image: string;
  born: number;
  died: number;
  diedLocation: string;
  species: string;
  hairColor: string;
  eyeColor: string;
  skinColor: string;
  cybernetics: string;
  affiliations: string[];
  masters: string[];
  apprentices: string[];
  formerAffiliations: string[];
  lat: number; // Latitude
  long: number; // Longitude
}

export const fetchData = async (): Promise<{
  entities: Entity[];
  error: string | null;
}> => {
  try {
    const messageResponse = await fetch(
      'https://aseevia.github.io/star-wars-frontend/data/secret.json'
    );
    if (!messageResponse.ok) {
      throw new Error('Network response was not ok');
    }
    const messageData = await messageResponse.json();
    const decodedString = atob(messageData.message);
    const decodedData: DecodedMessage[] = JSON.parse(decodedString);

    const entityPromises = decodedData.map(async (item) => {
      const entityResponse = await fetch(
        `https://akabab.github.io/starwars-api/api/id/${item.id}.json`
      );
      if (!entityResponse.ok) {
        throw new Error(`Entity ${item.id} not found`);
      }
      const entityData = await entityResponse.json();

      // Combine the entity data with the lat and long from decodedData
      return {
        ...entityData,
        lat: item.lat, // Add latitude from decoded message
        long: item.long, // Add longitude from decoded message
      } as Entity;
    });

    const entities = await Promise.all(entityPromises);
    return { entities, error: null };
  } catch (error) {
    return { entities: [], error: (error as Error).message };
  }
};
