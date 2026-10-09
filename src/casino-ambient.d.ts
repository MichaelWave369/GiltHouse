/** Lets the existing casino WebGL modules typecheck. Runtime still uses the real three package. */
declare module "three";

interface XRSession extends EventTarget {
  environmentBlendMode?: string;
}

interface Navigator {
  xr?: {
    isSessionSupported?: (mode: string) => Promise<boolean>;
    requestSession: (mode: string) => Promise<XRSession>;
  };
}
