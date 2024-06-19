import { v4 as uuidv4 } from "uuid";
export const jnstringify = (data: any) => JSON.stringify(data);

export const jnparse = (data: any) => JSON.parse(data);

export const getUUIDv4 = () => uuidv4();

export const getTranscriptionSegments = (data: {
  segments: { id: number; start: number; end: number; text: string }[];
}) => {
  return data.segments.map((segment) => ({
    id: segment.id,
    start: Math.round(segment.start * 100) / 100,
    end: Math.round(segment.end * 100) / 100,
    text: segment.text,
  }));
};
