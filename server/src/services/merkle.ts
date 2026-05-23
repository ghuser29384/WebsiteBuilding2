import { sha256Hex } from "./cryptoSigning";

export interface MerkleProofItem {
  position: "left" | "right";
  hash: string;
}

export const auditLeafHash = (canonicalHash: string): string => {
  return sha256Hex(`leaf:v1:${canonicalHash}`);
};

const parentHash = (left: string, right: string): string => {
  return sha256Hex(`node:v1:${left}:${right}`);
};

export const merkleRoot = (leafHashes: string[]): string => {
  if (leafHashes.length === 0) {
    return sha256Hex("empty:v1");
  }

  let level = leafHashes.slice();
  while (level.length > 1) {
    const next: string[] = [];
    for (let index = 0; index < level.length; index += 2) {
      const left = level[index];
      const right = level[index + 1] || left;
      next.push(parentHash(left, right));
    }
    level = next;
  }
  return level[0];
};

export const merkleInclusionProof = (leafHashes: string[], leafIndex: number): MerkleProofItem[] => {
  if (leafIndex < 0 || leafIndex >= leafHashes.length) return [];

  const proof: MerkleProofItem[] = [];
  let index = leafIndex;
  let level = leafHashes.slice();

  while (level.length > 1) {
    const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;
    const sibling = level[siblingIndex] || level[index];
    proof.push({
      position: index % 2 === 0 ? "right" : "left",
      hash: sibling,
    });

    const next: string[] = [];
    for (let cursor = 0; cursor < level.length; cursor += 2) {
      const left = level[cursor];
      const right = level[cursor + 1] || left;
      next.push(parentHash(left, right));
    }
    index = Math.floor(index / 2);
    level = next;
  }

  return proof;
};
