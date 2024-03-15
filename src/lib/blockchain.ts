import Block from "./block";
import Validation from "./validation";
import BlockInfo from "./blockInfo";

export default class Blockchain {
  static readonly DIFFICULT_FACTOR: number = 5;
  static readonly MAX_DIFFICULTY: number = 62;

  blocks: Block[] = [];
  nextIndex: number = 0;

  constructor() {
    const genesisBlock = new Block(0, "", "Genesis Block");
    genesisBlock.mine(this.getDifficulty(), "miner");

    this.blocks.push(genesisBlock);
    this.nextIndex++;
  }

  getLastBlock(): Block {
    return this.blocks[this.blocks.length - 1];
  }

  addBlock(block: Block): Validation {
    const lastBlock = this.getLastBlock();
    const validation = block.isValid(lastBlock.index, lastBlock.hash, this.getDifficulty());
    if (!validation.success) return validation;

    this.blocks.push(block);
    this.nextIndex++;

    return new Validation();
  }

  getDifficulty(): number {
    return Math.ceil(this.blocks.length / Blockchain.DIFFICULT_FACTOR);
  }

  getBlock(hash: string): Block | undefined {
    return this.blocks.find((block) => block.hash === hash);
  }

  isValid(): Validation {
    for (let i = this.blocks.length - 1; i > 0; i--) {
      const currentBlock = this.blocks[i];
      const previousBlock = this.blocks[i - 1];
      const validation = currentBlock.isValid(
        previousBlock.index,
        previousBlock.hash,
        this.getDifficulty()
      );
      if (!validation.success)
        return new Validation(false, `Invalid block #${currentBlock.index}: ${validation.message}`);
    }

    return new Validation();
  }

  getFeePerTx(): number {
    return 1;
  }

  getNextBlock(): BlockInfo {
    const data = new Date().toString();
    const difficulty = this.getDifficulty();
    const previousHash = this.getLastBlock().hash;
    const index = this.blocks.length;
    const feePerTx = this.getFeePerTx();
    const maxDifficulty = Blockchain.MAX_DIFFICULTY;

    return {
      data,
      difficulty,
      previousHash,
      index,
      feePerTx,
      maxDifficulty,
    }
  }
}
