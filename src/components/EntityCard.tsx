/** @format */

// EntityCard.tsx
import React from 'react';

import { CardSpotlight } from '@/components/ui/card-spotlight';
import { Entity } from '@/lib/fetchData';
import Image from 'next/image'; // Import Image from next/image
interface EntityCardProps {
  entity: Entity;
}

const EntityCard: React.FC<EntityCardProps> = ({ entity }) => {
  return (
    <CardSpotlight className="pb-6">
      {entity.image && (
        <Image
        priority
          src={entity.image}
          alt={entity.name}
          width={0}
          height={0}
          sizes="100vw"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          className="rounded-lg z-20 relative max-h-[20rem]" // Add any desired styles
        />
      )}
      <p className="text-xl font-bold relative z-20 mt-2 text-white">
        {entity.name}
      </p>
      <div className="text-neutral-200 mt-4 relative z-20">
       Details
        <ul className="list-none mt-2 pb-6">
          {entity.mass && <Step title={`Mass: ${entity.mass}kg`} />}
          {entity.height && <Step title={`Height: ${entity.height}m`} />}
          {entity.gender && <Step title={`Gender: ${entity.gender}`} />}
          {entity.homeworld && <Step title={`Homeworld: ${entity.homeworld}`} />}
          {entity.species && <Step title={`Species: ${entity.species}`} />}
        </ul>
      </div>
    </CardSpotlight>
  );
};

const Step = ({ title }: { title: string }) => {
  return (
    <li className="flex gap-2 items-start">
      <p className="text-sm text-neutral-500">{title}</p>
    </li>
  );
};


export default EntityCard;
