import editalData from "./edital-bb.json";

export interface EditalTopic {
  exam_name: string;
  discipline: string;
  topic: string;
  weight: number;
  order_index: number;
  id?: string;
}

export const EDITAL_BB: EditalTopic[] = editalData;
