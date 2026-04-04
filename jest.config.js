/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        moduleResolution: 'node10',
        ignoreDeprecations: '6.0',
        esModuleInterop: true,
        allowJs: true,
        strict: true,
        target: 'es2017',
        rootDir: '.',
        paths: { '@/*': ['./src/*'] },
      },
    }],
  },
};
