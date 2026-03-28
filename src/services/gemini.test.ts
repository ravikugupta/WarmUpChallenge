import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeSituation } from './gemini';

// Mock the GoogleGenAI client
const mockGenerateContent = vi.fn();
const mockGetGenerativeModel = vi.fn(() => ({
  generateContent: mockGenerateContent,
}));

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: class {
      getGenerativeModel = mockGetGenerativeModel;
    },
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      NUMBER: 'NUMBER',
      ARRAY: 'ARRAY',
    },
  };
});

// Mock config
vi.mock('../lib/config', () => ({
  getRuntimeConfig: () => ({
    VITE_GEMINI_API_KEY: 'mock-key',
  }),
}));

describe('analyzeSituation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('successfully returns analyzed data from Gemini API', async () => {
    const mockResponse = {
      response: {
        text: () => JSON.stringify({
          situation: 'Test Situation',
          confidence: 95,
          priority: 'High',
          actions: [],
          impactProjection: 'Test Impact',
        }),
      },
    };
    
    mockGenerateContent.mockResolvedValueOnce(mockResponse);

    const result = await analyzeSituation('Help me with sector 4');

    expect(result.situation).toBe('Test Situation');
    expect(result.confidence).toBe(95);
  });

  it('retries on retryable errors (e.g., 503)', async () => {
    vi.useFakeTimers();
    
    const mockError = new Error('503 Service Unavailable');
    const mockSuccessResponse = {
      response: {
        text: () => JSON.stringify({ situation: 'Recovered' }),
      },
    };

    mockGenerateContent
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce(mockSuccessResponse);

    const promise = analyzeSituation('Retry test');
    
    // Fast-forward through the delay
    await vi.runAllTimersAsync();
    
    const result = await promise;
    expect(result.situation).toBe('Recovered');
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it('throws error after max retries', async () => {
    vi.useFakeTimers();
    
    const mockError = new Error('503 Service Unavailable');
    mockGenerateContent.mockRejectedValue(mockError);

    const promise = analyzeSituation('Fail test');
    
    // Fast-forward through multiple retries
    for (let i = 0; i < 4; i++) {
        await vi.runAllTimersAsync();
    }
    
    await expect(promise).rejects.toThrow('503 Service Unavailable');
    expect(mockGenerateContent).toHaveBeenCalledTimes(4); // initial + 3 retries
  });
});
