declare module 'opencv.js' {
  const cv: any;
  export default cv;
}

declare global {
  const cv: any;
}

export {};