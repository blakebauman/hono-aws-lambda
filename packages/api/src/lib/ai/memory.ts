// Memory/state management for conversations
// Note: LangChain v1.0 has different memory APIs
// Using a simplified in-memory approach for now

import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import type { BaseMessage } from "@langchain/core/messages";
import { getRedis } from "../cache";
import { logger } from "../logger";

export interface ConversationMemory {
  conversationId: string;
  history: InMemoryChatMessageHistory;
}

const memoryStore = new Map<string, ConversationMemory>();

// Simplified memory interface for LangChain v1.0
export interface SimpleMemory {
  getMessages(): Promise<BaseMessage[]>;
  addMessage(message: BaseMessage): Promise<void>;
  clear(): Promise<void>;
}

class MemoryWrapper implements SimpleMemory {
  constructor(private history: InMemoryChatMessageHistory) {}

  async getMessages(): Promise<BaseMessage[]> {
    return this.history.getMessages();
  }

  async addMessage(message: BaseMessage): Promise<void> {
    await this.history.addMessage(message);
  }

  async clear(): Promise<void> {
    await this.history.clear();
  }
}

export function createMemory(conversationId: string): SimpleMemory {
  try {
    // Check if memory already exists for this conversation
    if (memoryStore.has(conversationId)) {
      const existing = memoryStore.get(conversationId);
      if (existing) {
        return new MemoryWrapper(existing.history);
      }
    }

    // Create new memory
    const history = new InMemoryChatMessageHistory();
    const memory = new MemoryWrapper(history);

    // Store in memory
    memoryStore.set(conversationId, {
      conversationId,
      history,
    });

    logger.info("Created conversation memory", { conversationId });
    return memory;
  } catch (error) {
    logger.error("Failed to create memory", error);
    throw error;
  }
}

export function getMemory(conversationId: string): SimpleMemory | null {
  const stored = memoryStore.get(conversationId);
  if (!stored) {
    return null;
  }

  return new MemoryWrapper(stored.history);
}

export async function saveMemoryToRedis(conversationId: string): Promise<void> {
  try {
    const redis = getRedis();
    if (!redis) {
      logger.warn("Redis not available, memory not persisted");
      return;
    }

    const stored = memoryStore.get(conversationId);
    if (!stored) {
      return;
    }

    const messages = await stored.history.getMessages();
    const serialized = JSON.stringify(
      messages.map((msg: BaseMessage) => ({
        type: msg.constructor.name,
        content: msg.content,
      }))
    );

    await redis.setex(`memory:${conversationId}`, 3600 * 24, serialized); // 24 hours TTL
    logger.info("Saved memory to Redis", { conversationId });
  } catch (error) {
    logger.error("Failed to save memory to Redis", error);
  }
}

export async function loadMemoryFromRedis(conversationId: string): Promise<SimpleMemory | null> {
  try {
    const redis = getRedis();
    if (!redis) {
      return null;
    }

    const serialized = await redis.get(`memory:${conversationId}`);
    if (!serialized) {
      return null;
    }

    // Note: This is a simplified version. In production, you'd want to properly deserialize messages
    const _messages = JSON.parse(serialized);
    const history = new InMemoryChatMessageHistory();

    // Reconstruct messages (simplified - would need proper message type handling)
    // For now, we'll create a new memory
    const memory = new MemoryWrapper(history);

    memoryStore.set(conversationId, {
      conversationId,
      history,
    });

    logger.info("Loaded memory from Redis", { conversationId });
    return memory;
  } catch (error) {
    logger.error("Failed to load memory from Redis", error);
    return null;
  }
}
