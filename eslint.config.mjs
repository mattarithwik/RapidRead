import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    ignores: [".next/**", ".open-next/**", "node_modules/**", "cdk.out/**", ".data/**"]
  }
];

export default config;
