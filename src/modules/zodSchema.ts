import { z } from "zod";
import { secrets, PCData } from "./secrets";
import { NPCData } from "./types";

// secTypes
const secTypesSchema = z.enum(Object.keys(secrets) as [keyof typeof secrets]);
type secTypes = z.infer<typeof secTypesSchema>;

// Character
const characterSchema = z.object({
  id: z.string(),
  name: z.string(),
  strength: z.number(),
}).readonly();

// SecSelect
const secSelectSchema = z.object({
  key: secTypesSchema,
  extra: z.array(characterSchema),
}).readonly();

// PCData
const pcDataSchema = z.object({
  myCharacter: characterSchema,
  target: characterSchema,
  secret: secSelectSchema,
}).readonly();

// PCData[]
export const pcDataArraySchema = z.array(pcDataSchema);

// 型推論
type PCDataArray = z.infer<typeof pcDataArraySchema>;

// 型同一性チェックユーティリティ
type AssertEqual<T, U> =
  (<G>() => G extends T ? 1 : 2) extends
  (<G>() => G extends U ? 1 : 2) ? true : false;

// ここでtrueなら型一致
const _typeCheckPC: AssertEqual<PCDataArray, PCData[]> = true;

// CharacterCheck 型
const characterCheckSchema = z.record(z.string(),z.boolean());

// secCheck 型
const secCheckSchema = z.object({
  select: z.boolean(),
  extra: z.array(characterCheckSchema),
});

const secretSchema = z.object(
  Object.fromEntries(
    Object.keys(secrets).map((k) => [k, secCheckSchema])
  ) as Record<secTypes, typeof secCheckSchema>
);

// NPCData 型
const npcDataSchema = z.object({
  myCharacter: characterSchema,
  target: characterCheckSchema,
  secret: secretSchema,
}).readonly();

// NPCData[] 型
export const npcDataArraySchema = z.array(npcDataSchema);

// TypeScript 側で推論される型（型安全チェック用）
type NPCDataArray = z.infer<typeof npcDataArraySchema>;

const _typeCheckNPC: AssertEqual<NPCDataArray, NPCData[]> = true;
