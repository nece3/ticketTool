import { PCData, Character, secTypes } from "./secrets"
import { ticketType, vs_variation } from "./vs_variation";

export type battleTypeKey = keyof typeof vs_variation;
export type battleType = (typeof vs_variation)[battleTypeKey];

export type ticketTypeKey = keyof typeof ticketType;
export type ticketType = typeof ticketType[ticketTypeKey]

export type range = {
  min: number;
  max: number;
};

export type groups_proportion = {
  member_count: number;
  apr: range;
  str: range;
  len: range;
  groups: number;
};

export type ArrayCounterProp<T> = {
  readonly array: readonly T[];
  readonly add: () => void;
  readonly delete: () => void;
};

export type CharacterCheck = {
  [key: string]: boolean;
};

export type secCheck = {
  select: boolean;
  extra: CharacterCheck[];
};

export type NPCData = {
  readonly myCharacter: Character;
  readonly target: CharacterCheck;
  readonly secret: {
    [key in secTypes]: secCheck;
  };
};

export type distribution = {
  [key in battleTypeKey]: number;
};

export type vsFilterType = {
  [k in battleTypeKey]: boolean;
};

export type ticketFilterType = {
  [k in ticketTypeKey]: boolean;
}

export type result = {
  npcs: PCData[];
  ticket_type: ticketTypeKey;
  groups: battleGroup[];
  battle_type: battleType;
  proportion: groups_proportion;
};

export type refreshProp = Partial<
  Readonly<{
    pcListArg: readonly PCData[];
    npcListArg: readonly NPCData[];
  }>
>;

export type memberRecord = Record<string, Character>;

export type Entry<T> = keyof T extends infer U
  ? U extends keyof T
    ? [U, T[U]]
    : never
  : never;

export type battleGroup = {
  members: PCData[];
  target_pairs: Character[][];
};

export type PCFormProp = {
  dataList: readonly PCData[];
  setDataList: (arg: PCData[]) => void;
  members: Character[];
};

export type calcArg = {
  npcList: NPCData[];
  pcList: PCData[];
  memberRecord: memberRecord;
};

export interface reportArg {
  results: result[];
  time: number;
  distribution: distribution;
  done: boolean;
}

export type calcButtonProp = calcArg & {
  setTime: (arg:number)=>void,
  setResults: (arg:result[])=>void,
  setDistributions: (arg:distribution)=>void,
}
