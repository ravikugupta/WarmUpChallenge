import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import React from 'react';

// Mock matchMedia for motion/react
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock Supabase
vi.mock('./lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
          order: vi.fn(() => ({
              limit: vi.fn(() => Promise.resolve({ data: [] }))
          })),
          single: vi.fn(() => Promise.resolve({ data: null }))
      })),
    })),
  },
}));

describe('App Component', () => {
  it('renders Nexus title in header', () => {
    render(<App />);
    const titleElement = screen.getByText(/Nexus/i);
    expect(titleElement).toBeInTheDocument();
  });

  it('renders Intake screen by default', () => {
    render(<App />);
    const intakePrompt = screen.getByText(/I'm Nexus. What's the situation?/i);
    expect(intakePrompt).toBeInTheDocument();
  });
});
