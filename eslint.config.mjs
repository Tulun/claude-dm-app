import coreWebVitals from 'eslint-config-next/core-web-vitals';

const eslintConfig = [
  ...coreWebVitals,
  {
    ignores: ['node_modules/**', '.next/**', 'out/**', 'build/**', 'public/**'],
  },
  {
    rules: {
      // Stylistic churn — apostrophes in JSX text are fine
      'react/no-unescaped-entities': 'off',
      // Legacy "sync state from props when a modal opens" pattern is pervasive
      // here; keep visible as a warning, fix opportunistically
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];

export default eslintConfig;
