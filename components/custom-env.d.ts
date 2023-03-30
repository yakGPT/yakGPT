// custom-env.d.ts
declare module "*.mp3" {
  const src: string;
  export default src;
}
