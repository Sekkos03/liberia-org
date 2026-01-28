// Add this to your existing vite-env.d.ts or create a new assets.d.ts file

declare module "*.pdf" {
  const src: string;
  export default src;
}
