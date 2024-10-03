import type { JestConfigWithTsJest } from 'ts-jest';
import { defaults as tsjPreset } from 'ts-jest/presets';


const config: JestConfigWithTsJest = {
  verbose: true,
  moduleFileExtensions: [
    'json',
    'ts',
    'js',
  ],
  transform: {
    ...tsjPreset.transform,
  },
  testMatch: [
    '**/__tests__/**/*.test.(ts|js)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
  ],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.ts',
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/package.json',
    '<rootDir>/package-lock.json',
    '<rootDir>/coverage',
  ],
};

export default config;
