import { Sign } from '../enums';

export interface Person2 {
  id: number;
  name: string;
  attributes: Record<string, number>;
  preferences: Record<string, { value: number; sign: Sign; weight: number }>;
  personalAuraRadio: number;
}
