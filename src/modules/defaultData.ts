import { PCData, SecSelect } from "./secrets";

const charas = [
  { id: "PC1", name: "PC1", strength: 1 },
  { id: "PC2", name: "PC2", strength: 1 },
] as const;

export const defaultPCList = charas.map((chara, idx)=>({
    myCharacter: chara,
    target: charas[1-idx],
    secret: { key: "A", extra: [] } as SecSelect,
})) as PCData[]
