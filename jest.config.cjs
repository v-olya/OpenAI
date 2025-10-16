/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    verbose: true,
    testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
    maxWorkers: 1,
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
            diagnostics: false,
            isolatedModules: true,
        },
    },
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    // Don't collect coverage by default for `npm test` runs; use --coverage when needed
    collectCoverage: false,
    coverageDirectory: '<rootDir>/coverage',
    // Only collect coverage from project source files (not tests or build files)
    collectCoverageFrom: [
        'app/**/*.{ts,tsx}',
        'utils/**/*.{ts,tsx}',
        'api/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
        '!**/*.d.ts',
    ],
    coveragePathIgnorePatterns: ['/node_modules/', '/tests/'],
    // Start with permissive thresholds so CI doesn't fail
    coverageThreshold: {
        global: {
            branches: 0,
            functions: 0,
            lines: 0,
            statements: 0,
        },
    },
};
